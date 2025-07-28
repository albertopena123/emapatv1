// src/app/(protected)/sensors/page.tsx
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter, Activity, AlertTriangle, CheckCircle, XCircle, Wrench, LucideIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { SensorsTable } from "@/components/sensors/sensors-table"
import { CreateSensorDialog } from "@/components/sensors/create-sensor-dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface Sensor {
    id: number
    name: string
    type: string
    model: string | null
    manufacturer: string | null
    status: "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "FAULTY"
    lastCommunication: string | null
    installationDate: string
    numero_medidor: string
    codigo_cliente: number
    direccion: string
    ruc: string
    referencia: string
    actividad: string
    ciclo: string
    urbanizacion: string
    cod_catas: string
    ruta: string
    secu: string
    user: {
        id: string
        name: string | null
        dni: string
    }
    location: {
        id: number
        latitude: number
        longitude: number
        address: string | null
    } | null
    tariffCategory: {
        id: number
        displayName: string
    }
}

export default function SensorsPage() {
    const [sensors, setSensors] = useState<Sensor[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [createDialogOpen, setCreateDialogOpen] = useState(false)

    const fetchSensors = async () => {
        try {
            const response = await fetch("/api/sensors")
            if (response.ok) {
                const data = await response.json()
                setSensors(data)
            }
        } catch (error) {
            console.error("Error fetching sensors:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSensors()
    }, [])

    const filteredSensors = sensors.filter(sensor => {
        const matchesSearch =
            sensor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sensor.numero_medidor.includes(searchTerm) ||
            sensor.direccion.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sensor.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sensor.user.dni.includes(searchTerm)

        const matchesStatus = statusFilter === "all" || sensor.status === statusFilter

        return matchesSearch && matchesStatus
    })

    const getStatusCount = (status: string) => {
        if (status === "all") return sensors.length
        return sensors.filter(s => s.status === status).length
    }

    const getStatusInfo = (status: string) => {
        const statusConfig: Record<string, { label: string; icon: LucideIcon; bgColor: string; textColor: string; borderColor: string }> = {
            all: { label: "Total", icon: Activity, bgColor: "bg-white", textColor: "text-gray-700", borderColor: "border-gray-200" },
            ACTIVE: { label: "Activos", icon: CheckCircle, bgColor: "bg-green-50", textColor: "text-green-700", borderColor: "border-green-200" },
            INACTIVE: { label: "Inactivos", icon: XCircle, bgColor: "bg-gray-50", textColor: "text-gray-700", borderColor: "border-gray-200" },
            MAINTENANCE: { label: "Mantenimiento", icon: Wrench, bgColor: "bg-yellow-50", textColor: "text-yellow-700", borderColor: "border-yellow-200" },
            FAULTY: { label: "Defectuosos", icon: AlertTriangle, bgColor: "bg-red-50", textColor: "text-red-700", borderColor: "border-red-200" }
        }
        return statusConfig[status] || statusConfig.all
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-full">
            {/* Header responsivo */}
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold">Sensores</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
                    Gestiona los dispositivos de medición de agua
                </p>
            </div>

            {/* Estadísticas responsivas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
                {["all", "ACTIVE", "INACTIVE", "MAINTENANCE", "FAULTY"].map((status) => {
                    const config = getStatusInfo(status)
                    const Icon = config.icon
                    const count = getStatusCount(status)

                    return (
                        <div key={status} className={`${config.bgColor} p-3 sm:p-4 rounded-lg border ${config.borderColor}`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className={`text-xs sm:text-sm ${config.textColor.replace('700', '600')}`}>
                                    {config.label}
                                </div>
                                <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${config.textColor.replace('700', '500')}`} />
                            </div>
                            <div className={`text-lg sm:text-2xl font-bold ${config.textColor}`}>
                                {count}
                            </div>
                            {/* Porcentaje en móviles */}
                            {status !== "all" && sensors.length > 0 && (
                                <div className={`text-xs ${config.textColor.replace('700', '500')} sm:hidden`}>
                                    {Math.round((count / sensors.length) * 100)}%
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Filtros y búsqueda responsivos */}
            <div className="space-y-4 mb-6">
                {/* Búsqueda */}
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Buscar por nombre, medidor, dirección, cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Filtros y botón */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Filtrar por estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los estados</SelectItem>
                            <SelectItem value="ACTIVE">Activos</SelectItem>
                            <SelectItem value="INACTIVE">Inactivos</SelectItem>
                            <SelectItem value="MAINTENANCE">En mantenimiento</SelectItem>
                            <SelectItem value="FAULTY">Defectuosos</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        onClick={() => setCreateDialogOpen(true)}
                        className="w-full sm:w-auto"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Sensor
                    </Button>
                </div>
            </div>

            {/* Información de filtros activos en móviles */}
            {(searchTerm || statusFilter !== "all") && (
                <div className="mb-4 sm:hidden">
                    <div className="flex flex-wrap gap-2">
                        {searchTerm && (
                            <Badge variant="outline" className="text-xs">
                                Búsqueda: &quot;{searchTerm}&quot;
                            </Badge>
                        )}
                        {statusFilter !== "all" && (
                            <Badge variant="outline" className="text-xs">
                                Estado: {getStatusInfo(statusFilter).label}
                            </Badge>
                        )}
                        <span className="text-xs text-gray-500">
                            {filteredSensors.length} resultados
                        </span>
                    </div>
                </div>
            )}

            {/* Tabla de sensores */}
            <div className="w-full overflow-hidden">
                <SensorsTable
                    sensors={filteredSensors}
                    loading={loading}
                    onSensorUpdated={fetchSensors}
                />
            </div>

            <CreateSensorDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSensorCreated={() => {
                    fetchSensors()
                    setCreateDialogOpen(false)
                }}
            />
        </div>
    )
}