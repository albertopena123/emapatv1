// src/components/users/edit-user-dialog.tsx
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
import { Loader2, UserCog } from "lucide-react"

const editUserSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    roleId: z.string().optional(),
    isActive: z.boolean(),
    isSuperAdmin: z.boolean(),
    // Nuevos campos opcionales
    fechaNacimiento: z.string().optional(),
    sexo: z.enum(["M", "F", "O"]).optional(),
    ubigeoNac: z.string().optional(),
    direccion: z.string().optional(),
})

type EditUserFormData = z.infer<typeof editUserSchema>

interface Role {
    id: number
    name: string
    displayName: string
}

interface User {
    id: string
    name: string | null
    email: string | null
    dni: string
    isActive: boolean
    isSuperAdmin: boolean
    fechaNacimiento: string | null
    sexo: string | null
    ubigeoNac: string | null
    direccion: string | null
    role: {
        id: number
        displayName: string
    } | null
}

interface EditUserDialogProps {
    user: User | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onUserUpdated: () => void
}

export function EditUserDialog({ user, open, onOpenChange, onUserUpdated }: EditUserDialogProps) {
    const [loading, setLoading] = useState(false)
    const [roles, setRoles] = useState<Role[]>([])

    const form = useForm<EditUserFormData>({
        resolver: zodResolver(editUserSchema),
        defaultValues: {
            name: "",
            email: "",
            roleId: undefined,
            isActive: true,
            isSuperAdmin: false,
            fechaNacimiento: "",
            sexo: undefined,
            ubigeoNac: "",
            direccion: "",
        }
    })

    useEffect(() => {
        if (open && user) {
            form.reset({
                name: user.name || "",
                email: user.email || "",
                roleId: user.role?.id?.toString(),
                isActive: user.isActive,
                isSuperAdmin: user.isSuperAdmin,
                fechaNacimiento: user.fechaNacimiento ? user.fechaNacimiento.split('T')[0] : "",
                sexo: user.sexo as "M" | "F" | "O" | undefined,
                ubigeoNac: user.ubigeoNac || "",
                direccion: user.direccion || "",
            })
            fetchRoles()
        }
    }, [open, user, form])

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

    const onSubmit = async (data: EditUserFormData) => {
        if (!user) return

        setLoading(true)
        const loadingToast = toast.loading("Actualizando usuario...")

        try {
            const response = await fetch(`/api/users/${user.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    roleId: data.roleId ? parseInt(data.roleId) : undefined,
                    fechaNacimiento: data.fechaNacimiento || null,
                    sexo: data.sexo || null,
                    ubigeoNac: data.ubigeoNac || null,
                    direccion: data.direccion || null,
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Error al actualizar usuario")
            }

            toast.dismiss(loadingToast)
            toast.success("Usuario actualizado exitosamente", {
                description: `Los datos de ${data.name} han sido actualizados.`,
                icon: <UserCog className="h-4 w-4" />,
                duration: 5000,
            })

            onUserUpdated()
            onOpenChange(false)
        } catch (error) {
            toast.dismiss(loadingToast)
            toast.error(
                error instanceof Error ? error.message : "Error al actualizar usuario",
                {
                    description: "Por favor, verifica los datos e intenta nuevamente.",
                    duration: 5000,
                }
            )
            console.error("Error updating user:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Usuario</DialogTitle>
                    <DialogDescription>
                        Modifica los datos del usuario
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
                            <FormItem>
                                <FormLabel>DNI</FormLabel>
                                <Input value={user?.dni || ""} disabled />
                                <FormDescription>No se puede modificar</FormDescription>
                            </FormItem>

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="email" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="fechaNacimiento"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha de Nacimiento</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="date"
                                                max={new Date().toISOString().split('T')[0]}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="sexo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sexo</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="M">Masculino</SelectItem>
                                                <SelectItem value="F">Femenino</SelectItem>
                                                <SelectItem value="O">Otro</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="ubigeoNac"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ubigeo de Nacimiento</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Código ubigeo" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="direccion"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Dirección</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Av. / Jr. / Calle..." />
                                    </FormControl>
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
                                    <Select onValueChange={field.onChange} value={field.value}>
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
                                Guardar Cambios
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}