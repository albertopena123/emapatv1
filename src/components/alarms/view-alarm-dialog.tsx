// src/components/alarms/view-alarm-dialog.tsx
"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Bell,
    AlertTriangle,
    CheckCircle,
    Eye,
    User,
    Calendar,
    Activity,
    Battery,
    Droplet,
    WifiOff
} from "lucide-react"
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

interface ViewAlarmDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    alarm: AlarmHistory
}

export function ViewAlarmDialog({ open, onOpenChange, alarm }: ViewAlarmDialogProps) {
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

    const getAlarmTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            DAILY_CONSUMPTION: "Consumo Diario",
            WEEKLY_CONSUMPTION: "Consumo Semanal",
            MONTHLY_CONSUMPTION: "Consumo Mensual",
            LOW_BATTERY: "Batería Baja",
            NO_COMMUNICATION: "Sin Comunicación",
            ABNORMAL_FLOW: "Flujo Anormal",
            LEAK_DETECTED: "Fuga Detectada",
            PRESSURE_ISSUE: "Problema de Presión",
            CUSTOM: "Personalizada"
        }
        return labels[type] || type
    }

    const getSeverityBadge = (severity: string) => {
        const variants: Record<string, string> = {
            INFO: "bg-blue-100 text-blue-800",
            WARNING: "bg-yellow-100 text-yellow-800",
            CRITICAL: "bg-red-100 text-red-800",
            EMERGENCY: "bg-purple-100 text-purple-800"
        }
        const labels: Record<string, string> = {
            INFO: "Información",
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
            <AlertTriangle className="h-3 w-3" />
            Activa
        </Badge>
    }

    const IconComponent = getAlarmTypeIcon(alarm.alarmType)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] overflow-hidden p-0 z-[10000]">
                <div className="flex flex-col">
                    {/* Header */}
                    <div className="p-4 sm:p-6 border-b bg-white">
                        <DialogHeader>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <IconComponent className="h-6 w-6 text-gray-500 mt-1" />
                                    <div>
                                        <DialogTitle className="text-lg sm:text-xl">
                                            {alarm.title}
                                        </DialogTitle>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {getAlarmTypeLabel(alarm.alarmType)} • {format(new Date(alarm.timestamp), "dd/MM/yyyy HH:mm", { locale: es })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 items-end">
                                    {getSeverityBadge(alarm.severity)}
                                    {getStatusBadge(alarm)}
                                </div>
                            </div>
                        </DialogHeader>
                    </div>

                    {/* Contenido */}
                    <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
                        {/* Descripción */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Descripción</h3>
                            <p className="text-gray-700">{alarm.description}</p>
                        </div>

                        {/* Información del usuario y sensor */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Cliente
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="text-gray-500">Nombre:</span>
                                        <div className="font-medium">{alarm.user.name || "Sin nombre"}</div>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">DNI:</span>
                                        <div className="font-medium">{alarm.user.dni}</div>
                                    </div>
                                </div>
                            </div>

                            {alarm.sensor && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <Activity className="h-4 w-4" />
                                        Sensor
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div>
                                            <span className="text-gray-500">Medidor:</span>
                                            <div className="font-medium">{alarm.sensor.numero_medidor}</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Nombre:</span>
                                            <div className="font-medium">{alarm.sensor.name}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Valores y umbrales */}
                        {alarm.value && alarm.threshold && (
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3">Valores</h3>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="grid grid-cols-2 gap-4 text-center">
                                        <div>
                                            <div className="text-sm text-gray-500">Valor detectado</div>
                                            <div className="text-2xl font-bold text-red-600">
                                                {alarm.value.toFixed(2)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-500">Umbral configurado</div>
                                            <div className="text-2xl font-bold text-gray-700">
                                                {alarm.threshold.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                    {alarm.value > alarm.threshold && (
                                        <div className="mt-3 text-center">
                                            <Badge className="bg-red-100 text-red-800">
                                                Superó el umbral en {(alarm.value - alarm.threshold).toFixed(2)}
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Historial de acciones */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Historial de Acciones
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                    <div className="flex-1">
                                        <div className="font-medium text-sm">Alarma generada</div>
                                        <div className="text-xs text-gray-500">
                                            {format(new Date(alarm.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: es })}
                                        </div>
                                    </div>
                                </div>

                                {alarm.acknowledgedAt && (
                                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">Alarma reconocida</div>
                                            <div className="text-xs text-gray-500">
                                                {format(new Date(alarm.acknowledgedAt), "dd/MM/yyyy HH:mm:ss", { locale: es })}
                                                {alarm.acknowledgedBy && ` por ${alarm.acknowledgedBy}`}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {alarm.resolvedAt && (
                                    <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                                        <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">Alarma resuelta</div>
                                            <div className="text-xs text-gray-500">
                                                {format(new Date(alarm.resolvedAt), "dd/MM/yyyy HH:mm:ss", { locale: es })}
                                                {alarm.resolvedBy && ` por ${alarm.resolvedBy}`}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Estado de notificación */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-3">Notificaciones</h3>
                            <div className="flex items-center gap-2">
                                {alarm.notified ? (
                                    <Badge className="bg-green-100 text-green-800">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Notificaciones enviadas
                                    </Badge>
                                ) : (
                                    <Badge className="bg-yellow-100 text-yellow-800">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        Pendiente de notificar
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 sm:p-6 border-t bg-white">
                        <div className="flex justify-end">
                            <Button onClick={() => onOpenChange(false)}>
                                Cerrar
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}