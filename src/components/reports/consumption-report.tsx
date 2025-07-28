// src/components/reports/consumption-report.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ReportFilters } from "./report-filters"
import { ExportButton } from "./export-button"
import { DataTable } from "@/components/ui/data-table"

interface Row {
    getValue: (key: string) => unknown
}

interface ConsumptionFilters {
    startDate: string
    endDate: string
    groupBy: string
    sensorId: string
    userId: string
    [key: string]: string
}

interface ConsumptionData {
    period: string
    totalConsumption: number
    count: number
    sensors: string[]
    [key: string]: unknown
}

export function ConsumptionReport() {
    const [data, setData] = useState<ConsumptionData[]>([])
    const [loading, setLoading] = useState(false)
    const [filters, setFilters] = useState<ConsumptionFilters>({
        startDate: '',
        endDate: '',
        groupBy: 'day',
        sensorId: '',
        userId: ''
    })

    const fetchReport = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams(filters)
            const response = await fetch(`/api/reports/consumption?${params}`)
            const result = await response.json()
            setData(result.data)
        } catch (error) {
            console.error('Error fetching consumption report:', error)
        } finally {
            setLoading(false)
        }
    }

    const columns = [
        {
            accessorKey: "period",
            header: "Período",
            // Añadir ancho mínimo para móvil
            size: 120,
        },
        {
            accessorKey: "totalConsumption",
            header: "Consumo (L)",
            size: 120,
            cell: ({ row }: { row: Row }) => {
                const value = Number(row.getValue("totalConsumption"))
                // Formato más compacto para móvil
                return value >= 1000
                    ? `${(value / 1000).toFixed(1)}k`
                    : value.toString()
            }
        },
        {
            accessorKey: "count",
            header: "Registros",
            size: 80,
        },
        {
            accessorKey: "sensors",
            header: "Sensores",
            size: 80,
            cell: ({ row }: { row: Row }) => {
                const sensors = row.getValue("sensors") as string[]
                return sensors?.length || 0
            }
        }
    ]

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl">Reporte de Consumo</CardTitle>
                    <CardDescription className="text-sm">
                        Análisis del consumo de agua por período
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                    <ReportFilters
                        filters={filters}
                        onChange={(newFilters) => setFilters(newFilters as ConsumptionFilters)}
                        onApply={fetchReport}
                    />
                </CardContent>
            </Card>

            <Card> {/* Quita overflow-hidden */}
                <CardHeader className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between p-4 sm:p-6">
                    <div className="space-y-1">
                        <CardTitle className="text-lg sm:text-xl">Datos</CardTitle>
                        <CardDescription className="text-sm">
                            Resultados del reporte de consumo
                        </CardDescription>
                    </div>
                    <ExportButton
                        reportType="consumption"
                        filters={filters}
                        className="w-full sm:w-auto"
                    />
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto"> {/* Quita w-full */}
                        <DataTable
                            columns={columns}
                            data={data}
                            loading={loading}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}