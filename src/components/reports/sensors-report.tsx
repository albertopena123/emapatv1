// src/components/reports/sensors-report.tsx
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

interface SensorsSummary {
    total: number
    byStatus: Record<string, number>
    withoutCommunication: number
}

interface SensorsFilters {
    status: string
    locationId: string
    userId: string
    lastCommunicationDays: string
    [key: string]: string // Index signature
}

interface SensorData {
    id: number
    name: string
    numero_medidor: string
    status: string
    lastCommunication: string | null
    user: {
        name: string
    }
    location: {
        address: string
    }
    _count: {
        waterConsumptions: number
    }
    [key: string]: unknown // Index signature
}

export function SensorsReport() {
    const [data, setData] = useState<SensorData[]>([])
    const [summary, setSummary] = useState<SensorsSummary>({
        total: 0,
        byStatus: {},
        withoutCommunication: 0
    })
    const [loading, setLoading] = useState(false)
    const [filters, setFilters] = useState<SensorsFilters>({
        status: '',
        locationId: '',
        userId: '',
        lastCommunicationDays: ''
    })

    const fetchReport = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams(filters)
            const response = await fetch(`/api/reports/sensors?${params}`)
            const result = await response.json()
            setData(result.data)
            setSummary(result.summary)
        } catch (error) {
            console.error('Error fetching sensors report:', error)
        } finally {
            setLoading(false)
        }
    }

    const updateFilter = (key: keyof SensorsFilters, value: string) => {
        setFilters({ ...filters, [key]: value })
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            ACTIVE: "default",
            INACTIVE: "secondary",
            MAINTENANCE: "outline",
            FAULTY: "destructive"
        }
        return <Badge variant={variants[status] || "outline"}>{status}</Badge>
    }

    const getCommunicationStatus = (lastCommunication: string | null) => {
        if (!lastCommunication) return <Badge variant="destructive">Sin comunicación</Badge>

        const daysDiff = Math.floor((Date.now() - new Date(lastCommunication).getTime()) / (1000 * 60 * 60 * 24))
        if (daysDiff > 7) return <Badge variant="destructive">{daysDiff} días</Badge>
        if (daysDiff > 1) return <Badge variant="secondary">{daysDiff} días</Badge>
        return <Badge variant="default">Reciente</Badge>
    }

    const columns = [
        {
            accessorKey: "name",
            header: "Nombre",
        },
        {
            accessorKey: "numero_medidor",
            header: "N° Medidor",
        },
        {
            accessorKey: "user.name",
            header: "Cliente",
        },
        {
            accessorKey: "status",
            header: "Estado",
            cell: ({ row }: { row: Row }) => getStatusBadge(String(row.getValue("status")))
        },
        {
            accessorKey: "lastCommunication",
            header: "Última Comunicación",
            cell: ({ row }: { row: Row }) => getCommunicationStatus(row.getValue("lastCommunication") as string | null)
        },
        {
            accessorKey: "_count.waterConsumptions",
            header: "Lecturas",
        },
        {
            accessorKey: "location.address",
            header: "Ubicación",
        }
    ]

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Total Sensores</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Activos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {summary.byStatus.ACTIVE || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Inactivos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-600">
                            {summary.byStatus.INACTIVE || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Sin Comunicación</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {summary.withoutCommunication}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filtros de Sensores</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="space-y-2">
                            <Label>Estado</Label>
                            <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Todos</SelectItem>
                                    <SelectItem value="ACTIVE">Activo</SelectItem>
                                    <SelectItem value="INACTIVE">Inactivo</SelectItem>
                                    <SelectItem value="MAINTENANCE">Mantenimiento</SelectItem>
                                    <SelectItem value="FAULTY">Defectuoso</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>ID Ubicación</Label>
                            <Input
                                placeholder="ID de ubicación"
                                value={filters.locationId}
                                onChange={(e) => updateFilter('locationId', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>ID Cliente</Label>
                            <Input
                                placeholder="ID del cliente"
                                value={filters.userId}
                                onChange={(e) => updateFilter('userId', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Sin comunicación (días)</Label>
                            <Input
                                type="number"
                                placeholder="Ej: 7"
                                value={filters.lastCommunicationDays}
                                onChange={(e) => updateFilter('lastCommunicationDays', e.target.value)}
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
                        <p className="text-center text-muted-foreground">No hay sensores para mostrar</p>
                    </Card>
                ) : (
                    data.map((item) => (
                        <Card key={item.id} className="p-3">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-sm">{item.name}</span>
                                {getStatusBadge(item.status)}
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                                <div>Medidor: {item.numero_medidor}</div>
                                <div>Cliente: {item.user.name}</div>
                                <div className="flex items-center gap-2">
                                    <span>Comunicación:</span>
                                    {getCommunicationStatus(item.lastCommunication)}
                                </div>
                                <div>{item.location.address}</div>
                                <div className="font-medium">Lecturas: {item._count.waterConsumptions}</div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Vista desktop */}
            <Card className="hidden sm:block">
                <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
                    <div className="space-y-1">
                        <CardTitle className="text-lg sm:text-xl">Sensores</CardTitle>
                        <CardDescription className="text-sm">
                            Estado y métricas de sensores
                        </CardDescription>
                    </div>
                    <ExportButton
                        reportType="sensors"
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