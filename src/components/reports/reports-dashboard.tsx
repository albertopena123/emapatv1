
// ============================================================================
// src/components/reports/reports-dashboard.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Droplet, DollarSign, Cpu, AlertTriangle } from "lucide-react"

interface DashboardStats {
    totalConsumption: number
    totalRevenue: number
    activeSensors: number
    activeAlarms: number
}

export function ReportsDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalConsumption: 0,
        totalRevenue: 0,
        activeSensors: 0,
        activeAlarms: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardStats()
    }, [])

    const fetchDashboardStats = async () => {
        try {
            // Aquí harías las llamadas a las APIs
            // const response = await fetch('/api/reports/dashboard')
            // const data = await response.json()

            // Datos de ejemplo
            setStats({
                totalConsumption: 125000,
                totalRevenue: 89500,
                activeSensors: 342,
                activeAlarms: 12
            })
        } catch (error) {
            console.error('Error fetching dashboard stats:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div>Cargando estadísticas...</div>
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Consumo Total
                    </CardTitle>
                    <Droplet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalConsumption.toLocaleString()} L</div>
                    <p className="text-xs text-muted-foreground">
                        Este mes
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Ingresos
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">S/. {stats.totalRevenue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                        Este mes
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Sensores Activos
                    </CardTitle>
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.activeSensors}</div>
                    <p className="text-xs text-muted-foreground">
                        De 400 total
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Alarmas Activas
                    </CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.activeAlarms}</div>
                    <p className="text-xs text-muted-foreground">
                        Requieren atención
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
