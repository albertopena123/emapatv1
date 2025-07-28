// src/components/reports/alarms-report.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ExportButton } from "./export-button"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"

interface Row {
    getValue: (key: string) => unknown
}

interface AlarmSummary {
    total: number
    active: number
    resolved: number
    bySeverity: Record<string, number>
}

interface AlarmFilters {
    startDate: string
    endDate: string
    alarmType: string
    severity: string
    resolved: string
    sensorId: string
    [key: string]: string // Index signature
}

interface AlarmData {
    id: string
    title: string
    description: string
    severity: string
    timestamp: string
    resolved: boolean
    sensor?: {
        name: string
        numero_medidor: string
    }
    [key: string]: unknown
}

export function AlarmsReport() {
    const [data, setData] = useState<AlarmData[]>([])
    const [summary, setSummary] = useState<AlarmSummary>({
        total: 0,
        active: 0,
        resolved: 0,
        bySeverity: {}
    })
    const [loading, setLoading] = useState(false)
    const [filters, setFilters] = useState<AlarmFilters>({
        startDate: '',
        endDate: '',
        alarmType: 'all',
        severity: 'all',
        resolved: 'all',
        sensorId: ''
    })

    const fetchReport = async () => {
        setLoading(true)
        try {
            // Create params object and filter out 'all' values
            const params = new URLSearchParams()
            Object.entries(filters).forEach(([key, value]) => {
                if (value && value !== 'all') {
                    params.append(key, value)
                }
            })

            const response = await fetch(`/api/reports/alarms?${params}`)
            const result = await response.json()
            setData(result.data)
            setSummary(result.summary)
        } catch (error) {
            console.error('Error fetching alarms report:', error)
        } finally {
            setLoading(false)
        }
    }

    const updateFilter = (key: keyof AlarmFilters, value: string) => {
        setFilters({ ...filters, [key]: value })
    }

    const getSeverityBadge = (severity: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            INFO: "outline",
            WARNING: "secondary",
            CRITICAL: "default",
            EMERGENCY: "destructive"
        }
        return <Badge variant={variants[severity] || "outline"}>{severity}</Badge>
    }

    const getTypeBadge = (type: string) => {
        const colors: Record<string, string> = {
            DAILY_CONSUMPTION: "bg-blue-100 text-blue-800",
            WEEKLY_CONSUMPTION: "bg-green-100 text-green-800",
            LOW_BATTERY: "bg-yellow-100 text-yellow-800",
            NO_COMMUNICATION: "bg-red-100 text-red-800",
            LEAK_DETECTED: "bg-purple-100 text-purple-800"
        }

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
                {type.replace('_', ' ')}
            </span>
        )
    }

    const columns = [
        {
            accessorKey: "title",
            header: "Título",
        },
        {
            accessorKey: "alarmType",
            header: "Tipo",
            cell: ({ row }: { row: Row }) => getTypeBadge(String(row.getValue("alarmType")))
        },
        {
            accessorKey: "severity",
            header: "Severidad",
            cell: ({ row }: { row: Row }) => getSeverityBadge(String(row.getValue("severity")))
        },
        {
            accessorKey: "sensor.numero_medidor",
            header: "Medidor",
        },
        {
            accessorKey: "user.name",
            header: "Cliente",
        },
        {
            accessorKey: "timestamp",
            header: "Fecha",
            cell: ({ row }: { row: Row }) => new Date(String(row.getValue("timestamp"))).toLocaleString()
        },
        {
            accessorKey: "resolved",
            header: "Estado",
            cell: ({ row }: { row: Row }) => (
                <Badge variant={row.getValue("resolved") ? "default" : "destructive"}>
                    {row.getValue("resolved") ? "Resuelto" : "Activo"}
                </Badge>
            )
        }
    ]

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Total Alarmas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Activas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{summary.active}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Resueltas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{summary.resolved}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Críticas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            {summary.bySeverity.CRITICAL || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filtros de Alarmas</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
                        <div className="space-y-2">
                            <Label>Fecha Inicio</Label>
                            <Input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => updateFilter('startDate', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Fecha Fin</Label>
                            <Input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => updateFilter('endDate', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <Select value={filters.alarmType} onValueChange={(value) => updateFilter('alarmType', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="DAILY_CONSUMPTION">Consumo Diario</SelectItem>
                                    <SelectItem value="WEEKLY_CONSUMPTION">Consumo Semanal</SelectItem>
                                    <SelectItem value="LOW_BATTERY">Batería Baja</SelectItem>
                                    <SelectItem value="NO_COMMUNICATION">Sin Comunicación</SelectItem>
                                    <SelectItem value="LEAK_DETECTED">Fuga Detectada</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Severidad</Label>
                            <Select value={filters.severity} onValueChange={(value) => updateFilter('severity', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    <SelectItem value="INFO">Info</SelectItem>
                                    <SelectItem value="WARNING">Advertencia</SelectItem>
                                    <SelectItem value="CRITICAL">Crítica</SelectItem>
                                    <SelectItem value="EMERGENCY">Emergencia</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Estado</Label>
                            <Select value={filters.resolved} onValueChange={(value) => updateFilter('resolved', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="true">Resueltos</SelectItem>
                                    <SelectItem value="false">Activos</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>ID Sensor</Label>
                            <Input
                                placeholder="ID del sensor"
                                value={filters.sensorId}
                                onChange={(e) => updateFilter('sensorId', e.target.value)}
                            />
                        </div>
                        <div className="flex items-end">
                            <Button onClick={fetchReport} className="w-full">
                                Generar
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Vista móvil */}
            <div className="sm:hidden space-y-3">
                {loading ? (
                    <div className="text-center py-8">Cargando...</div>
                ) : data.length === 0 ? (
                    <Card className="p-4">
                        <p className="text-center text-muted-foreground">No hay alarmas para mostrar</p>
                    </Card>
                ) : (
                    data.map((item) => (
                        <Card key={item.id} className="p-3">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-sm">{item.title}</span>
                                {getSeverityBadge(item.severity)}
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                                <div>{item?.description}</div>
                                <div>Sensor: {item.sensor?.name || 'N/A'}</div>
                                <div className="flex items-center gap-2">
                                    <span>Estado:</span>
                                    {item.resolved ?
                                        <Badge variant="outline" className="text-xs">Resuelto</Badge> :
                                        <Badge variant="destructive" className="text-xs">Activo</Badge>
                                    }
                                </div>
                                <div>{new Date(item.timestamp).toLocaleDateString()}</div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Vista desktop */}
            <Card className="hidden sm:block">
                <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
                    <div className="space-y-1">
                        <CardTitle className="text-lg sm:text-xl">Alarmas</CardTitle>
                        <CardDescription className="text-sm">
                            Historial de alarmas del sistema
                        </CardDescription>
                    </div>
                    <ExportButton
                        reportType="alarms"
                        filters={filters}
                        className="w-full sm:w-auto"
                    />
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
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