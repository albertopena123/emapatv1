// src/components/tariffs/edit-tariff-dialog.tsx
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
import { Switch } from "@/components/ui/switch"
import { Loader2, Edit, Save } from "lucide-react"
import { toast } from "sonner"

const editTariffSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    description: z.string().optional(),
    tariffCategoryId: z.number().min(1, "Selecciona una categoría"),
    minConsumption: z.number().min(0, "Debe ser mayor o igual a 0"),
    maxConsumption: z.number().nullable(),
    waterCharge: z.number().min(0, "Debe ser mayor o igual a 0"),
    sewerageCharge: z.number().min(0, "Debe ser mayor o igual a 0"),
    fixedCharge: z.number().min(0, "Debe ser mayor o igual a 0"),
    assignedVolume: z.number().min(1, "Debe ser mayor a 0"),
    isActive: z.boolean(),
})

interface TariffCategory {
    id: number
    name: string
    displayName: string
    isActive: boolean
}

interface Tariff {
    id: number
    name: string
    description: string | null
    minConsumption: number
    maxConsumption: number | null
    waterCharge: number
    sewerageCharge: number
    fixedCharge: number
    assignedVolume: number
    isActive: boolean
    tariffCategory: {
        id: number
        name: string
        displayName: string
    }
}

interface EditTariffDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onTariffUpdated: () => void
    tariff: Tariff
    categories: TariffCategory[]
}

export function EditTariffDialog({ open, onOpenChange, onTariffUpdated, tariff, categories }: EditTariffDialogProps) {
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof editTariffSchema>>({
        resolver: zodResolver(editTariffSchema),
        defaultValues: {
            name: "",
            description: "",
            tariffCategoryId: 0,
            minConsumption: 0,
            maxConsumption: null,
            waterCharge: 0,
            sewerageCharge: 0,
            fixedCharge: 0,
            assignedVolume: 0,
            isActive: true,
        }
    })

    // Actualizar valores cuando cambie la tarifa
    useEffect(() => {
        if (tariff) {
            form.reset({
                name: tariff.name,
                description: tariff.description || "",
                tariffCategoryId: tariff.tariffCategory.id,
                minConsumption: tariff.minConsumption,
                maxConsumption: tariff.maxConsumption,
                waterCharge: tariff.waterCharge,
                sewerageCharge: tariff.sewerageCharge,
                fixedCharge: tariff.fixedCharge,
                assignedVolume: tariff.assignedVolume,
                isActive: tariff.isActive,
            })
        }
    }, [tariff, form])

    const onSubmit = async (data: z.infer<typeof editTariffSchema>) => {
        setLoading(true)
        try {
            const response = await fetch(`/api/tariffs/${tariff.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Error al actualizar tarifa")
            }

            toast.success("Tarifa actualizada exitosamente")
            onTariffUpdated()
            onOpenChange(false)
        } catch (error) {
            console.error("Error updating tariff:", error)
            toast.error(error instanceof Error ? error.message : "Error al actualizar tarifa")
        } finally {
            setLoading(false)
        }
    }

    const activeCategories = categories.filter(c => c.isActive)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-2xl h-auto overflow-hidden p-0 z-[10000]">
                <div className="flex flex-col max-h-[90vh]">
                    <div className="p-4 sm:p-6 border-b bg-white">
                        <DialogHeader>
                            <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
                                <Edit className="h-5 w-5 text-blue-500" />
                                Editar Tarifa
                            </DialogTitle>
                            <DialogDescription className="text-sm sm:text-base">
                                Modifica los datos de la tarifa {tariff.name}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                {/* Información básica */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-900">Información básica</h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-medium">
                                                        Nombre de la tarifa *
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Ej: Doméstico - Rango 1"
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
                                            name="tariffCategoryId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-medium">
                                                        Categoría *
                                                    </FormLabel>
                                                    <Select
                                                        value={field.value?.toString() || ""}
                                                        onValueChange={(value) => field.onChange(parseInt(value))}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Selecciona categoría" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {activeCategories.map((category) => (
                                                                <SelectItem key={category.id} value={category.id.toString()}>
                                                                    {category.displayName}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage className="text-xs" />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium">
                                                    Descripción (opcional)
                                                </FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Describe esta tarifa..."
                                                        rows={2}
                                                        {...field}
                                                        className="text-sm resize-none"
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-xs" />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Rango de consumo */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-900">Rango de consumo</h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="minConsumption"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-medium">
                                                        Consumo mínimo (m³) *
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="0"
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
                                            name="maxConsumption"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-medium">
                                                        Consumo máximo (m³)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="Sin límite"
                                                            value={field.value || ""}
                                                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                                            className="text-sm"
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-xs" />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="assignedVolume"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-medium">
                                                        Volumen asignado (m³) *
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="1"
                                                            placeholder="20"
                                                            {...field}
                                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                            className="text-sm"
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-xs" />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Tarifas */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-900">Tarifas (Soles)</h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="waterCharge"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-medium">
                                                        Tarifa de agua (S/) *
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="1.50"
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
                                            name="sewerageCharge"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-medium">
                                                        Tarifa alcantarillado (S/) *
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="0.45"
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
                                            name="fixedCharge"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-medium">
                                                        Cargo fijo (S/) *
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="8.50"
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
                                </div>

                                {/* Estado */}
                                <FormField
                                    control={form.control}
                                    name="isActive"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-sm font-medium">
                                                    Tarifa activa
                                                </FormLabel>
                                                <div className="text-xs text-gray-500">
                                                    Las tarifas inactivas no se pueden usar
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