// src/components/tariffs/create-category-dialog.tsx
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Loader2, Calculator, Plus } from "lucide-react"
import { toast } from "sonner"

const createCategorySchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").regex(/^[A-Z_]+$/, "Solo mayúsculas y guiones bajos"),
    displayName: z.string().min(2, "El nombre visible debe tener al menos 2 caracteres"),
    description: z.string().optional(),
    isActive: z.boolean(),
})

interface CreateCategoryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onCategoryCreated: () => void
}

export function CreateCategoryDialog({ open, onOpenChange, onCategoryCreated }: CreateCategoryDialogProps) {
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof createCategorySchema>>({
        resolver: zodResolver(createCategorySchema),
        defaultValues: {
            name: "",
            displayName: "",
            description: "",
            isActive: true,
        }
    })

    const onSubmit = async (data: z.infer<typeof createCategorySchema>) => {
        setLoading(true)
        try {
            const response = await fetch("/api/tariff-categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Error al crear categoría")
            }

            toast.success("Categoría creada exitosamente")
            form.reset()
            onCategoryCreated()
            onOpenChange(false)
        } catch (error) {
            console.error("Error creating category:", error)
            toast.error(error instanceof Error ? error.message : "Error al crear categoría")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-md h-auto overflow-hidden p-0 z-[10000]">
                <div className="flex flex-col">
                    <div className="p-4 sm:p-6 border-b bg-white">
                        <DialogHeader>
                            <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
                                <Calculator className="h-5 w-5 text-blue-500" />
                                Nueva Categoría
                            </DialogTitle>
                            <DialogDescription className="text-sm sm:text-base">
                                Crea una nueva categoría para agrupar tarifas
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-4 sm:p-6">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium">
                                                Nombre interno *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Ej: RESIDENTIAL"
                                                    {...field}
                                                    className="text-sm uppercase"
                                                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="displayName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium">
                                                Nombre visible *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Ej: Doméstico"
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
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium">
                                                Descripción (opcional)
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Describe esta categoría..."
                                                    rows={3}
                                                    {...field}
                                                    className="text-sm resize-none"
                                                />
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="isActive"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-sm font-medium">
                                                    Categoría activa
                                                </FormLabel>
                                                <div className="text-xs text-gray-500">
                                                    Las categorías inactivas no se pueden usar
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
                                        Creando...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Crear Categoría
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