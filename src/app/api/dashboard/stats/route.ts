// src/app/api/dashboard/stats/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { jwtVerify } from "jose"

const secret = new TextEncoder().encode(
    process.env.JWT_SECRET || "your-secret-key-change-this"
)

async function getUser() {
    const headersList = await headers()
    const cookieHeader = headersList.get("cookie")
    
    if (!cookieHeader) return null
    
    const token = cookieHeader.split("; ")
        .find((row: string) => row.startsWith("auth-token="))
        ?.split("=")[1]
    
    if (!token) return null
    
    try {
        const { payload } = await jwtVerify(token, secret)
        return payload
    } catch {
        return null
    }
}

export async function GET() {
    try {
        const user = await getUser()
        if (!user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const currentDate = new Date()
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
        const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)

        if (user.isSuperAdmin) {
            // Estadísticas para admin
            const [
                totalUsers,
                activeUsers,
                totalSensors,
                activeSensors,
                monthlyConsumption,
                lastMonthConsumption,
                monthlyRevenue,
                recentActivity,
                activeAlarms
            ] = await Promise.all([
                // Total usuarios
                prisma.user.count(),
                // Usuarios activos este mes
                prisma.user.count({
                    where: {
                        lastLogin: {
                            gte: startOfMonth
                        }
                    }
                }),
                // Total sensores
                prisma.sensor.count(),
                // Sensores activos
                prisma.sensor.count({
                    where: { status: "ACTIVE" }
                }),
                // Consumo mensual actual
                prisma.waterConsumption.aggregate({
                    _sum: { consumption: true },
                    where: {
                        readingDate: {
                            gte: startOfMonth,
                            lte: endOfMonth
                        }
                    }
                }),
                // Consumo mes anterior
                prisma.waterConsumption.aggregate({
                    _sum: { consumption: true },
                    where: {
                        readingDate: {
                            gte: lastMonth,
                            lt: startOfMonth
                        }
                    }
                }),
                // Ingresos del mes
                prisma.invoice.aggregate({
                    _sum: { totalAmount: true },
                    where: {
                        status: "PAID",
                        paidAt: {
                            gte: startOfMonth,
                            lte: endOfMonth
                        }
                    }
                }),
                // Actividad reciente
                prisma.sensor.findMany({
                    where: {
                        updatedAt: {
                            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // últimas 24 horas
                        }
                    },
                    select: {
                        id: true,
                        name: true,
                        numero_medidor: true,
                        status: true,
                        updatedAt: true
                    },
                    orderBy: { updatedAt: 'desc' },
                    take: 5
                }),
                // Alarmas activas
                prisma.alarmHistory.findMany({
                    where: {
                        resolved: false
                    },
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        severity: true,
                        timestamp: true,
                        sensor: {
                            select: {
                                name: true,
                                direccion: true
                            }
                        }
                    },
                    orderBy: { timestamp: 'desc' },
                    take: 5
                })
            ])

            // Calcular porcentajes
            const userGrowth = activeUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0
            const sensorOperational = totalSensors > 0 ? ((activeSensors / totalSensors) * 100).toFixed(1) : 0
            
            const currentConsumption = monthlyConsumption._sum.consumption || 0
            const previousConsumption = lastMonthConsumption._sum.consumption || 0
            const consumptionChange = previousConsumption > 0 
                ? (((currentConsumption - previousConsumption) / previousConsumption) * 100).toFixed(1)
                : 0

            return NextResponse.json({
                stats: {
                    totalUsers,
                    userGrowth,
                    activeSensors,
                    totalSensors,
                    sensorOperational,
                    monthlyConsumption: currentConsumption,
                    consumptionChange,
                    monthlyRevenue: monthlyRevenue._sum.totalAmount || 0
                },
                recentActivity,
                activeAlarms
            })
        } else {
            // Estadísticas para usuario normal
            const userId = user.userId as string

            const [
                userSensors,
                currentConsumption,
                lastInvoices,
                consumptionHistory,
                batteryStatus
            ] = await Promise.all([
                // Sensores del usuario
                prisma.sensor.findMany({
                    where: { userId },
                    select: {
                        id: true,
                        name: true,
                        numero_medidor: true,
                        status: true,
                        direccion: true,
                        lastCommunication: true
                    }
                }),
                // Consumo actual del mes
                prisma.waterConsumption.aggregate({
                    _sum: { consumption: true },
                    where: {
                        userId,
                        readingDate: {
                            gte: startOfMonth,
                            lte: endOfMonth
                        }
                    }
                }),
                // Últimas facturas
                prisma.invoice.findMany({
                    where: { userId },
                    select: {
                        id: true,
                        invoiceNumber: true,
                        totalAmount: true,
                        status: true,
                        dueDate: true,
                        periodStart: true,
                        periodEnd: true,
                        issuedAt: true,
                        amountDue: true
                    },
                    orderBy: { issuedAt: 'desc' },
                    take: 5
                }),
                // Historial de consumo (últimos 30 días)
                prisma.waterConsumption.findMany({
                    where: {
                        userId,
                        readingDate: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // últimos 30 días
                        }
                    },
                    orderBy: {
                        readingDate: 'asc'
                    },
                    select: {
                        id: true,
                        amount: true,
                        consumption: true,
                        readingDate: true,
                        timestamp: true
                    }
                }),
                // Estado de batería - última lectura por sensor
                prisma.batteryHistory.findMany({
                    where: {
                        sensor: {
                            userId
                        }
                    },
                    orderBy: {
                        timestamp: 'desc'
                    },
                    distinct: ['deviceEui'],
                    select: {
                        deviceEui: true,
                        voltage: true,
                        percentage: true,
                        timestamp: true,
                        sensor: {
                            select: {
                                name: true,
                                numero_medidor: true
                            }
                        }
                    }
                })
            ])

            // Última lectura
            const lastReading = await prisma.waterConsumption.findFirst({
                where: { userId },
                orderBy: { readingDate: 'desc' },
                select: {
                    amount: true,
                    readingDate: true,
                    consumption: true
                }
            })

            return NextResponse.json({
                sensors: userSensors,
                currentConsumption: currentConsumption._sum.consumption || 0,
                lastReading,
                invoices: lastInvoices,
                consumptionHistory, // nuevo
                batteryStatus // nuevo
            })
        }
    } catch (error) {
        console.error("Error fetching dashboard stats:", error)
        return NextResponse.json(
            { error: "Error al obtener estadísticas" },
            { status: 500 }
        )
    }
}