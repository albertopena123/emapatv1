// src/components/billing/create-invoice-dialog.tsx
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
import { Loader2, FileText, Plus } from "lucide-react"
import { toast } from "sonner"

const createInvoiceSchema = z.object({
    sensorId: z.number().min(1, "Selecciona un sensor"),
    periodStart: z.string().min(1, "Selecciona fecha de inicio"),
    periodEnd: z.string().min(1, "Selecciona fecha de fin"),
    dueDate: z.string().min(1, "Selecciona fecha de vencimiento"),
    additionalCharges: z.number().min(0, "Debe ser mayor o igual a 0"),
    discounts: z.number().min(0, "Debe ser mayor o igual a 0"),
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

interface CreateInvoiceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onInvoiceCreated: () => void
}

export function CreateInvoiceDialog({ open, onOpenChange, onInvoiceCreated }: CreateInvoiceDialogProps) {
    const [loading, setLoading] = useState(false)
    const [sensors, setSensors] = useState<Sensor[]>([])
    const [loadingSensors, setLoadingSensors] = useState(true)

    const form = useForm<z.infer<typeof createInvoiceSchema>>({
        resolver: zodResolver(createInvoiceSchema),
        defaultValues: {
            sensorId: 0,
            periodStart: "",
            periodEnd: "",
            dueDate: "",
            additionalCharges: 0,
            discounts: 0,
            notes: "",
        }
    })

    useEffect(() => {
        if (open) {
            fetchSensors()
            // Establecer fechas por defecto
            const now = new Date()
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
            const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 15)

            form.setValue("periodStart", firstDay.toISOString().split('T')[0])
            form.setValue("periodEnd", lastDay.toISOString().split('T')[0])
            form.setValue("dueDate", dueDate.toISOString().split('T')[0])
        }
    }, [open, form])

    const fetchSensors = async () => {
        try {
            const response = await fetch("/api/sensors?simple=true")
            if (response.ok) {
                const data = await response.json()
                setSensors(data)
            }
        } catch (error) {
            console.error("Error fetching sensors:", error)
        } finally {
            setLoadingSensors(false)
        }
    }

    const onSubmit = async (data: z.infer<typeof createInvoiceSchema>) => {
        setLoading(true)
        try {
            const response = await fetch("/api/invoices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    periodStart: new Date(data.periodStart).toISOString(),
                    periodEnd: new Date(data.periodEnd).toISOString(),
                    dueDate: new Date(data.dueDate).toISOString()
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Error al crear factura")
            }

            toast.success("Factura creada exitosamente")
            form.reset()
            onInvoiceCreated()
            onOpenChange(false)
        } catch (error) {
            console.error("Error creating invoice:", error)
            toast.error(error instanceof Error ? error.message : "Error al crear factura")
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
                                <FileText className="h-5 w-5 text-green-500" />
                                Nueva Factura
                            </DialogTitle>
                            <DialogDescription className="text-sm sm:text-base">
                                Genera una nueva factura basada en consumos
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="sensorId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium">
                                                Sensor / Cliente *
                                            </FormLabel>
                                            <Select
                                                value={field.value?.toString() || ""}
                                                onValueChange={(value) => field.onChange(parseInt(value))}
                                                disabled={loadingSensors}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={loadingSensors ? "Cargando..." : "Selecciona un sensor"} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="z-[10001]">
                                                    {sensors.map((sensor) => (
                                                        <SelectItem key={sensor.id} value={sensor.id.toString()}>
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
                                        name="periodStart"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium">
                                                    Inicio del período *
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

                                    <FormField
                                        control={form.control}
                                        name="periodEnd"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium">
                                                    Fin del período *
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
                                    name="dueDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium">
                                                Fecha de vencimiento *
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

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="additionalCharges"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium">
                                                    Cargos adicionales (S/)
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
                                        name="discounts"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium">
                                                    Descuentos (S/)
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
                                </div>

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
                                        <FileText className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-blue-800">
                                                Cálculo automático
                                            </p>
                                            <p className="text-xs text-blue-700 mt-1">
                                                Los importes se calcularán automáticamente basados en los consumos del período seleccionado y la tarifa activa del sensor.
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
                                        Crear Factura
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