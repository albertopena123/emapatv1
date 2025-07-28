// src/components/reports/billing-report.tsx
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

interface BillingSummary {
    totalInvoices: number
    totalAmount: number
    totalPaid: number
    byStatus: Record<string, number>
}

interface BillingFilters {
    startDate: string
    endDate: string
    status: string
    dni: string
    userId: string
    sensorId: string
    [key: string]: string
}

interface BillingData {
    id: number
    invoiceNumber: string
    totalAmount: number
    status: string
    issuedAt: string
    user: {
        name: string | null
        email: string | null
        dni: string
    }
    sensor: {
        name: string
        numero_medidor: string
        direccion: string
    }
    [key: string]: unknown
}

interface Sensor {
    id: number
    name: string
    numero_medidor: string
    direccion: string
    status: string
}

export function BillingReport() {
    const [data, setData] = useState<BillingData[]>([])
    const [summary, setSummary] = useState<BillingSummary>({
        totalInvoices: 0,
        totalAmount: 0,
        totalPaid: 0,
        byStatus: {}
    })
    const [loading, setLoading] = useState(false)
    const [userSensors, setUserSensors] = useState<Sensor[]>([])
    const [loadingSensors, setLoadingSensors] = useState(false)
    const [filters, setFilters] = useState<BillingFilters>({
        startDate: '',
        endDate: '',
        status: '',
        dni: '',
        userId: '',
        sensorId: ''
    })

    const fetchUserByDni = async (dni: string) => {
        if (dni.length < 8) {
            setUserSensors([])
            setFilters(prev => ({ ...prev, userId: '', sensorId: '' }))
            return
        }

        setLoadingSensors(true)
        try {
            const response = await fetch(`/api/users/by-dni?dni=${dni}`)
            if (response.ok) {
                const userData = await response.json()
                setUserSensors(userData.sensors)
                setFilters(prev => ({ ...prev, userId: userData.userId }))
            } else {
                setUserSensors([])
                setFilters(prev => ({ ...prev, userId: '', sensorId: '' }))
            }
        } catch (error) {
            console.error('Error fetching user by DNI:', error)
            setUserSensors([])
        } finally {
            setLoadingSensors(false)
        }
    }

    const fetchReport = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                ...filters,
                status: filters.status === 'ALL' ? '' : filters.status
            })
            const response = await fetch(`/api/reports/billing?${params}`)
            const result = await response.json()
            setData(result.data || [])
            setSummary(result.summary || {
                totalInvoices: 0,
                totalAmount: 0,
                totalPaid: 0,
                byStatus: {}
            })
        } catch (error) {
            console.error('Error fetching billing report:', error)
        } finally {
            setLoading(false)
        }
    }

    const updateFilter = (key: keyof BillingFilters, value: string) => {
        setFilters({ ...filters, [key]: value })

        if (key === 'dni') {
            fetchUserByDni(value)
        }
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            PAID: "default",
            PENDING: "secondary",
            OVERDUE: "destructive",
            CANCELLED: "outline"
        }
        return <Badge variant={variants[status] || "outline"}>{status}</Badge>
    }

    const columns = [
        {
            accessorKey: "invoiceNumber",
            header: "Nº Factura",
        },
        {
            accessorKey: "user.name",
            header: "Cliente",
            cell: ({ row }: { row: Row }) => {
                const name = row.getValue("user.name") as string | null
                return name || 'Sin nombre'
            }
        },
        {
            accessorKey: "user.dni",
            header: "DNI",
        },
        {
            accessorKey: "sensor.numero_medidor",
            header: "Medidor",
        },
        {
            accessorKey: "totalAmount",
            header: "Total",
            cell: ({ row }: { row: Row }) => `S/. ${Number(row.getValue("totalAmount")).toFixed(2)}`
        },
        {
            accessorKey: "status",
            header: "Estado",
            cell: ({ row }: { row: Row }) => getStatusBadge(String(row.getValue("status")))
        },
        {
            accessorKey: "issuedAt",
            header: "Fecha",
            cell: ({ row }: { row: Row }) => new Date(String(row.getValue("issuedAt"))).toLocaleDateString()
        }
    ]

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Total Facturas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.totalInvoices}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Monto Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">S/. {summary.totalAmount.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Total Pagado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">S/. {summary.totalPaid.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Pendiente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">S/. {(summary.totalAmount - summary.totalPaid).toFixed(2)}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filtros de Facturación</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                            <Label>Estado</Label>
                            <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Todos</SelectItem>
                                    <SelectItem value="PENDING">Pendiente</SelectItem>
                                    <SelectItem value="PAID">Pagado</SelectItem>
                                    <SelectItem value="OVERDUE">Vencido</SelectItem>
                                    <SelectItem value="CANCELLED">Cancelado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>DNI Cliente</Label>
                            <Input
                                placeholder="DNI del cliente"
                                value={filters.dni}
                                maxLength={8}
                                onChange={(e) => updateFilter('dni', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Sensor</Label>
                            <Select
                                value={filters.sensorId}
                                onValueChange={(value) => updateFilter('sensorId', value)}
                                disabled={!userSensors.length || loadingSensors}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={
                                        loadingSensors ? "Cargando..." :
                                            userSensors.length ? "Seleccionar sensor" :
                                                "Ingrese DNI primero"
                                    } />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Todos los sensores</SelectItem>
                                    {userSensors.map(sensor => (
                                        <SelectItem key={sensor.id} value={sensor.id.toString()}>
                                            {sensor.name} - {sensor.numero_medidor}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end">
                            <Button onClick={fetchReport} className="w-full">
                                Generar Reporte
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
                        <p className="text-center text-muted-foreground">No hay facturas para mostrar</p>
                    </Card>
                ) : (
                    data.map((item) => (
                        <Card key={item.id} className="p-3">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-sm">{item.invoiceNumber}</span>
                                {getStatusBadge(item.status)}
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                                <div>{item.user.name || 'Sin nombre'}</div>
                                <div>DNI: {item.user.dni}</div>
                                <div className="font-medium text-foreground">
                                    S/. {item.totalAmount.toFixed(2)}
                                </div>
                                <div>{new Date(item.issuedAt).toLocaleDateString()}</div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Vista desktop */}
            <Card className="hidden sm:block">
                <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
                    <div className="space-y-1">
                        <CardTitle className="text-lg sm:text-xl">Facturas</CardTitle>
                        <CardDescription className="text-sm">
                            Lista de facturas generadas
                        </CardDescription>
                    </div>
                    <ExportButton
                        reportType="billing"
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