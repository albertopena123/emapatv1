// src/app/(protected)/sensors/page.tsx
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter } from "lucide-react"
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
        address: string | null
    }
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

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Sensores</h1>
                <p className="text-gray-600">Gestiona los dispositivos de medición de agua</p>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg border">
                    <div className="text-sm text-gray-500">Total</div>
                    <div className="text-2xl font-bold">{getStatusCount("all")}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="text-sm text-green-600">Activos</div>
                    <div className="text-2xl font-bold text-green-700">{getStatusCount("ACTIVE")}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-600">Inactivos</div>
                    <div className="text-2xl font-bold text-gray-700">{getStatusCount("INACTIVE")}</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="text-sm text-yellow-600">Mantenimiento</div>
                    <div className="text-2xl font-bold text-yellow-700">{getStatusCount("MAINTENANCE")}</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="text-sm text-red-600">Defectuosos</div>
                    <div className="text-2xl font-bold text-red-700">{getStatusCount("FAULTY")}</div>
                </div>
            </div>

            {/* Filtros y búsqueda */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Buscar por nombre, medidor, dirección, cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[200px]">
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
                <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Sensor
                </Button>
            </div>

            <SensorsTable
                sensors={filteredSensors}
                loading={loading}
                onSensorUpdated={fetchSensors}
            />

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