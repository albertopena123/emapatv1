// src/components/sensors/edit-sensor-dialog.tsx
"use client"

import { useState, useEffect } from "react"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const editSensorSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    type: z.string().min(1, "Tipo requerido"),
    model: z.string().optional(),
    manufacturer: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE", "FAULTY"]),
    userId: z.string().min(1, "Usuario requerido"),
    tariffCategoryId: z.string().min(1, "Categoría tarifaria requerida"),
    direccion: z.string().min(1, "Dirección requerida"),
    ruc: z.string().min(1, "RUC requerido"),
    referencia: z.string().min(1, "Referencia requerida"),
    actividad: z.string().min(1, "Actividad requerida"),
    ciclo: z.string().min(1, "Ciclo requerido"),
    urbanizacion: z.string().min(1, "Urbanización requerida"),
    cod_catas: z.string().min(1, "Código catastral requerido"),
    ruta: z.string().min(1, "Ruta requerida"),
    secu: z.string().min(1, "Secuencia requerida"),
})

type EditSensorFormData = z.infer<typeof editSensorSchema>

interface Sensor {
    id: number
    name: string
    type: string
    model: string | null
    manufacturer: string | null
    status: "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "FAULTY"
    numero_medidor: string
    direccion: string
    ruc: string
    referencia: string
    actividad: string
    ciclo: string
    urbanizacion: string
    cod_catas: string
    ruta: string
    secu: string
    user: {
        id: string
    }
    tariffCategory: {
        id: number
    }
}

interface EditSensorDialogProps {
    sensor: Sensor | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSensorUpdated: () => void
}

interface User {
    id: string
    name: string | null
    dni: string
    email: string | null
}

interface TariffCategory {
    id: number
    name: string
    displayName: string
}

export function EditSensorDialog({ sensor, open, onOpenChange, onSensorUpdated }: EditSensorDialogProps) {
    const [loading, setLoading] = useState(false)
    const [users, setUsers] = useState<User[]>([])
    const [tariffCategories, setTariffCategories] = useState<TariffCategory[]>([])

    const form = useForm<EditSensorFormData>({
        resolver: zodResolver(editSensorSchema),
        defaultValues: {
            name: "",
            type: "WATER_METER",
            model: "",
            manufacturer: "",
            status: "ACTIVE",
            userId: "",
            tariffCategoryId: "",
            direccion: "",
            ruc: "",
            referencia: "",
            actividad: "",
            ciclo: "",
            urbanizacion: "",
            cod_catas: "",
            ruta: "",
            secu: "",
        }
    })

    useEffect(() => {
        if (open) {
            fetchUsers()
            fetchTariffCategories()

            if (sensor) {
                form.reset({
                    name: sensor.name,
                    type: sensor.type,
                    model: sensor.model || "",
                    manufacturer: sensor.manufacturer || "",
                    status: sensor.status,
                    userId: sensor.user.id,
                    tariffCategoryId: sensor.tariffCategory.id.toString(),
                    direccion: sensor.direccion,
                    ruc: sensor.ruc,
                    referencia: sensor.referencia,
                    actividad: sensor.actividad,
                    ciclo: sensor.ciclo,
                    urbanizacion: sensor.urbanizacion,
                    cod_catas: sensor.cod_catas,
                    ruta: sensor.ruta,
                    secu: sensor.secu,
                })
            }
        }
    }, [open, sensor, form])

    const fetchUsers = async () => {
        try {
            const response = await fetch("/api/users")
            if (response.ok) {
                const data = await response.json()
                setUsers(data)
            }
        } catch (error) {
            console.error("Error fetching users:", error)
        }
    }

    const fetchTariffCategories = async () => {
        try {
            const response = await fetch("/api/tariff-categories")
            if (response.ok) {
                const data = await response.json()
                setTariffCategories(data)
            }
        } catch (error) {
            console.error("Error fetching tariff categories:", error)
        }
    }

    const onSubmit = async (data: EditSensorFormData) => {
        if (!sensor) return

        setLoading(true)
        try {
            const response = await fetch(`/api/sensors/${sensor.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    tariffCategoryId: parseInt(data.tariffCategoryId)
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Error al actualizar sensor")
            }

            toast.success("Sensor actualizado exitosamente")
            onSensorUpdated()
        } catch (error) {
            console.error("Error updating sensor:", error)
            toast.error(error instanceof Error ? error.message : "Error al actualizar sensor")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Sensor</DialogTitle>
                    <DialogDescription>
                        Modifica los datos del dispositivo
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm font-medium">Número de medidor</p>
                            <p className="text-lg">{sensor?.numero_medidor}</p>
                        </div>

                        <Tabs defaultValue="basic" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="basic">Información Básica</TabsTrigger>
                                <TabsTrigger value="client">Datos del Cliente</TabsTrigger>
                                <TabsTrigger value="location">Ubicación</TabsTrigger>
                            </TabsList>

                            <TabsContent value="basic" className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre del sensor</FormLabel>
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
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tipo</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="WATER_METER">Medidor de Agua</SelectItem>
                                                        <SelectItem value="FLOW_METER">Medidor de Flujo</SelectItem>
                                                        <SelectItem value="PRESSURE_SENSOR">Sensor de Presión</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Estado</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="ACTIVE">Activo</SelectItem>
                                                        <SelectItem value="INACTIVE">Inactivo</SelectItem>
                                                        <SelectItem value="MAINTENANCE">En mantenimiento</SelectItem>
                                                        <SelectItem value="FAULTY">Defectuoso</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="model"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Modelo</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="manufacturer"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Fabricante</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="userId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Usuario asignado</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {users.map((user) => (
                                                            <SelectItem key={user.id} value={user.id}>
                                                                {user.name || "Sin nombre"} - DNI: {user.dni}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="tariffCategoryId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Categoría Tarifaria</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {tariffCategories.map((category) => (
                                                            <SelectItem key={category.id} value={category.id.toString()}>
                                                                {category.displayName}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="client" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="ruc"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>RUC</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="actividad"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Actividad</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="ciclo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Ciclo</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="secu"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Secuencia</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="location" className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="direccion"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Dirección</FormLabel>
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
                                        name="urbanizacion"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Urbanización</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="referencia"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Referencia</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="cod_catas"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Código Catastral</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="ruta"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Ruta</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>

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