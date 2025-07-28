// src/app/(protected)/consumption/page.tsx
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
    Plus,
    Droplet,
    Search,
    Edit,
    Trash2,
    TrendingUp,
    Calendar,
    Users,
    Activity,
    Loader2,
    Download,
    Filter
} from "lucide-react"
import { CreateConsumptionDialog } from "@/components/consumption/create-consumption-dialog"
import { EditConsumptionDialog } from "@/components/consumption/edit-consumption-dialog"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Sensor {
    id: number
    name: string
    numero_medidor: string
    user: {
        name: string | null
        dni: string
    }
}

interface WaterConsumption {
    id: number
    amount: number
    readingDate: string
    previousAmount: number | null
    consumption: number | null
    timestamp: string
    serial: string
    invoiced: boolean
    source: string | null
    notes: string | null
    sensor: {
        numero_medidor: string
        name: string
        user: {
            name: string | null
            dni: string
        }
    }
    user: {
        id: string
        name: string | null
        dni: string
    }
    tarifa: {
        id: number
        name: string
        waterCharge: number
        sewerageCharge: number
        fixedCharge: number
        tariffCategory: {
            displayName: string
        }
    } | null
}

export default function ConsumptionPage() {
    const [consumptions, setConsumptions] = useState<WaterConsumption[]>([])
    const [sensors, setSensors] = useState<Sensor[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedSensor, setSelectedSensor] = useState<string>("all")
    const [selectedPeriod, setSelectedPeriod] = useState<string>("all")
    const [selectedStatus, setSelectedStatus] = useState<string>("all")
    const [searchTerm, setSearchTerm] = useState("")
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [editConsumption, setEditConsumption] = useState<WaterConsumption | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [consumptionsRes, sensorsRes] = await Promise.all([
                fetch("/api/water-consumptions"),
                fetch("/api/sensors?simple=true")
            ])

            if (consumptionsRes.ok && sensorsRes.ok) {
                const [consumptionsData, sensorsData] = await Promise.all([
                    consumptionsRes.json(),
                    sensorsRes.json()
                ])
                setConsumptions(consumptionsData)
                setSensors(sensorsData)
            }
        } catch (error) {
            console.error("Error fetching data:", error)
            toast.error("Error al cargar datos")
        } finally {
            setLoading(false)
        }
    }

    const getSourceBadge = (source: string | null) => {
        const variants: Record<string, string> = {
            AUTOMATIC: "bg-green-100 text-green-800",
            MANUAL: "bg-blue-100 text-blue-800",
            IMPORTED: "bg-purple-100 text-purple-800"
        }
        const labels: Record<string, string> = {
            AUTOMATIC: "Automático",
            MANUAL: "Manual",
            IMPORTED: "Importado"
        }
        const sourceValue = source || "MANUAL"
        return (
            <Badge className={variants[sourceValue] || variants.MANUAL}>
                {labels[sourceValue] || sourceValue}
            </Badge>
        )
    }

    const getInvoicedBadge = (invoiced: boolean) => {
        return (
            <Badge variant={invoiced ? "default" : "secondary"}>
                {invoiced ? "Facturado" : "Pendiente"}
            </Badge>
        )
    }

    const filteredConsumptions = consumptions.filter(consumption => {
        const matchesSensor = selectedSensor === "all" || consumption.serial === selectedSensor
        const matchesStatus = selectedStatus === "all" ||
            (selectedStatus === "invoiced" && consumption.invoiced) ||
            (selectedStatus === "pending" && !consumption.invoiced)

        const matchesSearch = searchTerm === "" ||
            consumption.sensor.numero_medidor.toLowerCase().includes(searchTerm.toLowerCase()) ||
            consumption.sensor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            consumption.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            consumption.user.dni.includes(searchTerm)

        // Filtro por período (últimos 30 días, 3 meses, etc.)
        let matchesPeriod = true
        if (selectedPeriod !== "all") {
            const now = new Date()
            const consumptionDate = new Date(consumption.readingDate)
            const daysDiff = Math.floor((now.getTime() - consumptionDate.getTime()) / (1000 * 60 * 60 * 24))

            switch (selectedPeriod) {
                case "30d":
                    matchesPeriod = daysDiff <= 30
                    break
                case "3m":
                    matchesPeriod = daysDiff <= 90
                    break
                case "6m":
                    matchesPeriod = daysDiff <= 180
                    break
                case "1y":
                    matchesPeriod = daysDiff <= 365
                    break
            }
        }

        return matchesSensor && matchesStatus && matchesSearch && matchesPeriod
    })

    // Estadísticas
    const totalConsumptions = consumptions.length
    const pendingInvoice = consumptions.filter(c => !c.invoiced).length
    const invoicedCount = consumptions.filter(c => c.invoiced).length
    const totalVolume = consumptions.reduce((sum, c) => sum + (c.consumption || 0), 0)
    const avgConsumption = totalConsumptions > 0 ? totalVolume / totalConsumptions : 0

    if (loading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                        <p className="text-sm text-gray-500">Cargando consumos...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-full">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Consumo</h1>
                        <p className="text-sm sm:text-base text-gray-600 mt-1">
                            Monitoreo y registro de consumo de agua
                        </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button variant="outline" className="flex-1 sm:flex-none text-sm">
                            <Download className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Exportar</span>
                            <span className="sm:hidden">Export</span>
                        </Button>
                        <Button className="flex-1 sm:flex-none text-sm" onClick={() => setCreateDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Nuevo Registro</span>
                            <span className="sm:hidden">Nuevo</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <Card className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Droplet className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                        <div>
                            <div className="text-xs sm:text-sm text-gray-500">Registros</div>
                            <div className="text-lg sm:text-2xl font-bold">{totalConsumptions}</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-3 sm:p-4 bg-green-50 border-green-200">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                        <div>
                            <div className="text-xs sm:text-sm text-green-700">Facturados</div>
                            <div className="text-lg sm:text-2xl font-bold text-green-800">{invoicedCount}</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-3 sm:p-4 bg-orange-50 border-orange-200">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
                        <div>
                            <div className="text-xs sm:text-sm text-orange-700">Pendientes</div>
                            <div className="text-lg sm:text-2xl font-bold text-orange-800">{pendingInvoice}</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-3 sm:p-4 bg-blue-50 border-blue-200">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                        <div>
                            <div className="text-xs sm:text-sm text-blue-700">Promedio m³</div>
                            <div className="text-lg sm:text-2xl font-bold text-blue-800">{avgConsumption.toFixed(1)}</div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filtros */}
            <div className="space-y-4 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Buscar por medidor, cliente, DNI..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
                    <Select value={selectedSensor} onValueChange={setSelectedSensor}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Filtrar por sensor" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los sensores</SelectItem>
                            {sensors.map((sensor) => (
                                <SelectItem key={sensor.id} value={sensor.numero_medidor}>
                                    {sensor.numero_medidor} - {sensor.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Período" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todo el período</SelectItem>
                            <SelectItem value="30d">Últimos 30 días</SelectItem>
                            <SelectItem value="3m">Últimos 3 meses</SelectItem>
                            <SelectItem value="6m">Últimos 6 meses</SelectItem>
                            <SelectItem value="1y">Último año</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="w-full sm:w-[160px]">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="pending">Pendientes</SelectItem>
                            <SelectItem value="invoiced">Facturados</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Contenido */}
            {/* Vista de tabla para desktop */}
            <div className="hidden md:block bg-white rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Sensor / Cliente</TableHead>
                            <TableHead>Fecha Lectura</TableHead>
                            <TableHead className="text-right">Lectura Actual</TableHead>
                            <TableHead className="text-right">Lectura Anterior</TableHead>
                            <TableHead className="text-right">Consumo (m³)</TableHead>
                            <TableHead>Origen</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredConsumptions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                    No se encontraron registros de consumo
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredConsumptions.map((consumption) => (
                                <TableRow key={consumption.id}>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{consumption.sensor.numero_medidor}</div>
                                            <div className="text-sm text-gray-500">
                                                {consumption.user.name || "Sin nombre"} - DNI: {consumption.user.dni}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(consumption.readingDate), "dd/MM/yyyy", { locale: es })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {consumption.amount.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {consumption.previousAmount?.toFixed(2) || "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className={`font-medium ${(consumption.consumption || 0) > 0 ? 'text-blue-600' : 'text-gray-500'
                                            }`}>
                                            {consumption.consumption?.toFixed(2) || "0.00"}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {getSourceBadge(consumption.source)}
                                    </TableCell>
                                    <TableCell>
                                        {getInvoicedBadge(consumption.invoiced)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-2 justify-end">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setEditConsumption(consumption)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
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

            {/* Vista de tarjetas para móviles */}
            <div className="md:hidden space-y-4">
                {filteredConsumptions.length === 0 ? (
                    <div className="text-center py-12">
                        <Droplet className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">No se encontraron registros</p>
                    </div>
                ) : (
                    filteredConsumptions.map((consumption) => (
                        <Card key={consumption.id} className="p-4">
                            <div className="space-y-3">
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-medium text-base">{consumption.sensor.numero_medidor}</h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {consumption.user.name || "Sin nombre"} - DNI: {consumption.user.dni}
                                        </p>
                                    </div>
                                    {getInvoicedBadge(consumption.invoiced)}
                                </div>

                                {/* Fecha */}
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm">
                                        {format(new Date(consumption.readingDate), "dd/MM/yyyy", { locale: es })}
                                    </span>
                                    {getSourceBadge(consumption.source)}
                                </div>

                                {/* Lecturas */}
                                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                                    <div className="grid grid-cols-3 gap-3 text-center">
                                        <div>
                                            <div className="text-xs text-gray-500">Anterior</div>
                                            <div className="text-sm font-medium">
                                                {consumption.previousAmount?.toFixed(2) || "-"}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">Actual</div>
                                            <div className="text-sm font-medium">{consumption.amount.toFixed(2)}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-blue-600 font-medium">Consumo</div>
                                            <div className="text-lg font-bold text-blue-700">
                                                {consumption.consumption?.toFixed(2) || "0.00"} m³
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tarifa */}
                                {consumption.tarifa && (
                                    <div className="text-xs text-gray-600">
                                        <span className="font-medium">Tarifa:</span> {consumption.tarifa.name}
                                        ({consumption.tarifa.tariffCategory.displayName})
                                    </div>
                                )}

                                {/* Notas */}
                                {consumption.notes && (
                                    <div className="text-xs text-gray-600">
                                        <span className="font-medium">Notas:</span> {consumption.notes}
                                    </div>
                                )}

                                {/* Acciones */}
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => setEditConsumption(consumption)}
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Editar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Eliminar
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Dialogs */}
            <CreateConsumptionDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onConsumptionCreated={fetchData}
                sensors={sensors}
            />

            {editConsumption && (
                <EditConsumptionDialog
                    open={!!editConsumption}
                    onOpenChange={(open) => !open && setEditConsumption(null)}
                    onConsumptionUpdated={fetchData}
                    consumption={editConsumption}
                    sensors={sensors}
                />
            )}
        </div>
    )
}