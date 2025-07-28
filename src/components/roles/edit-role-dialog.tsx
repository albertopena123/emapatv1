// src/components/roles/edit-role-dialog.tsx
"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
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
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Shield } from "lucide-react"

const editRoleSchema = z.object({
    displayName: z.string().min(3, "El nombre para mostrar debe tener al menos 3 caracteres"),
    description: z.string().optional(),
    priority: z.number().min(0).max(100),
})

type EditRoleFormData = z.infer<typeof editRoleSchema>

interface Role {
    id: number
    name: string
    displayName: string
    description: string | null
    isSystem: boolean
    priority: number
}

interface EditRoleDialogProps {
    role: Role | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onRoleUpdated: () => void
}

export function EditRoleDialog({ role, open, onOpenChange, onRoleUpdated }: EditRoleDialogProps) {
    const [loading, setLoading] = useState(false)

    const form = useForm<EditRoleFormData>({
        resolver: zodResolver(editRoleSchema),
        defaultValues: {
            displayName: "",
            description: "",
            priority: 0,
        }
    })

    useEffect(() => {
        if (open && role) {
            form.reset({
                displayName: role.displayName,
                description: role.description || "",
                priority: role.priority,
            })
        }
    }, [open, role, form])

    const onSubmit = async (data: EditRoleFormData) => {
        if (!role) return

        setLoading(true)
        const loadingToast = toast.loading("Actualizando rol...")

        try {
            const response = await fetch(`/api/roles/${role.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Error al actualizar rol")
            }

            toast.dismiss(loadingToast)
            toast.success("Rol actualizado exitosamente", {
                description: `${data.displayName} ha sido actualizado.`,
                icon: <Shield className="h-4 w-4" />,
                duration: 5000,
            })

            onRoleUpdated()
            onOpenChange(false)
        } catch (error) {
            toast.dismiss(loadingToast)
            toast.error(
                error instanceof Error ? error.message : "Error al actualizar rol",
                {
                    description: "Por favor, verifica los datos e intenta nuevamente.",
                    duration: 5000,
                }
            )
            console.error("Error updating role:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Editar Rol</DialogTitle>
                    <DialogDescription>
                        Modifica los datos del rol
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormItem>
                            <FormLabel>Nombre interno</FormLabel>
                            <Input value={role?.name || ""} disabled />
                            <FormDescription>No se puede modificar</FormDescription>
                        </FormItem>

                        <FormField
                            control={form.control}
                            name="displayName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre para mostrar</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} rows={3} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="priority"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Prioridad</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            type="number"
                                            min="0"
                                            max="100"
                                            onChange={e => field.onChange(e.target.valueAsNumber)}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Mayor número = mayor prioridad (0-100)
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading || role?.isSystem}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Cambios
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}