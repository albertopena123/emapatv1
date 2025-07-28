// src/app/api/reports/export/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { SensorStatus } from "@prisma/client"

interface ReportFilters {
    startDate?: string
    endDate?: string
    sensorId?: string
    userId?: string
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
    sensor: string
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
        const startDate = new Date(filters.startDate)
        startDate.setHours(0, 0, 0, 0)
        
        const endDate = new Date(filters.endDate)
        endDate.setHours(23, 59, 59, 999)
        
        whereClause.readingDate = {
            gte: startDate,
            lte: endDate
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
        fecha: new Date(item.readingDate).toLocaleDateString('es-ES'),
        sensor: item.sensor.name,
        usuario: item.sensor.user.name || item.sensor.user.email || 'Sin nombre',
        lectura_anterior: item.previousAmount || 0,
        lectura_actual: item.amount,
        consumo: item.consumption || 0,
        facturado: item.invoiced ? 'Sí' : 'No'
    }))
}

async function getBillingData(filters: ReportFilters): Promise<BillingDataRow[]> {
    const whereClause: {
        issuedAt?: { gte: Date; lte: Date }
    } = {}
    
    if (filters.startDate && filters.endDate) {
        whereClause.issuedAt = {
            gte: new Date(filters.startDate),
            lte: new Date(filters.endDate)
        }
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
        fecha_emision: new Date(invoice.issuedAt).toLocaleDateString('es-ES'),
        cliente: invoice.user.name || invoice.user.email || 'Sin nombre',
        sensor: invoice.sensor.name,
        consumo: invoice.consumptionAmount,
        total: invoice.totalAmount,
        estado: String(invoice.status),
        pagado: invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString('es-ES') : 'Pendiente'
    }))
}

async function getAlarmsData(filters: ReportFilters): Promise<AlarmDataRow[]> {
    const whereClause: {
        timestamp?: { gte: Date; lte: Date }
    } = {}
    
    if (filters.startDate && filters.endDate) {
        whereClause.timestamp = {
            gte: new Date(filters.startDate),
            lte: new Date(filters.endDate)
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
        fecha: new Date(alarm.timestamp).toLocaleString('es-ES'),
        tipo: String(alarm.alarmType),
        severidad: String(alarm.severity),
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
    doc.text(`Reporte de ${reportType}`, 14, 22)
    
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
            styles: { fontSize: 10 },
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
        estado: String(sensor.status),
        ultima_comunicacion: sensor.lastCommunication ? 
            new Date(sensor.lastCommunication).toLocaleString('es-ES') : 
            'Sin comunicación',
        direccion: sensor.location?.address || 'Sin dirección',
        ciclo: sensor.ciclo,
        actividad: sensor.actividad
    }))
}