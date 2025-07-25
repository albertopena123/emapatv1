// src/components/roles/create-role-dialog.tsx
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
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
import { Loader2 } from "lucide-react"

const createRoleSchema = z.object({
    name: z.string()
        .min(3, "El nombre debe tener al menos 3 caracteres")
        .regex(/^[a-z_]+$/, "Solo minúsculas y guiones bajos"),
    displayName: z.string().min(3, "El nombre para mostrar debe tener al menos 3 caracteres"),
    description: z.string().optional(),
    priority: z.number().min(0).max(100),
})

type CreateRoleFormData = z.infer<typeof createRoleSchema>

interface CreateRoleDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onRoleCreated: () => void
}

export function CreateRoleDialog({ open, onOpenChange, onRoleCreated }: CreateRoleDialogProps) {
    const [loading, setLoading] = useState(false)

    const form = useForm<CreateRoleFormData>({
        resolver: zodResolver(createRoleSchema),
        defaultValues: {
            name: "",
            displayName: "",
            description: "",
            priority: 0,
        }
    })

    const onSubmit = async (data: CreateRoleFormData) => {
        setLoading(true)
        try {
            const response = await fetch("/api/roles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Error al crear rol")
            }

            form.reset()
            onRoleCreated()
        } catch (error) {
            console.error("Error creating role:", error)
            alert(error instanceof Error ? error.message : "Error al crear rol")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Crear Rol</DialogTitle>
                    <DialogDescription>
                        Define un nuevo rol para el sistema
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre interno</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="operador_sistema" />
                                    </FormControl>
                                    <FormDescription>
                                        Solo minúsculas y guiones bajos
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="displayName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre para mostrar</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Operador del Sistema" />
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
                                        <Textarea
                                            {...field}
                                            placeholder="Describe las responsabilidades del rol..."
                                            rows={3}
                                        />
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
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Crear Rol
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}