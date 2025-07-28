// src/components/consumption/edit-consumption-dialog.tsx
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2, Edit, Save } from "lucide-react"
import { toast } from "sonner"

const editConsumptionSchema = z.object({
    serial: z.string().min(1, "Selecciona un sensor"),
    amount: z.number().min(0, "Debe ser mayor o igual a 0"),
    readingDate: z.string().min(1, "Selecciona una fecha"),
    source: z.enum(["AUTOMATIC", "MANUAL", "IMPORTED"]),
    notes: z.string().optional(),
})

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
    serial: string
    source: string | null
    notes: string | null
}

interface EditConsumptionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConsumptionUpdated: () => void
    consumption: WaterConsumption
    sensors: Sensor[]
}

export function EditConsumptionDialog({
    open,
    onOpenChange,
    onConsumptionUpdated,
    consumption,
    sensors
}: EditConsumptionDialogProps) {
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof editConsumptionSchema>>({
        resolver: zodResolver(editConsumptionSchema),
        defaultValues: {
            serial: "",
            amount: 0,
            readingDate: "",
            source: "MANUAL",
            notes: "",
        }
    })

    useEffect(() => {
        if (consumption) {
            form.reset({
                serial: consumption.serial,
                amount: consumption.amount,
                readingDate: new Date(consumption.readingDate).toISOString().split('T')[0],
                source: (consumption.source as "AUTOMATIC" | "MANUAL" | "IMPORTED") || "MANUAL",
                notes: consumption.notes || "",
            })
        }
    }, [consumption, form])

    const onSubmit = async (data: z.infer<typeof editConsumptionSchema>) => {
        setLoading(true)
        try {
            const response = await fetch(`/api/water-consumptions/${consumption.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    readingDate: new Date(data.readingDate).toISOString()
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Error al actualizar registro")
            }

            toast.success("Registro actualizado exitosamente")
            onConsumptionUpdated()
            onOpenChange(false)
        } catch (error) {
            console.error("Error updating consumption:", error)
            toast.error(error instanceof Error ? error.message : "Error al actualizar registro")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-lg max-h-[95vh] overflow-hidden p-0 z-[10000]">
                <div className="flex flex-col">
                    <div className="p-4 sm:p-6 border-b bg-white">
                        <DialogHeader>
                            <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
                                <Edit className="h-5 w-5 text-blue-500" />
                                Editar Registro de Consumo
                            </DialogTitle>
                            <DialogDescription className="text-sm sm:text-base">
                                Modifica los datos del registro de consumo
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="serial"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium">
                                                Sensor / Medidor *
                                            </FormLabel>
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecciona un sensor" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {sensors.map((sensor) => (
                                                        <SelectItem key={sensor.id} value={sensor.numero_medidor}>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{sensor.numero_medidor}</span>
                                                                <span className="text-xs text-gray-500">
                                                                    {sensor.user.name || "Sin nombre"} - DNI: {sensor.user.dni}
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="amount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium">
                                                    Lectura actual (m³) *
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
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
                                        name="readingDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium">
                                                    Fecha de lectura *
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="date"
                                                        {...field}
                                                        className="text-sm"
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-xs" />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="source"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium">
                                                Origen de la lectura *
                                            </FormLabel>
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="MANUAL">Manual</SelectItem>
                                                    <SelectItem value="AUTOMATIC">Automático</SelectItem>
                                                    <SelectItem value="IMPORTED">Importado</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium">
                                                Notas (opcional)
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Observaciones adicionales..."
                                                    rows={3}
                                                    {...field}
                                                    className="text-sm resize-none"
                                                />
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />
                            </form>
                        </Form>
                    </div>

                    <div className="p-4 sm:p-6 border-t bg-white">
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
                                disabled={loading}
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
                                        Guardar Cambios
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}