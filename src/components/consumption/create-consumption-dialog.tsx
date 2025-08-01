// src/components/consumption/create-consumption-dialog.tsx
"use client"

import { useState } from "react"
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
import { Loader2, Droplet, Plus } from "lucide-react"
import { toast } from "sonner"

const createConsumptionSchema = z.object({
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

interface CreateConsumptionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConsumptionCreated: () => void
    sensors: Sensor[]
}

export function CreateConsumptionDialog({
    open,
    onOpenChange,
    onConsumptionCreated,
    sensors
}: CreateConsumptionDialogProps) {
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof createConsumptionSchema>>({
        resolver: zodResolver(createConsumptionSchema),
        defaultValues: {
            serial: "",
            amount: 0,
            readingDate: new Date().toISOString().split('T')[0],
            source: "MANUAL",
            notes: "",
        }
    })

    const onSubmit = async (data: z.infer<typeof createConsumptionSchema>) => {
        setLoading(true)
        try {
            const response = await fetch("/api/water-consumptions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    readingDate: new Date(data.readingDate).toISOString()
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Error al crear registro")
            }

            toast.success("Registro de consumo creado exitosamente")
            form.reset()
            onConsumptionCreated()
            onOpenChange(false)
        } catch (error) {
            console.error("Error creating consumption:", error)
            toast.error(error instanceof Error ? error.message : "Error al crear registro")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>

            <DialogContent className="w-[95vw] max-w-7xl max-h-[90vh] overflow-y-auto">
                <div className="flex flex-col">
                    <div className="p-4 sm:p-6 border-b bg-white">
                        <DialogHeader>
                            <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
                                <Droplet className="h-5 w-5 text-blue-500" />
                                Nuevo Registro de Consumo
                            </DialogTitle>
                            <DialogDescription className="text-sm sm:text-base">
                                Registra una nueva lectura de consumo de agua
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
                                                <SelectContent className="z-[10001]">
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
                                                    Lectura actual (L) *
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

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <div className="flex items-start gap-2">
                                        <Droplet className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-blue-800">
                                                Cálculo automático
                                            </p>
                                            <p className="text-xs text-blue-700 mt-1">
                                                El consumo se calculará automáticamente basado en la lectura anterior registrada.
                                            </p>
                                        </div>
                                    </div>
                                </div>
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
                                        Creando...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Crear Registro
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