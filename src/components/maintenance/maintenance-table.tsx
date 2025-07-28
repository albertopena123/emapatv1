// src/components/maintenance/maintenance-table.tsx
"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Edit, Trash2, Search, Calendar, User, Wrench, ChevronLeft, ChevronRight } from "lucide-react"
import { MaintenanceForm } from "./maintenance-form"

interface Maintenance {
    id: string
    sensorId: number
    type: 'PREVENTIVE' | 'CORRECTIVE' | 'CALIBRATION' | 'INSTALLATION' | 'UNINSTALLATION'
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
    scheduledDate: string
    startDate?: string
    endDate?: string
    technician?: string
    description: string
    findings?: string
    actionsTaken?: string
    partsReplaced: string[]
    cost?: number
    nextMaintenance?: string
    sensor: {
        id: number
        name: string
        numero_medidor: string
        user: {
            name: string
            dni: string
        }
    }
    createdAt: string
}

interface MaintenanceTableProps {
    refreshTrigger?: number
}

const typeLabels = {
    PREVENTIVE: 'Preventivo',
    CORRECTIVE: 'Correctivo',
    CALIBRATION: 'Calibración',
    INSTALLATION: 'Instalación',
    UNINSTALLATION: 'Desinstalación'
}

const statusLabels = {
    SCHEDULED: 'Programado',
    IN_PROGRESS: 'En Progreso',
    COMPLETED: 'Completado',
    CANCELLED: 'Cancelado'
}

const statusColors = {
    SCHEDULED: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800'
}

const typeColors = {
    PREVENTIVE: 'bg-green-50 text-green-700',
    CORRECTIVE: 'bg-red-50 text-red-700',
    CALIBRATION: 'bg-blue-50 text-blue-700',
    INSTALLATION: 'bg-purple-50 text-purple-700',
    UNINSTALLATION: 'bg-gray-50 text-gray-700'
}

export function MaintenanceTable({ refreshTrigger }: MaintenanceTableProps) {
    const [maintenances, setMaintenances] = useState<Maintenance[]>([])
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({
        status: '',
        type: '',
        search: ''
    })
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    })

    useEffect(() => {
        fetchMaintenances()
    }, [refreshTrigger, filters, pagination.page])

    const fetchMaintenances = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                ...(filters.status && { status: filters.status }),
                ...(filters.type && { type: filters.type })
            })

            const response = await fetch(`/api/maintenance?${params}`)
            if (response.ok) {
                const data = await response.json()
                setMaintenances(data.maintenances)
                setPagination(prev => ({
                    ...prev,
                    total: data.pagination.total,
                    totalPages: data.pagination.totalPages
                }))
            } else {
                toast.error('Error al cargar mantenimientos')
            }
        } catch (error) {
            toast.error('Error de conexión')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este registro?')) return

        try {
            const response = await fetch(`/api/maintenance/${id}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                toast.success('Registro eliminado')
                fetchMaintenances()
            } else {
                toast.error('Error al eliminar')
            }
        } catch (error) {
            toast.error('Error de conexión')
        }
    }

    const filteredMaintenances = maintenances.filter(maintenance => {
        if (!filters.search) return true

        const searchLower = filters.search.toLowerCase()
        return (
            maintenance.sensor.name.toLowerCase().includes(searchLower) ||
            maintenance.sensor.numero_medidor.toLowerCase().includes(searchLower) ||
            maintenance.sensor.user.name.toLowerCase().includes(searchLower) ||
            maintenance.technician?.toLowerCase().includes(searchLower) ||
            maintenance.description.toLowerCase().includes(searchLower)
        )
    })

    if (loading) {
        return (
            <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Filtros */}
            <div className="flex flex-col gap-4 lg:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Buscar..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="pl-10"
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 lg:gap-4">
                    <Select
                        value={filters.status}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? '' : value }))}
                    >
                        <SelectTrigger className="w-full sm:w-40">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {Object.entries(statusLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.type}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, type: value === 'all' ? '' : value }))}
                    >
                        <SelectTrigger className="w-full sm:w-40">
                            <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {Object.entries(typeLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Sensor</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Técnico</TableHead>
                            <TableHead>Costo</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredMaintenances.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                    No se encontraron registros
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredMaintenances.map((maintenance) => (
                                <TableRow key={maintenance.id}>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="font-medium">{maintenance.sensor.name}</div>
                                            <div className="text-sm text-gray-500">{maintenance.sensor.numero_medidor}</div>
                                            <div className="text-xs text-gray-400 flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {maintenance.sensor.user.name}
                                            </div>
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <Badge className={typeColors[maintenance.type]}>
                                            {typeLabels[maintenance.type]}
                                        </Badge>
                                    </TableCell>

                                    <TableCell>
                                        <Badge className={statusColors[maintenance.status]}>
                                            {statusLabels[maintenance.status]}
                                        </Badge>
                                    </TableCell>

                                    <TableCell>
                                        <div className="flex items-center gap-1 text-sm">
                                            <Calendar className="h-3 w-3 text-gray-400" />
                                            {format(new Date(maintenance.scheduledDate), 'dd/MM/yyyy', { locale: es })}
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        {maintenance.technician ? (
                                            <div className="flex items-center gap-1 text-sm">
                                                <Wrench className="h-3 w-3 text-gray-400" />
                                                {maintenance.technician}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-sm">Sin asignar</span>
                                        )}
                                    </TableCell>

                                    <TableCell>
                                        {maintenance.cost ? (
                                            <span className="font-medium">S/ {maintenance.cost.toFixed(2)}</span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <MaintenanceForm
                                                maintenance={maintenance}
                                                onSuccess={fetchMaintenances}
                                                trigger={
                                                    <Button variant="ghost" size="sm">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                }
                                            />

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(maintenance.id)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
                {filteredMaintenances.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-8 text-gray-500">
                            No se encontraron registros
                        </CardContent>
                    </Card>
                ) : (
                    filteredMaintenances.map((maintenance) => (
                        <Card key={maintenance.id}>
                            <CardContent className="p-4 space-y-3">
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium truncate">{maintenance.sensor.name}</h3>
                                        <p className="text-sm text-gray-500">{maintenance.sensor.numero_medidor}</p>
                                    </div>
                                    <div className="flex gap-1 ml-2">
                                        <MaintenanceForm
                                            maintenance={maintenance}
                                            onSuccess={fetchMaintenances}
                                            trigger={
                                                <Button variant="ghost" size="sm">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            }
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(maintenance.id)}
                                            className="text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Badges */}
                                <div className="flex flex-wrap gap-2">
                                    <Badge className={typeColors[maintenance.type]} variant="secondary">
                                        {typeLabels[maintenance.type]}
                                    </Badge>
                                    <Badge className={statusColors[maintenance.status]} variant="secondary">
                                        {statusLabels[maintenance.status]}
                                    </Badge>
                                </div>

                                {/* Details */}
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-gray-400" />
                                        <span>{maintenance.sensor.user.name}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <span>{format(new Date(maintenance.scheduledDate), 'dd/MM/yyyy', { locale: es })}</span>
                                    </div>

                                    {maintenance.technician && (
                                        <div className="flex items-center gap-2">
                                            <Wrench className="h-4 w-4 text-gray-400" />
                                            <span>{maintenance.technician}</span>
                                        </div>
                                    )}

                                    {maintenance.cost && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600">Costo:</span>
                                            <span className="font-medium">S/ {maintenance.cost.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="pt-2 border-t">
                                    <p className="text-sm text-gray-600 line-clamp-2">{maintenance.description}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Paginación */}
            {pagination.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-500 order-2 sm:order-1">
                        {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} a{' '}
                        {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
                    </div>

                    <div className="flex items-center gap-2 order-1 sm:order-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                            disabled={pagination.page <= 1}
                            className="flex items-center gap-1"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Anterior</span>
                        </Button>

                        <span className="text-sm px-2">
                            {pagination.page} / {pagination.totalPages}
                        </span>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                            disabled={pagination.page >= pagination.totalPages}
                            className="flex items-center gap-1"
                        >
                            <span className="hidden sm:inline">Siguiente</span>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}