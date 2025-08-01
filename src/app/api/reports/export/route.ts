// src/app/api/reports/export/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { SensorStatus, InvoiceStatus } from "@prisma/client"
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

const PERU_TIMEZONE = 'America/Lima'

interface ReportFilters {
    startDate?: string
    endDate?: string
    sensorId?: string
    userId?: string
    status?: string
    dni?: string
    [key: string]: string | undefined
}

interface ConsumptionDataRow {
    fecha: string
    sensor: string
    usuario: string
    lectura_anterior: number
    lectura_actual: number
    consumo: number
    facturado: string
}

interface BillingDataRow {
    numero_factura: string
    fecha_emision: string
    cliente: string
    dni: string
    sensor: string
    numero_medidor: string
    consumo: number
    total: number
    estado: string
    pagado: string
}

interface AlarmDataRow {
    fecha: string
    tipo: string
    severidad: string
    titulo: string
    descripcion: string
    usuario: string
    sensor: string
    reconocida: string
    resuelta: string
}

interface SensorDataRow {
    nombre: string
    numero_medidor: string
    cliente: string
    estado: string
    ultima_comunicacion: string
    direccion: string
    ciclo: string
    actividad: string
}

type ReportDataRow = ConsumptionDataRow | BillingDataRow | AlarmDataRow | SensorDataRow

export async function POST(request: NextRequest) {
    try {
        const { reportType, format, filters } = await request.json()

        let data: ReportDataRow[] = []

        // Obtener datos según el tipo de reporte
        switch (reportType) {
            case 'consumption':
                data = await getConsumptionData(filters)
                break
            case 'billing':
                data = await getBillingData(filters)
                break
            case 'alarms':
                data = await getAlarmsData(filters)
                break
            case 'sensors':
                data = await getSensorsData(filters)
                break
            default:
                return NextResponse.json(
                    { error: "Tipo de reporte no válido" },
                    { status: 400 }
                )
        }

        // Generar archivo según formato
        let fileContent: string | Buffer
        let contentType: string
        
        switch (format) {
            case 'csv':
                fileContent = generateCSV(data, reportType)
                contentType = 'text/csv'
                break
            case 'xlsx':
                fileContent = generateExcel(data, reportType)
                contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                break
            case 'pdf':
                fileContent = await generatePDF(data, reportType)
                contentType = 'application/pdf'
                break
            default:
                return NextResponse.json(
                    { error: "Formato no válido" },
                    { status: 400 }
                )
        }

        return new NextResponse(fileContent, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${reportType}_${new Date().toISOString().split('T')[0]}.${format}"`
            }
        })

    } catch (error) {
        console.error("Error exporting report:", error)
        return NextResponse.json(
            { error: "Error al exportar reporte" },
            { status: 500 }
        )
    }
}

async function getConsumptionData(filters: ReportFilters): Promise<ConsumptionDataRow[]> {
    const whereClause: {
        readingDate?: { gte: Date; lte: Date }
        serial?: string
        userId?: string
    } = {}
    
    if (filters.startDate && filters.endDate) {
        // Convertir fechas a UTC considerando zona horaria de Perú
        const startDatePeru = new Date(filters.startDate + 'T00:00:00')
        const endDatePeru = new Date(filters.endDate + 'T23:59:59')
        
        const startDateUTC = fromZonedTime(startDatePeru, PERU_TIMEZONE)
        const endDateUTC = fromZonedTime(endDatePeru, PERU_TIMEZONE)
        
        whereClause.readingDate = {
            gte: startDateUTC,
            lte: endDateUTC
        }
    }
    
    if (filters.sensorId && filters.sensorId !== '') {
        whereClause.serial = filters.sensorId
    }
    
    if (filters.userId && filters.userId !== '') {
        whereClause.userId = filters.userId
    }

    const consumption = await prisma.waterConsumption.findMany({
        where: whereClause,
        include: {
            sensor: {
                include: {
                    user: {
                        select: { name: true, email: true }
                    }
                }
            }
        },
        orderBy: { readingDate: 'desc' }
    })

    return consumption.map(item => ({
        fecha: toZonedTime(new Date(item.readingDate), PERU_TIMEZONE).toLocaleDateString('es-ES'),
        sensor: item.sensor.name,
        usuario: item.sensor.user.name || item.sensor.user.email || 'Sin nombre',
        lectura_anterior: Number((item.previousAmount || 0).toFixed(2)),
        lectura_actual: Number(item.amount.toFixed(2)),
        consumo: Number((item.consumption || 0).toFixed(2)),
        facturado: item.invoiced ? 'Sí' : 'No'
    }))
}

async function getBillingData(filters: ReportFilters): Promise<BillingDataRow[]> {
    const whereClause: {
        issuedAt?: { gte: Date; lte: Date }
        status?: InvoiceStatus
        userId?: string
        sensorId?: number
    } = {}
    
    if (filters.startDate && filters.endDate) {
        // Convertir fechas a UTC considerando zona horaria de Perú
        const startDatePeru = new Date(filters.startDate + 'T00:00:00')
        const endDatePeru = new Date(filters.endDate + 'T23:59:59')
        
        const startDateUTC = fromZonedTime(startDatePeru, PERU_TIMEZONE)
        const endDateUTC = fromZonedTime(endDatePeru, PERU_TIMEZONE)
        
        whereClause.issuedAt = {
            gte: startDateUTC,
            lte: endDateUTC
        }
    }

    if (filters.status && filters.status !== 'ALL') {
        whereClause.status = filters.status as InvoiceStatus
    }

    // Manejar búsqueda por DNI
    if (filters.dni) {
        const user = await prisma.user.findUnique({
            where: { dni: filters.dni },
            select: { id: true }
        })
        if (user) {
            whereClause.userId = user.id
        } else {
            return [] // No se encontró el usuario
        }
    } else if (filters.userId) {
        whereClause.userId = filters.userId
    }

    if (filters.sensorId && filters.sensorId !== 'ALL') {
        whereClause.sensorId = parseInt(filters.sensorId)
    }

    const invoices = await prisma.invoice.findMany({
        where: whereClause,
        include: {
            user: true,
            sensor: true
        },
        orderBy: { issuedAt: 'desc' }
    })

    return invoices.map(invoice => ({
        numero_factura: invoice.invoiceNumber,
        fecha_emision: toZonedTime(new Date(invoice.issuedAt), PERU_TIMEZONE).toLocaleDateString('es-ES'),
        cliente: invoice.user.name || invoice.user.email || 'Sin nombre',
        dni: invoice.user.dni,
        sensor: invoice.sensor.name,
        numero_medidor: invoice.sensor.numero_medidor,
        consumo: Number(invoice.consumptionAmount.toFixed(2)),
        total: Number(invoice.totalAmount.toFixed(2)),
        estado: invoice.status,
        pagado: invoice.paidAt ? 
            toZonedTime(new Date(invoice.paidAt), PERU_TIMEZONE).toLocaleDateString('es-ES') : 
            'Pendiente'
    }))
}

async function getAlarmsData(filters: ReportFilters): Promise<AlarmDataRow[]> {
    const whereClause: {
        timestamp?: { gte: Date; lte: Date }
    } = {}
    
    if (filters.startDate && filters.endDate) {
        // Convertir fechas a UTC considerando zona horaria de Perú
        const startDatePeru = new Date(filters.startDate + 'T00:00:00')
        const endDatePeru = new Date(filters.endDate + 'T23:59:59')
        
        const startDateUTC = fromZonedTime(startDatePeru, PERU_TIMEZONE)
        const endDateUTC = fromZonedTime(endDatePeru, PERU_TIMEZONE)
        
        whereClause.timestamp = {
            gte: startDateUTC,
            lte: endDateUTC
        }
    }

    const alarms = await prisma.alarmHistory.findMany({
        where: whereClause,
        include: {
            user: true,
            sensor: true
        },
        orderBy: { timestamp: 'desc' }
    })

    return alarms.map(alarm => ({
        fecha: toZonedTime(new Date(alarm.timestamp), PERU_TIMEZONE).toLocaleString('es-ES'),
        tipo: alarm.alarmType,
        severidad: alarm.severity,
        titulo: alarm.title,
        descripcion: alarm.description,
        usuario: alarm.user.name || alarm.user.email || 'Sin usuario',
        sensor: alarm.sensor?.name || 'N/A',
        reconocida: alarm.acknowledged ? 'Sí' : 'No',
        resuelta: alarm.resolved ? 'Sí' : 'No'
    }))
}

function generateCSV(data: ReportDataRow[], reportType: string): string {
    if (data.length === 0) return ''
    
    const headers = Object.keys(data[0])
    const csvHeaders = headers.join(',')
    
    const csvRows = data.map(row => 
        headers.map(header => {
            const value = (row as unknown as Record<string, unknown>)[header]
            // Escapar valores que contengan comas o comillas
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`
            }
            return value
        }).join(',')
    )
    
    return [csvHeaders, ...csvRows].join('\n')
}

function generateExcel(data: ReportDataRow[], reportType: string): Buffer {
    // Crear libro de trabajo
    const workbook = XLSX.utils.book_new()
    
    // Convertir datos a hoja de cálculo
    const worksheet = XLSX.utils.json_to_sheet(data)
    
    // Ajustar ancho de columnas
    const cols = Object.keys(data[0] || {}).map(() => ({ wch: 20 }))
    worksheet['!cols'] = cols
    
    // Agregar hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, reportType)
    
    // Escribir a buffer
    const buffer = XLSX.write(workbook, { 
        type: 'buffer', 
        bookType: 'xlsx' 
    })
    
    return buffer
}

async function generatePDF(data: ReportDataRow[], reportType: string): Promise<Buffer> {
    const doc = new jsPDF()
    
    // Título
    doc.setFontSize(18)
    const titles: Record<string, string> = {
        consumption: 'Consumo',
        billing: 'Facturación',
        alarms: 'Alarmas',
        sensors: 'Sensores'
    }
    doc.text(`Reporte de ${titles[reportType] || reportType}`, 14, 22)
    
    // Fecha
    doc.setFontSize(11)
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 14, 32)
    
    // Tabla con datos
    if (data.length > 0) {
        const headers = Object.keys(data[0])
        const rows = data.map(item => Object.values(item))
        
        autoTable(doc, {
            head: [headers],
            body: rows,
            startY: 40,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [66, 139, 202] }
        })
    }
    
    // Convertir a buffer
    const pdfOutput = doc.output('arraybuffer')
    return Buffer.from(pdfOutput)
}

async function getSensorsData(filters: ReportFilters) {
    const whereClause: {
        status?: SensorStatus
        locationId?: number
        userId?: string
        lastCommunication?: { lt?: Date }
    } = {}

    if (filters.status && filters.status !== 'ALL' && filters.status !== '') {
        whereClause.status = filters.status as SensorStatus
    }

    if (filters.locationId && filters.locationId !== '') {
        whereClause.locationId = parseInt(filters.locationId)
    }

    if (filters.userId && filters.userId !== '') {
        whereClause.userId = filters.userId
    }

    if (filters.lastCommunicationDays && filters.lastCommunicationDays !== '') {
        const days = parseInt(filters.lastCommunicationDays)
        const date = new Date()
        date.setDate(date.getDate() - days)
        whereClause.lastCommunication = { lt: date }
    }

    const sensors = await prisma.sensor.findMany({
        where: whereClause,
        include: {
            user: {
                select: { name: true }
            },
            location: {
                select: { address: true }
            }
        }
    })

    return sensors.map(sensor => ({
        nombre: sensor.name,
        numero_medidor: sensor.numero_medidor,
        cliente: sensor.user.name || 'Sin nombre',
        estado: sensor.status,
        ultima_comunicacion: sensor.lastCommunication ? 
            toZonedTime(new Date(sensor.lastCommunication), PERU_TIMEZONE).toLocaleString('es-ES') : 
            'Sin comunicación',
        direccion: sensor.direccion,
        ciclo: sensor.ciclo,
        actividad: sensor.actividad
    }))
}