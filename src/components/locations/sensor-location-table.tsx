// src/components/locations/sensor-location-table.tsx
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
    MapPin,
    Navigation,
    Loader2,
    Cpu,
    AlertCircle
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { LocationAssignDialog } from "./location-assign-dialog"

interface SensorWithLocation {
    id: number
    nombre: string
    numero_medidor: string
    direccion: string
    status: string
    location: {
        id: number
        latitude: number
        longitude: number
        address?: string
    } | null
}

interface SensorLocationTableProps {
    sensors: SensorWithLocation[]
    onSensorSelect?: (sensor: SensorWithLocation) => void
    onRefresh: () => void
}

export function SensorLocationTable({ sensors, onSensorSelect, onRefresh }: SensorLocationTableProps) {
    const [assignDialogOpen, setAssignDialogOpen] = useState(false)
    const [selectedSensor, setSelectedSensor] = useState<SensorWithLocation | null>(null)

    const handleAssignLocation = (sensor: SensorWithLocation) => {
        setSelectedSensor(sensor)
        setAssignDialogOpen(true)
    }

    const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
        switch (status) {
            case 'ACTIVE': return 'default'
            case 'INACTIVE': return 'secondary'
            case 'MAINTENANCE': return 'outline'
            case 'FAULTY': return 'destructive'
            default: return 'outline'
        }
    }

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'ACTIVE': return 'bg-green-500'
            case 'INACTIVE': return 'bg-gray-500'
            case 'MAINTENANCE': return 'bg-amber-500'
            case 'FAULTY': return 'bg-red-500'
            default: return 'bg-blue-500'
        }
    }

    const getStatusText = (status: string): string => {
        switch (status) {
            case 'ACTIVE': return 'Activo'
            case 'INACTIVE': return 'Inactivo'
            case 'MAINTENANCE': return 'Mantenimiento'
            case 'FAULTY': return 'Falla'
            default: return status
        }
    }

    if (sensors.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <Cpu className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No se encontraron sensores</p>
            </div>
        )
    }

    return (
        <div className="bg-white w-full">
            {/* Vista de tabla para desktop con scroll horizontal */}
            <div className="hidden md:block w-full">
                <div className="w-full overflow-x-auto border rounded-md">
                    <div style={{ minWidth: '1100px' }} className="w-full">
                        <Table className="w-full">
                            <TableHeader>
                                <TableRow>
                                    <TableHead style={{ minWidth: '200px' }}>Sensor</TableHead>
                                    <TableHead style={{ minWidth: '150px' }}>Medidor</TableHead>
                                    <TableHead style={{ minWidth: '120px' }}>Estado</TableHead>
                                    <TableHead style={{ minWidth: '140px' }}>Ubicación GPS</TableHead>
                                    <TableHead style={{ minWidth: '280px' }}>Dirección</TableHead>
                                    <TableHead style={{ minWidth: '120px' }} className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sensors.map((sensor) => (
                                    <TableRow key={sensor.id} className="cursor-pointer hover:bg-gray-50">
                                        <TableCell style={{ minWidth: '200px' }}>
                                            <div className="flex items-center gap-2">
                                                <Cpu className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                <span className="font-medium truncate">
                                                    {sensor.nombre || `Sensor ${sensor.id}`}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell style={{ minWidth: '150px' }}>
                                            <code className="text-sm bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
                                                {sensor.numero_medidor}
                                            </code>
                                        </TableCell>
                                        <TableCell style={{ minWidth: '120px' }}>
                                            <Badge variant={getStatusBadgeVariant(sensor.status)} className="whitespace-nowrap">
                                                {getStatusText(sensor.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell style={{ minWidth: '140px' }}>
                                            {sensor.location ? (
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                    <span className="text-sm text-green-600 whitespace-nowrap">Asignada</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                                                    <span className="text-sm text-orange-600 whitespace-nowrap">Pendiente</span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell style={{ minWidth: '280px' }}>
                                            <div className="max-w-[280px] truncate text-sm" title={sensor.location?.address || sensor.direccion}>
                                                {sensor.location?.address || sensor.direccion}
                                            </div>
                                        </TableCell>
                                        <TableCell style={{ minWidth: '120px' }} className="text-right">
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
                                                        onClick={() => handleAssignLocation(sensor)}
                                                    >
                                                        <MapPin className="mr-2 h-4 w-4" />
                                                        {sensor.location ? 'Editar ubicación' : 'Asignar ubicación'}
                                                    </DropdownMenuItem>
                                                    {sensor.location && (
                                                        <DropdownMenuItem
                                                            onClick={() => onSensorSelect?.(sensor)}
                                                        >
                                                            <Navigation className="mr-2 h-4 w-4" />
                                                            Ver en mapa
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            {/* Vista de tarjetas para móviles */}
            <div className="md:hidden space-y-4">
                {sensors.map((sensor) => (
                    <div key={sensor.id} className="border rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <Cpu className="h-4 w-4 text-gray-400" />
                                    <h3 className="font-medium text-base">
                                        {sensor.nombre || `Sensor ${sensor.id}`}
                                    </h3>
                                </div>
                                <div className="text-sm text-gray-600 mb-2">
                                    <span className="text-gray-500">Medidor:</span>{" "}
                                    <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                                        {sensor.numero_medidor}
                                    </code>
                                </div>
                            </div>
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
                                        onClick={() => handleAssignLocation(sensor)}
                                    >
                                        <MapPin className="mr-2 h-4 w-4" />
                                        {sensor.location ? 'Editar ubicación' : 'Asignar ubicación'}
                                    </DropdownMenuItem>
                                    {sensor.location && (
                                        <DropdownMenuItem
                                            onClick={() => onSensorSelect?.(sensor)}
                                        >
                                            <Navigation className="mr-2 h-4 w-4" />
                                            Ver en mapa
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="space-y-2">
                            {/* Estado y ubicación */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${getStatusColor(sensor.status)}`}></div>
                                    <span className="text-sm font-medium">
                                        {getStatusText(sensor.status)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {sensor.location ? (
                                        <>
                                            <MapPin className="h-4 w-4 text-green-600" />
                                            <span className="text-sm text-green-600">GPS Asignado</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="h-4 w-4 text-orange-600" />
                                            <span className="text-sm text-orange-600">Sin GPS</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Dirección */}
                            <div className="border-t pt-2">
                                <p className="text-xs text-gray-500 mb-1">Dirección:</p>
                                <p className="text-sm">
                                    {sensor.location?.address || sensor.direccion}
                                </p>
                            </div>

                            {/* Coordenadas si existen */}
                            {sensor.location && (
                                <div className="text-xs text-gray-500 border-t pt-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <span>Lat:</span> {sensor.location.latitude.toFixed(6)}
                                        </div>
                                        <div>
                                            <span>Lng:</span> {sensor.location.longitude.toFixed(6)}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Botones de acción rápida en móviles */}
                        <div className="flex gap-2 mt-3">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-xs"
                                onClick={() => handleAssignLocation(sensor)}
                            >
                                <MapPin className="h-3 w-3 mr-1" />
                                {sensor.location ? 'Editar GPS' : 'Asignar GPS'}
                            </Button>
                            {sensor.location && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-xs"
                                    onClick={() => onSensorSelect?.(sensor)}
                                >
                                    <Navigation className="h-3 w-3 mr-1" />
                                    Ver en Mapa
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <LocationAssignDialog
                sensor={selectedSensor}
                open={assignDialogOpen}
                onOpenChange={setAssignDialogOpen}
                onSuccess={() => {
                    onRefresh()
                    setAssignDialogOpen(false)
                    setSelectedSensor(null)
                }}
            />
        </div>
    )
}