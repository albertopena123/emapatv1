// src/app/api/reports/consumption/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const consumptionReportSchema = z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // Acepta formato YYYY-MM-DD
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    sensorId: z.string().optional().transform(val => val === '' ? undefined : val),
    userId: z.string().optional().transform(val => val === '' ? undefined : val),
    groupBy: z.enum(['day', 'week', 'month']).default('day'),
    tariffCategory: z.string().optional().nullable().transform(val => val === '' || val === null ? undefined : val)
})

interface WhereClause {
    readingDate: {
        gte: Date
        lte: Date
    }
    serial?: string
    userId?: string
}

interface ConsumptionItem {
    readingDate: string | Date
    consumption: number | null
    sensor: {
        name: string
        user: {
            name: string | null
            email: string | null
        }
        tariffCategory: unknown
    }
    tarifa: unknown
}

interface GroupedItem {
    period: string
    totalConsumption: number
    count: number
    sensors: Set<string>
}

interface GroupedResult {
    period: string
    totalConsumption: number
    count: number
    sensors: string[]
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const params = {
            startDate: searchParams.get('startDate'),
            endDate: searchParams.get('endDate'),
            sensorId: searchParams.get('sensorId'),
            userId: searchParams.get('userId'),
            groupBy: searchParams.get('groupBy') || 'day',
            tariffCategory: searchParams.get('tariffCategory')
        }

        const validatedParams = consumptionReportSchema.parse(params)

        // Crear objetos Date con hora inicio/fin del día
        const startDate = new Date(validatedParams.startDate)
        startDate.setHours(0, 0, 0, 0)
        
        const endDate = new Date(validatedParams.endDate)
        endDate.setHours(23, 59, 59, 999)

        const whereClause: WhereClause = {
            readingDate: {
                gte: startDate,
                lte: endDate
            }
        }

        if (validatedParams.sensorId) {
            whereClause.serial = validatedParams.sensorId
        }

        if (validatedParams.userId) {
            whereClause.userId = validatedParams.userId
        }

        const consumption = await prisma.waterConsumption.findMany({
            where: whereClause,
            include: {
                sensor: {
                    include: {
                        user: {
                            select: { name: true, email: true }
                        },
                        tariffCategory: true
                    }
                },
                tarifa: true
            },
            orderBy: { readingDate: 'desc' }
        })

        // Agrupar datos según el parámetro groupBy
        const groupedData = groupConsumptionData(consumption as unknown as ConsumptionItem[], validatedParams.groupBy)

        return NextResponse.json({
            data: groupedData,
            total: consumption.length,
            totalConsumption: consumption.reduce((sum, item) => sum + (item.consumption || 0), 0)
        })

    } catch (error) {
        console.error("Error fetching consumption report:", error)
        
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Parámetros inválidos", details: error.format() },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: "Error al generar reporte de consumo" },
            { status: 500 }
        )
    }
}

function groupConsumptionData(data: ConsumptionItem[], groupBy: string): GroupedResult[] {
    const grouped = data.reduce((acc: Record<string, GroupedItem>, item) => {
        let key: string
        const date = new Date(item.readingDate)
        
        switch (groupBy) {
            case 'week':
                const weekStart = new Date(date)
                weekStart.setDate(date.getDate() - date.getDay())
                key = weekStart.toISOString().split('T')[0]
                break
            case 'month':
                key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
                break
            default:
                key = date.toISOString().split('T')[0]
        }

        if (!acc[key]) {
            acc[key] = {
                period: key,
                totalConsumption: 0,
                count: 0,
                sensors: new Set()
            }
        }

        acc[key].totalConsumption += item.consumption || 0
        acc[key].count += 1
        acc[key].sensors.add(item.sensor.name)

        return acc
    }, {})

    return Object.values(grouped).map((item: GroupedItem) => ({
        ...item,
        sensors: Array.from(item.sensors)
    }))
}