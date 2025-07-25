// src/components/sensors/sensors-table.tsx
"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    MoreHorizontal,
    Edit,
    Activity,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Wrench,
    Loader2,
    MapPin,
    User
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { useState } from "react"
import { EditSensorDialog } from "./edit-sensor-dialog"
import { toast } from "sonner"

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

interface SensorsTableProps {
    sensors: Sensor[]
    loading: boolean
    onSensorUpdated: () => void
}

export function SensorsTable({ sensors, loading, onSensorUpdated }: SensorsTableProps) {
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null)

    const handleStatusChange = async (sensorId: number, newStatus: string) => {
        try {
            const response = await fetch(`/api/sensors/${sensorId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            })

            if (response.ok) {
                toast.success("Estado actualizado correctamente")
                onSensorUpdated()
            } else {
                toast.error("Error al actualizar estado")
            }
        } catch (error) {
            console.error("Error updating sensor:", error)
            toast.error("Error al actualizar sensor")
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "ACTIVE":
                return <CheckCircle className="h-4 w-4 text-green-500" />
            case "INACTIVE":
                return <XCircle className="h-4 w-4 text-gray-500" />
            case "MAINTENANCE":
                return <Wrench className="h-4 w-4 text-yellow-500" />
            case "FAULTY":
                return <AlertTriangle className="h-4 w-4 text-red-500" />
        }
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
            ACTIVE: "default",
            INACTIVE: "secondary",
            MAINTENANCE: "outline",
            FAULTY: "destructive"
        }

        const labels: Record<string, string> = {
            ACTIVE: "Activo",
            INACTIVE: "Inactivo",
            MAINTENANCE: "Mantenimiento",
            FAULTY: "Defectuoso"
        }

        return (
            <Badge variant={variants[status]} className="flex items-center gap-1">
                {getStatusIcon(status)}
                {labels[status]}
            </Badge>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <>
            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Sensor</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Ubicación</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Última Comunicación</TableHead>
                            <TableHead>Tarifa</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sensors.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                    No se encontraron sensores
                                </TableCell>
                            </TableRow>
                        ) : (
                            sensors.map((sensor) => (
                                <TableRow key={sensor.id}>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{sensor.name}</div>
                                            <div className="text-sm text-gray-500">
                                                Medidor: {sensor.numero_medidor}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {sensor.type} {sensor.model && `- ${sensor.model}`}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-start gap-2">
                                            <User className="h-4 w-4 text-gray-400 mt-0.5" />
                                            <div>
                                                <div className="text-sm">{sensor.user.name || "Sin nombre"}</div>
                                                <div className="text-xs text-gray-500">DNI: {sensor.user.dni}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-start gap-2">
                                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                                            <div>
                                                <div className="text-sm">{sensor.direccion}</div>
                                                <div className="text-xs text-gray-500">
                                                    {sensor.location.address || "Sin dirección adicional"}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(sensor.status)}
                                    </TableCell>
                                    <TableCell>
                                        {sensor.lastCommunication ? (
                                            <div className="flex items-center gap-1">
                                                <Activity className="h-4 w-4 text-gray-400" />
                                                <span className="text-sm">
                                                    {formatDistanceToNow(new Date(sensor.lastCommunication), {
                                                        addSuffix: true,
                                                        locale: es
                                                    })}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400">Nunca</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {sensor.tariffCategory.displayName}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setSelectedSensor(sensor)
                                                        setEditDialogOpen(true)
                                                    }}
                                                >
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuLabel className="text-xs text-gray-500">
                                                    Cambiar estado
                                                </DropdownMenuLabel>
                                                {sensor.status !== "ACTIVE" && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleStatusChange(sensor.id, "ACTIVE")}
                                                    >
                                                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                                        Activar
                                                    </DropdownMenuItem>
                                                )}
                                                {sensor.status !== "INACTIVE" && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleStatusChange(sensor.id, "INACTIVE")}
                                                    >
                                                        <XCircle className="mr-2 h-4 w-4 text-gray-500" />
                                                        Desactivar
                                                    </DropdownMenuItem>
                                                )}
                                                {sensor.status !== "MAINTENANCE" && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleStatusChange(sensor.id, "MAINTENANCE")}
                                                    >
                                                        <Wrench className="mr-2 h-4 w-4 text-yellow-500" />
                                                        En mantenimiento
                                                    </DropdownMenuItem>
                                                )}
                                                {sensor.status !== "FAULTY" && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleStatusChange(sensor.id, "FAULTY")}
                                                    >
                                                        <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
                                                        Marcar defectuoso
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <EditSensorDialog
                sensor={selectedSensor}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                onSensorUpdated={() => {
                    onSensorUpdated()
                    setEditDialogOpen(false)
                    setSelectedSensor(null)
                }}
            />
        </>
    )
}