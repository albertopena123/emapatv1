// src/components/maps/create-map-dialog.tsx
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
import { Loader2, Map as MapIcon, Plus } from "lucide-react"
import { toast } from "sonner"

const createMapSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    description: z.string().optional(),
})

interface CreateMapDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onMapCreated: () => void
}

export function CreateMapDialog({ open, onOpenChange, onMapCreated }: CreateMapDialogProps) {
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof createMapSchema>>({
        resolver: zodResolver(createMapSchema),
        defaultValues: {
            name: "",
            description: "",
        }
    })

    const onSubmit = async (data: z.infer<typeof createMapSchema>) => {
        setLoading(true)
        try {
            const response = await fetch("/api/maps", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Error al crear mapa")
            }

            toast.success("Mapa creado exitosamente")
            form.reset()
            onMapCreated()
        } catch (error) {
            console.error("Error creating map:", error)
            toast.error(error instanceof Error ? error.message : "Error al crear mapa")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-md h-auto overflow-hidden p-0 z-[10000]">
                <div className="flex flex-col">
                    {/* Header fijo */}
                    <div className="p-4 sm:p-6 border-b bg-white">
                        <DialogHeader>
                            <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
                                <MapIcon className="h-5 w-5 text-blue-500" />
                                Crear Nuevo Mapa
                            </DialogTitle>
                            <DialogDescription className="text-sm sm:text-base">
                                Crea un nuevo mapa para organizar ubicaciones y sensores
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    {/* Contenido del formulario */}
                    <div className="p-4 sm:p-6">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium">
                                                Nombre del mapa *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Ej: Puerto Maldonado Centro"
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
                                                    placeholder="Describe el área que cubre este mapa..."
                                                    rows={3}
                                                    {...field}
                                                    className="text-sm resize-none"
                                                />
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />

                                {/* Información adicional */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <div className="flex items-start gap-2">
                                        <MapIcon className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-blue-800">
                                                ¿Qué es un mapa?
                                            </p>
                                            <p className="text-xs text-blue-700 mt-1">
                                                Los mapas te permiten organizar ubicaciones por zonas geográficas,
                                                facilitando la gestión y visualización de sensores por áreas específicas.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </Form>
                    </div>

                    {/* Footer fijo con botones */}
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
                                        Crear Mapa
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