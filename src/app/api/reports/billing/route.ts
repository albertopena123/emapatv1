// src/app/api/reports/billing/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { InvoiceStatus } from "@prisma/client"

const billingReportSchema = z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
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

        const whereClause: {
            issuedAt?: { gte: Date; lte: Date }
            status?: InvoiceStatus
            userId?: string
            sensorId?: number
        } = {}

        if (validatedParams.startDate && validatedParams.endDate) {
            const startDate = new Date(validatedParams.startDate)
            startDate.setHours(0, 0, 0, 0)
            
            const endDate = new Date(validatedParams.endDate)
            endDate.setHours(23, 59, 59, 999)

            whereClause.issuedAt = {
                gte: startDate,
                lte: endDate
            }
        }

        if (validatedParams.status) {
            whereClause.status = validatedParams.status as InvoiceStatus
        }

        // Handle DNI search
        if (validatedParams.dni) {
            const user = await prisma.user.findUnique({
                where: { dni: validatedParams.dni },
                select: { id: true }
            })
            if (user) {
                whereClause.userId = user.id
            } else {
                // If DNI not found, return empty results
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

        // Calculate summary
        const summary = {
            totalInvoices: invoices.length,
            totalAmount: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
            totalPaid: invoices.reduce((sum, inv) => {
                const paidAmount = inv.payments?.reduce((pSum, p) => pSum + p.amount, 0) || 0
                return sum + paidAmount
            }, 0),
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