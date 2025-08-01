// src/app/(protected)/alarms/page.tsx
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
    Bell,
    AlertTriangle,
    CheckCircle,
    Search,
    Eye,
    Settings,
    Battery,
    Droplet,
    WifiOff,
    Loader2,
    Clock,
    AlertCircle,
    RefreshCw
} from "lucide-react"
import { AlarmSettingsDialog } from "@/components/alarms/alarm-settings-dialog"
import { ViewAlarmDialog } from "@/components/alarms/view-alarm-dialog"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { LucideIcon } from "lucide-react"

interface AlarmHistory {
    id: string
    alarmType: string
    severity: string
    title: string
    description: string
    timestamp: string
    value: number | null
    threshold: number | null
    acknowledged: boolean
    acknowledgedAt: string | null
    acknowledgedBy: string | null
    resolved: boolean
    resolvedAt: string | null
    resolvedBy: string | null
    notified: boolean
    user: {
        id: string
        name: string | null
        dni: string
    }
    sensor: {
        numero_medidor: string
        name: string
    } | null
}

export default function AlarmsPage() {
    const [alarms, setAlarms] = useState<AlarmHistory[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedType, setSelectedType] = useState<string>("all")
    const [selectedSeverity, setSelectedSeverity] = useState<string>("all")
    const [selectedStatus, setSelectedStatus] = useState<string>("all")
    const [searchTerm, setSearchTerm] = useState("")
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
    const [viewAlarm, setViewAlarm] = useState<AlarmHistory | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const response = await fetch("/api/alarms")
            if (response.ok) {
                const data = await response.json()
                setAlarms(data)
            }
        } catch (error) {
            console.error("Error fetching alarms:", error)
            toast.error("Error al cargar alarmas")
        } finally {
            setLoading(false)
        }
    }

    const getAlarmTypeIcon = (type: string): LucideIcon => {
        const icons = {
            DAILY_CONSUMPTION: Droplet,
            WEEKLY_CONSUMPTION: Droplet,
            MONTHLY_CONSUMPTION: Droplet,
            LOW_BATTERY: Battery,
            NO_COMMUNICATION: WifiOff,
            ABNORMAL_FLOW: AlertTriangle,
            LEAK_DETECTED: AlertTriangle,
            PRESSURE_ISSUE: AlertTriangle,
            CUSTOM: Bell
        }
        return icons[type as keyof typeof icons] || Bell
    }

    const getSeverityBadge = (severity: string) => {
        const variants: Record<string, string> = {
            INFO: "bg-blue-100 text-blue-800",
            WARNING: "bg-yellow-100 text-yellow-800",
            CRITICAL: "bg-red-100 text-red-800",
            EMERGENCY: "bg-purple-100 text-purple-800"
        }
        const labels: Record<string, string> = {
            INFO: "Info",
            WARNING: "Advertencia",
            CRITICAL: "Crítica",
            EMERGENCY: "Emergencia"
        }
        return (
            <Badge className={variants[severity] || variants.INFO}>
                {labels[severity] || severity}
            </Badge>
        )
    }

    const getStatusBadge = (alarm: AlarmHistory) => {
        if (alarm.resolved) {
            return <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Resuelta
            </Badge>
        }
        if (alarm.acknowledged) {
            return <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
                <Eye className="h-3 w-3" />
                Reconocida
            </Badge>
        }
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Activa
        </Badge>
    }

    const filteredAlarms = alarms.filter(alarm => {
        const matchesType = selectedType === "all" || alarm.alarmType === selectedType
        const matchesSeverity = selectedSeverity === "all" || alarm.severity === selectedSeverity

        let matchesStatus = true
        if (selectedStatus === "active") matchesStatus = !alarm.resolved && !alarm.acknowledged
        if (selectedStatus === "acknowledged") matchesStatus = alarm.acknowledged && !alarm.resolved
        if (selectedStatus === "resolved") matchesStatus = alarm.resolved

        const matchesSearch = searchTerm === "" ||
            alarm.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            alarm.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            alarm.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            alarm.user.dni.includes(searchTerm) ||
            alarm.sensor?.numero_medidor.includes(searchTerm)

        return matchesType && matchesSeverity && matchesStatus && matchesSearch
    })

    const handleAcknowledge = async (alarmId: string) => {
        try {
            const response = await fetch(`/api/alarms/${alarmId}/acknowledge`, {
                method: "POST"
            })
            if (response.ok) {
                toast.success("Alarma reconocida")
                fetchData()
            }
        } catch (error) {
            toast.error("Error al reconocer alarma")
        }
    }

    const handleResolve = async (alarmId: string) => {
        try {
            const response = await fetch(`/api/alarms/${alarmId}/resolve`, {
                method: "POST"
            })
            if (response.ok) {
                toast.success("Alarma resuelta")
                fetchData()
            }
        } catch (error) {
            toast.error("Error al resolver alarma")
        }
    }

    const handleCheckAlarms = async () => {
        setLoading(true)
        try {
            const response = await fetch("/api/alarms/check", {
                method: "POST"
            })
            if (response.ok) {
                toast.success("Verificación de alarmas completada")
                fetchData()
            } else {
                toast.error("Error al verificar alarmas")
            }
        } catch (error) {
            toast.error("Error al verificar alarmas")
        } finally {
            setLoading(false)
        }
    }

    // Estadísticas
    const totalAlarms = alarms.length
    const activeAlarms = alarms.filter(a => !a.resolved && !a.acknowledged).length
    const acknowledgedAlarms = alarms.filter(a => a.acknowledged && !a.resolved).length
    const resolvedAlarms = alarms.filter(a => a.resolved).length
    const criticalAlarms = alarms.filter(a => a.severity === "CRITICAL" && !a.resolved).length
    const emergencyAlarms = alarms.filter(a => a.severity === "EMERGENCY" && !a.resolved).length

    if (loading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                        <p className="text-sm text-gray-500">Cargando alarmas...</p>
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
                        <h1 className="text-2xl sm:text-3xl font-bold">Sistema de Alarmas</h1>
                        <p className="text-sm sm:text-base text-gray-600 mt-1">
                            Monitoreo y gestión de alertas del sistema
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto text-sm"
                            onClick={handleCheckAlarms}
                            disabled={loading}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Verificar Ahora
                        </Button>
                        <Button
                            className="w-full sm:w-auto text-sm"
                            onClick={() => setSettingsDialogOpen(true)}
                        >
                            <Settings className="h-4 w-4 mr-2" />
                            Configurar Alarmas
                        </Button>
                    </div>
                </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
                <Card className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                        <div>
                            <div className="text-xs sm:text-sm text-gray-500">Total</div>
                            <div className="text-lg sm:text-2xl font-bold">{totalAlarms}</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-3 sm:p-4 bg-red-50 border-red-200">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                        <div>
                            <div className="text-xs sm:text-sm text-red-700">Activas</div>
                            <div className="text-lg sm:text-2xl font-bold text-red-800">{activeAlarms}</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-3 sm:p-4 bg-blue-50 border-blue-200">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                        <div>
                            <div className="text-xs sm:text-sm text-blue-700">Reconocidas</div>
                            <div className="text-lg sm:text-2xl font-bold text-blue-800">{acknowledgedAlarms}</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-3 sm:p-4 bg-green-50 border-green-200">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                        <div>
                            <div className="text-xs sm:text-sm text-green-700">Resueltas</div>
                            <div className="text-lg sm:text-2xl font-bold text-green-800">{resolvedAlarms}</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-3 sm:p-4 bg-orange-50 border-orange-200">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
                        <div>
                            <div className="text-xs sm:text-sm text-orange-700">Críticas</div>
                            <div className="text-lg sm:text-2xl font-bold text-orange-800">{criticalAlarms}</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-3 sm:p-4 bg-purple-50 border-purple-200">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                        <div>
                            <div className="text-xs sm:text-sm text-purple-700">Emergencia</div>
                            <div className="text-lg sm:text-2xl font-bold text-purple-800">{emergencyAlarms}</div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filtros */}
            <div className="space-y-4 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Buscar por título, descripción, cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
                    <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Tipo de alarma" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los tipos</SelectItem>
                            <SelectItem value="DAILY_CONSUMPTION">Consumo Diario</SelectItem>
                            <SelectItem value="WEEKLY_CONSUMPTION">Consumo Semanal</SelectItem>
                            <SelectItem value="MONTHLY_CONSUMPTION">Consumo Mensual</SelectItem>
                            <SelectItem value="LOW_BATTERY">Batería Baja</SelectItem>
                            <SelectItem value="NO_COMMUNICATION">Sin Comunicación</SelectItem>
                            <SelectItem value="ABNORMAL_FLOW">Flujo Anormal</SelectItem>
                            <SelectItem value="LEAK_DETECTED">Fuga Detectada</SelectItem>
                            <SelectItem value="PRESSURE_ISSUE">Problema de Presión</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                        <SelectTrigger className="w-full sm:w-[160px]">
                            <SelectValue placeholder="Severidad" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            <SelectItem value="INFO">Info</SelectItem>
                            <SelectItem value="WARNING">Advertencia</SelectItem>
                            <SelectItem value="CRITICAL">Crítica</SelectItem>
                            <SelectItem value="EMERGENCY">Emergencia</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="w-full sm:w-[160px]">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="active">Activas</SelectItem>
                            <SelectItem value="acknowledged">Reconocidas</SelectItem>
                            <SelectItem value="resolved">Resueltas</SelectItem>
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
                            <TableHead>Tipo / Título</TableHead>
                            <TableHead>Cliente / Sensor</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Valor / Umbral</TableHead>
                            <TableHead>Severidad</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAlarms.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                    No se encontraron alarmas
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAlarms.map((alarm) => {
                                const IconComponent = getAlarmTypeIcon(alarm.alarmType)
                                return (
                                    <TableRow key={alarm.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <IconComponent className="h-5 w-5 text-gray-500" />
                                                <div>
                                                    <div className="font-medium">{alarm.title}</div>
                                                    <div className="text-sm text-gray-500">{alarm.description}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{alarm.user.name || "Sin nombre"}</div>
                                                <div className="text-sm text-gray-500">
                                                    {alarm.sensor?.numero_medidor || "Sin sensor"} | DNI: {alarm.user.dni}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                {format(new Date(alarm.timestamp), "dd/MM/yyyy HH:mm", { locale: es })}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {alarm.value && alarm.threshold ? (
                                                <div className="text-sm">
                                                    <span className="font-medium">{alarm.value.toFixed(2)}</span>
                                                    <span className="text-gray-500"> / {alarm.threshold.toFixed(2)}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {getSeverityBadge(alarm.severity)}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(alarm)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex gap-2 justify-end">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setViewAlarm(alarm)}
                                                    title="Ver detalles"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {!alarm.acknowledged && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleAcknowledge(alarm.id)}
                                                        title="Reconocer"
                                                    >
                                                        <Eye className="h-4 w-4 text-blue-600" />
                                                    </Button>
                                                )}
                                                {alarm.acknowledged && !alarm.resolved && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleResolve(alarm.id)}
                                                        title="Resolver"
                                                    >
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Vista de tarjetas para móviles */}
            <div className="md:hidden space-y-4">
                {filteredAlarms.length === 0 ? (
                    <div className="text-center py-12">
                        <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">No se encontraron alarmas</p>
                    </div>
                ) : (
                    filteredAlarms.map((alarm) => {
                        const IconComponent = getAlarmTypeIcon(alarm.alarmType)
                        return (
                            <Card key={alarm.id} className="p-4">
                                <div className="space-y-3">
                                    {/* Header */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1">
                                            <IconComponent className="h-5 w-5 text-gray-500 mt-1" />
                                            <div className="flex-1">
                                                <h3 className="font-medium text-base">{alarm.title}</h3>
                                                <p className="text-sm text-gray-500 mt-1">{alarm.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 items-end">
                                            {getSeverityBadge(alarm.severity)}
                                            {getStatusBadge(alarm)}
                                        </div>
                                    </div>

                                    {/* Cliente y sensor */}
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-gray-500">Cliente:</span>
                                            <div className="font-medium">{alarm.user.name || "Sin nombre"}</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Sensor:</span>
                                            <div className="font-medium">{alarm.sensor?.numero_medidor || "Sin sensor"}</div>
                                        </div>
                                    </div>

                                    {/* Valores */}
                                    {alarm.value && alarm.threshold && (
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <div className="text-center">
                                                <div className="text-xs text-gray-500">Valor / Umbral</div>
                                                <div className="text-lg font-bold">
                                                    {alarm.value.toFixed(2)} / {alarm.threshold.toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Fecha */}
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Clock className="h-4 w-4" />
                                        {format(new Date(alarm.timestamp), "dd/MM/yyyy HH:mm", { locale: es })}
                                    </div>

                                    {/* Acciones */}
                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => setViewAlarm(alarm)}
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            Ver
                                        </Button>
                                        {!alarm.acknowledged && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => handleAcknowledge(alarm.id)}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                Reconocer
                                            </Button>
                                        )}
                                        {alarm.acknowledged && !alarm.resolved && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => handleResolve(alarm.id)}
                                            >
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Resolver
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        )
                    })
                )}
            </div>

            {/* Dialogs */}
            <AlarmSettingsDialog
                open={settingsDialogOpen}
                onOpenChange={setSettingsDialogOpen}
                onSettingsUpdated={fetchData}
            />

            {viewAlarm && (
                <ViewAlarmDialog
                    open={!!viewAlarm}
                    onOpenChange={(open) => !open && setViewAlarm(null)}
                    alarm={viewAlarm}
                />
            )}
        </div>
    )
}