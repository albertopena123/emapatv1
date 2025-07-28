// src/components/alarms/alarm-settings-dialog.tsx
"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Loader2, Settings, Save } from "lucide-react"
import { toast } from "sonner"

const alarmSettingsSchema = z.object({
    dailyConsumptionLimit: z.number().min(0, "Debe ser mayor o igual a 0"),
    weeklyConsumptionLimit: z.number().min(0, "Debe ser mayor o igual a 0"),
    monthlyConsumptionLimit: z.number().optional(),
    batteryLowThreshold: z.number().min(0).max(5, "Debe estar entre 0 y 5V"),
    dailyAlarmActive: z.boolean(),
    weeklyAlarmActive: z.boolean(),
    monthlyAlarmActive: z.boolean(),
    technicalAlarmsActive: z.boolean(),
    notifyBySMS: z.boolean(),
    notifyByEmail: z.boolean(),
    notifyByPush: z.boolean(),
    notifyByWhatsApp: z.boolean(),
    quietHoursStart: z.string().optional(),
    quietHoursEnd: z.string().optional(),
})

interface AlarmSettings {
    dailyConsumptionLimit: number
    weeklyConsumptionLimit: number
    monthlyConsumptionLimit: number | null
    batteryLowThreshold: number
    dailyAlarmActive: boolean
    weeklyAlarmActive: boolean
    monthlyAlarmActive: boolean
    technicalAlarmsActive: boolean
    notifyBySMS: boolean
    notifyByEmail: boolean
    notifyByPush: boolean
    notifyByWhatsApp: boolean
    quietHoursStart: string | null
    quietHoursEnd: string | null
}

interface AlarmSettingsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSettingsUpdated: () => void
}

export function AlarmSettingsDialog({ open, onOpenChange, onSettingsUpdated }: AlarmSettingsDialogProps) {
    const [loading, setLoading] = useState(false)
    const [loadingSettings, setLoadingSettings] = useState(true)

    const form = useForm<z.infer<typeof alarmSettingsSchema>>({
        resolver: zodResolver(alarmSettingsSchema),
        defaultValues: {
            dailyConsumptionLimit: 3,
            weeklyConsumptionLimit: 8000,
            monthlyConsumptionLimit: 0,
            batteryLowThreshold: 2.5,
            dailyAlarmActive: true,
            weeklyAlarmActive: true,
            monthlyAlarmActive: false,
            technicalAlarmsActive: true,
            notifyBySMS: false,
            notifyByEmail: true,
            notifyByPush: false,
            notifyByWhatsApp: false,
            quietHoursStart: "",
            quietHoursEnd: "",
        }
    })

    useEffect(() => {
        if (open) {
            fetchSettings()
        }
    }, [open])

    const fetchSettings = async () => {
        try {
            const response = await fetch("/api/alarm-settings")
            if (response.ok) {
                const settings: AlarmSettings = await response.json()
                form.reset({
                    dailyConsumptionLimit: settings.dailyConsumptionLimit,
                    weeklyConsumptionLimit: settings.weeklyConsumptionLimit,
                    monthlyConsumptionLimit: settings.monthlyConsumptionLimit || 0,
                    batteryLowThreshold: settings.batteryLowThreshold,
                    dailyAlarmActive: settings.dailyAlarmActive,
                    weeklyAlarmActive: settings.weeklyAlarmActive,
                    monthlyAlarmActive: settings.monthlyAlarmActive,
                    technicalAlarmsActive: settings.technicalAlarmsActive,
                    notifyBySMS: settings.notifyBySMS,
                    notifyByEmail: settings.notifyByEmail,
                    notifyByPush: settings.notifyByPush,
                    notifyByWhatsApp: settings.notifyByWhatsApp,
                    quietHoursStart: settings.quietHoursStart || "",
                    quietHoursEnd: settings.quietHoursEnd || "",
                })
            }
        } catch (error) {
            console.error("Error fetching settings:", error)
        } finally {
            setLoadingSettings(false)
        }
    }

    const onSubmit = async (data: z.infer<typeof alarmSettingsSchema>) => {
        setLoading(true)
        try {
            const response = await fetch("/api/alarm-settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    monthlyConsumptionLimit: data.monthlyConsumptionLimit || null,
                    quietHoursStart: data.quietHoursStart || null,
                    quietHoursEnd: data.quietHoursEnd || null,
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Error al guardar configuración")
            }

            toast.success("Configuración guardada exitosamente")
            onSettingsUpdated()
            onOpenChange(false)
        } catch (error) {
            console.error("Error saving settings:", error)
            toast.error(error instanceof Error ? error.message : "Error al guardar configuración")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] p-0 z-[10000] flex flex-col">
                {/* Header fijo */}
                <div className="flex-shrink-0 p-4 sm:p-6 border-b bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
                            <Settings className="h-5 w-5 text-blue-500" />
                            Configuración de Alarmas
                        </DialogTitle>
                        <DialogDescription className="text-sm sm:text-base">
                            Configura los límites y notificaciones para las alarmas del sistema
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Contenido scrolleable */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {loadingSettings ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span className="ml-2">Cargando configuración...</span>
                        </div>
                    ) : (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                {/* Límites de consumo */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-900">Límites de Consumo</h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="dailyConsumptionLimit"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-medium">
                                                        Límite diario (m³)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.1"
                                                            {...field}
                                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                            className="text-sm"
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-xs" />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="weeklyConsumptionLimit"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-medium">
                                                        Límite semanal (m³)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.1"
                                                            {...field}
                                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                            className="text-sm"
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-xs" />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="monthlyConsumptionLimit"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-medium">
                                                        Límite mensual (m³)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.1"
                                                            placeholder="Sin límite"
                                                            value={field.value || ""}
                                                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                                                            className="text-sm"
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-xs" />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Límites técnicos */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-900">Límites Técnicos</h3>

                                    <FormField
                                        control={form.control}
                                        name="batteryLowThreshold"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium">
                                                    Umbral batería baja (V)
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        min="0"
                                                        max="5"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                        className="text-sm max-w-xs"
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-xs" />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Activación de alarmas */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-900">Activación de Alarmas</h3>

                                    <div className="space-y-3">
                                        <FormField
                                            control={form.control}
                                            name="dailyAlarmActive"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-sm font-medium">
                                                            Alarma de consumo diario
                                                        </FormLabel>
                                                        <div className="text-xs text-gray-500">
                                                            Alertar cuando se supere el límite diario
                                                        </div>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="weeklyAlarmActive"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-sm font-medium">
                                                            Alarma de consumo semanal
                                                        </FormLabel>
                                                        <div className="text-xs text-gray-500">
                                                            Alertar cuando se supere el límite semanal
                                                        </div>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="monthlyAlarmActive"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-sm font-medium">
                                                            Alarma de consumo mensual
                                                        </FormLabel>
                                                        <div className="text-xs text-gray-500">
                                                            Alertar cuando se supere el límite mensual
                                                        </div>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="technicalAlarmsActive"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-sm font-medium">
                                                            Alarmas técnicas
                                                        </FormLabel>
                                                        <div className="text-xs text-gray-500">
                                                            Batería baja, sin comunicación, etc.
                                                        </div>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Métodos de notificación */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-900">Métodos de Notificación</h3>

                                    <div className="grid grid-cols-2 gap-3">
                                        <FormField
                                            control={form.control}
                                            name="notifyByEmail"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                    <FormLabel className="text-sm font-medium">Email</FormLabel>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="notifyBySMS"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                    <FormLabel className="text-sm font-medium">SMS</FormLabel>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="notifyByPush"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                    <FormLabel className="text-sm font-medium">Push</FormLabel>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="notifyByWhatsApp"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                    <FormLabel className="text-sm font-medium">WhatsApp</FormLabel>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Horarios de silencio */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-900">Horarios de Silencio</h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="quietHoursStart"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-medium">
                                                        Inicio del silencio
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="time"
                                                            {...field}
                                                            className="text-sm"
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-xs" />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="quietHoursEnd"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-medium">
                                                        Fin del silencio
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="time"
                                                            {...field}
                                                            className="text-sm"
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-xs" />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Durante estos horarios no se enviarán notificaciones, salvo emergencias
                                    </p>
                                </div>

                                {/* Espaciado adicional para evitar que el último elemento se pegue al footer */}
                                <div className="pb-4"></div>
                            </form>
                        </Form>
                    )}
                </div>

                {/* Footer fijo */}
                <div className="flex-shrink-0 p-4 sm:p-6 border-t bg-white">
                    <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                            className="w-full sm:w-auto order-2 sm:order-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || loadingSettings}
                            onClick={form.handleSubmit(onSubmit)}
                            className="w-full sm:w-auto order-1 sm:order-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Guardar Configuración
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}