// src/app/api/reports/sensors/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { SensorStatus } from "@prisma/client"

const sensorsReportSchema = z.object({
    status: z.string().optional().transform(val => val === '' || val === 'ALL' ? undefined : val),
    mapId: z.string().optional().transform(val => val === '' || val === 'ALL' ? undefined : val),
    dni: z.string().optional().transform(val => val === '' ? undefined : val),
    userId: z.string().optional().transform(val => val === '' ? undefined : val),
    lastCommunicationDays: z.string().optional().transform(val => val === '' ? undefined : val)
})

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const params = {
            status: searchParams.get('status'),
            mapId: searchParams.get('mapId'),
            dni: searchParams.get('dni'),
            userId: searchParams.get('userId'),
            lastCommunicationDays: searchParams.get('lastCommunicationDays')
        }

        const validatedParams = sensorsReportSchema.parse(params)

        const whereClause: {
            status?: SensorStatus
            location?: { mapId: number }
            userId?: string
            lastCommunication?: { lt: Date }
        } = {}

        if (validatedParams.status) {
            whereClause.status = validatedParams.status as SensorStatus
        }

        if (validatedParams.mapId) {
            whereClause.location = { mapId: parseInt(validatedParams.mapId) }
        }

        // Manejar búsqueda por DNI
        if (validatedParams.dni) {
            const user = await prisma.user.findUnique({
                where: { dni: validatedParams.dni },
                select: { id: true }
            })
            if (user) {
                whereClause.userId = user.id
            } else {
                // Si no se encuentra el DNI, retornar resultados vacíos
                return NextResponse.json({
                    data: [],
                    summary: {
                        total: 0,
                        byStatus: {},
                        withoutCommunication: 0
                    }
                })
            }
        } else if (validatedParams.userId) {
            whereClause.userId = validatedParams.userId
        }

        if (validatedParams.lastCommunicationDays) {
            const days = parseInt(validatedParams.lastCommunicationDays)
            const date = new Date()
            date.setDate(date.getDate() - days)
            whereClause.lastCommunication = { lt: date }
        }

        const sensors = await prisma.sensor.findMany({
            where: whereClause,
            include: {
                user: {
                    select: { 
                        name: true,
                        dni: true
                    }
                },
                location: {
                    select: { 
                        address: true,
                        map: {
                            select: { name: true }
                        }
                    }
                },
                _count: {
                    select: { waterConsumptions: true }
                }
            }
        })

        // Calculate summary
        const summary = {
            total: sensors.length,
            byStatus: sensors.reduce((acc, sensor) => {
                acc[sensor.status] = (acc[sensor.status] || 0) + 1
                return acc
            }, {} as Record<string, number>),
            withoutCommunication: sensors.filter(s => 
                !s.lastCommunication || 
                (Date.now() - new Date(s.lastCommunication).getTime()) > 7 * 24 * 60 * 60 * 1000
            ).length
        }

        return NextResponse.json({
            data: sensors,
            summary
        })

    } catch (error) {
        console.error("Error fetching sensors report:", error)
        
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Parámetros inválidos", details: error.format() },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: "Error al generar reporte de sensores" },
            { status: 500 }
        )
    }
}