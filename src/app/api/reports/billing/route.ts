// src/app/api/reports/billing/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { InvoiceStatus } from "@prisma/client"
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

const PERU_TIMEZONE = 'America/Lima'

const billingReportSchema = z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().transform(val => val === '' ? undefined : val),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().transform(val => val === '' ? undefined : val),
    status: z.string().optional().transform(val => val === '' || val === 'ALL' ? undefined : val),
    dni: z.string().optional().transform(val => val === '' ? undefined : val),
    userId: z.string().optional().transform(val => val === '' ? undefined : val),
    sensorId: z.string().optional().transform(val => val === '' || val === 'ALL' ? undefined : val),
})

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const params = {
            startDate: searchParams.get('startDate'),
            endDate: searchParams.get('endDate'),
            status: searchParams.get('status'),
            dni: searchParams.get('dni'),
            userId: searchParams.get('userId'),
            sensorId: searchParams.get('sensorId'),
        }

        const validatedParams = billingReportSchema.parse(params)

        // Si no hay filtros de fecha, usar últimos 30 días por defecto
        if (!validatedParams.startDate && !validatedParams.endDate) {
            const endDate = new Date()
            const startDate = new Date()
            startDate.setDate(startDate.getDate() - 30)
            
            validatedParams.startDate = startDate.toISOString().split('T')[0]
            validatedParams.endDate = endDate.toISOString().split('T')[0]
        }

        const whereClause: {
            issuedAt?: { gte: Date; lte: Date }
            status?: InvoiceStatus
            userId?: string
            sensorId?: number
        } = {}

        if (validatedParams.startDate && validatedParams.endDate) {
            // Crear fechas en zona horaria de Perú
            const startDatePeru = new Date(validatedParams.startDate + 'T00:00:00')
            const endDatePeru = new Date(validatedParams.endDate + 'T23:59:59')

            // Convertir a UTC para la consulta
            const startDateUTC = fromZonedTime(startDatePeru, PERU_TIMEZONE)
            const endDateUTC = fromZonedTime(endDatePeru, PERU_TIMEZONE)

            whereClause.issuedAt = {
                gte: startDateUTC,
                lte: endDateUTC
            }
        }

        if (validatedParams.status) {
            whereClause.status = validatedParams.status as InvoiceStatus
        }

        // Solo buscar por DNI si se proporciona
        if (validatedParams.dni) {
            const user = await prisma.user.findUnique({
                where: { dni: validatedParams.dni },
                select: { id: true }
            })
            if (user) {
                whereClause.userId = user.id
            } else {
                // Si el DNI no existe, retornar resultados vacíos
                return NextResponse.json({
                    data: [],
                    summary: {
                        totalInvoices: 0,
                        totalAmount: 0,
                        totalPaid: 0,
                        byStatus: {}
                    }
                })
            }
        } else if (validatedParams.userId) {
            whereClause.userId = validatedParams.userId
        }

        if (validatedParams.sensorId) {
            whereClause.sensorId = parseInt(validatedParams.sensorId)
        }

        const invoices = await prisma.invoice.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        dni: true
                    }
                },
                sensor: {
                    select: {
                        name: true,
                        numero_medidor: true,
                        direccion: true
                    }
                },
                payments: true
            },
            orderBy: { issuedAt: 'desc' }
        })

        // Calcular resumen con decimales limitados
        const summary = {
            totalInvoices: invoices.length,
            totalAmount: Number(invoices.reduce((sum, inv) => sum + inv.totalAmount, 0).toFixed(2)),
            totalPaid: Number(invoices.reduce((sum, inv) => {
                const paidAmount = inv.payments?.reduce((pSum, p) => pSum + p.amount, 0) || 0
                return sum + paidAmount
            }, 0).toFixed(2)),
            byStatus: invoices.reduce((acc, inv) => {
                acc[inv.status] = (acc[inv.status] || 0) + 1
                return acc
            }, {} as Record<string, number>)
        }

        return NextResponse.json({
            data: invoices,
            summary
        })

    } catch (error) {
        console.error("Error fetching billing report:", error)
        
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Parámetros inválidos", details: error.format() },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: "Error al generar reporte de facturación" },
            { status: 500 }
        )
    }
}