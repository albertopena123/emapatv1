// src/components/users/create-user-dialog.tsx
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, UserPlus } from "lucide-react"

const createUserSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    dni: z.string().regex(/^\d{8}$/, "DNI debe tener 8 dígitos"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    roleId: z.string().optional(),
    isActive: z.boolean(),
    isSuperAdmin: z.boolean(),
})

type CreateUserFormData = z.infer<typeof createUserSchema>

interface Role {
    id: number
    name: string
    displayName: string
}

interface CreateUserDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onUserCreated: () => void
}

export function CreateUserDialog({ open, onOpenChange, onUserCreated }: CreateUserDialogProps) {
    const [loading, setLoading] = useState(false)
    const [roles, setRoles] = useState<Role[]>([])

    const form = useForm<CreateUserFormData>({
        resolver: zodResolver(createUserSchema),
        defaultValues: {
            name: "",
            email: "",
            dni: "",
            password: "",
            roleId: undefined,
            isActive: true,
            isSuperAdmin: false,
        }
    })

    useEffect(() => {
        if (open) {
            fetchRoles()
        }
    }, [open])

    const fetchRoles = async () => {
        try {
            const response = await fetch("/api/roles")
            if (response.ok) {
                const data = await response.json()
                setRoles(data)
            }
        } catch (error) {
            console.error("Error fetching roles:", error)
            toast.error("Error al cargar los roles")
        }
    }

    const onSubmit = async (data: CreateUserFormData) => {
        setLoading(true)

        // Mostrar toast de carga
        const loadingToast = toast.loading("Creando usuario...")

        try {
            const response = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    roleId: data.roleId ? parseInt(data.roleId) : undefined
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Error al crear usuario")
            }

            const newUser = await response.json()

            // Dismiss loading toast
            toast.dismiss(loadingToast)

            // Mostrar toast de éxito
            toast.success("Usuario creado exitosamente", {
                description: `${newUser.name} ha sido agregado al sistema.`,
                icon: <UserPlus className="h-4 w-4" />,
                duration: 5000,
            })

            form.reset()
            onUserCreated()
        } catch (error) {
            // Dismiss loading toast
            toast.dismiss(loadingToast)

            // Mostrar toast de error
            toast.error(
                error instanceof Error ? error.message : "Error al crear usuario",
                {
                    description: "Por favor, verifica los datos e intenta nuevamente.",
                    duration: 5000,
                }
            )
            console.error("Error creating user:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Crear Usuario</DialogTitle>
                    <DialogDescription>
                        Ingresa los datos del nuevo usuario
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre completo</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="dni"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>DNI</FormLabel>
                                        <FormControl>
                                            <Input {...field} maxLength={8} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email (opcional)</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="email" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contraseña</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="password" />
                                    </FormControl>
                                    <FormDescription>
                                        Mínimo 6 caracteres
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="roleId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Rol</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona un rol" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {roles.map((role) => (
                                                <SelectItem key={role.id} value={role.id.toString()}>
                                                    {role.displayName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-2">
                            <FormField
                                control={form.control}
                                name="isActive"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Usuario activo</FormLabel>
                                            <FormDescription>
                                                El usuario puede iniciar sesión
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="isSuperAdmin"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Super Administrador</FormLabel>
                                            <FormDescription>
                                                Acceso total al sistema
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Crear Usuario
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}