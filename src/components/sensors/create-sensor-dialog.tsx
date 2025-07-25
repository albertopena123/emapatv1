// src/components/sensors/create-sensor-dialog.tsx
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

const createSensorSchema = z.object({
    // Información básica
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    type: z.string().min(1, "Tipo requerido"),
    model: z.string().optional(),
    manufacturer: z.string().optional(),
    numero_medidor: z.string().min(1, "Número de medidor requerido"),

    // Usuario asignado
    userId: z.string().min(1, "Usuario requerido"),

    // Ubicación
    locationId: z.string().optional(),

    // Tarifa
    tariffCategoryId: z.string().min(1, "Categoría tarifaria requerida"),

    // Información del cliente
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

type CreateSensorFormData = z.infer<typeof createSensorSchema>

interface CreateSensorDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSensorCreated: () => void
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

export function CreateSensorDialog({ open, onOpenChange, onSensorCreated }: CreateSensorDialogProps) {
    const [loading, setLoading] = useState(false)
    const [users, setUsers] = useState<User[]>([])
    const [tariffCategories, setTariffCategories] = useState<TariffCategory[]>([])

    const form = useForm<CreateSensorFormData>({
        resolver: zodResolver(createSensorSchema),
        defaultValues: {
            name: "",
            type: "WATER_METER",
            model: "",
            manufacturer: "",
            numero_medidor: "",
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
        }
    }, [open])

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

    const onSubmit = async (data: CreateSensorFormData) => {
        setLoading(true)
        try {
            const response = await fetch("/api/sensors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    tariffCategoryId: parseInt(data.tariffCategoryId),
                    installationDate: new Date().toISOString(),
                    status: "ACTIVE"
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Error al crear sensor")
            }

            toast.success("Sensor creado exitosamente")
            form.reset()
            onSensorCreated()
        } catch (error) {
            console.error("Error creating sensor:", error)
            toast.error(error instanceof Error ? error.message : "Error al crear sensor")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Crear Sensor</DialogTitle>
                    <DialogDescription>
                        Registra un nuevo dispositivo de medición
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <Tabs defaultValue="basic" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="basic">Información Básica</TabsTrigger>
                                <TabsTrigger value="client">Datos del Cliente</TabsTrigger>
                                <TabsTrigger value="location">Ubicación</TabsTrigger>
                            </TabsList>

                            <TabsContent value="basic" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nombre del sensor</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Medidor Principal" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="numero_medidor"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Número de medidor</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="MED-001" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tipo</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecciona el tipo" />
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
                                        name="tariffCategoryId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Categoría Tarifaria</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecciona la tarifa" />
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

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="model"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Modelo (opcional)</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="WM-2024" />
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
                                                <FormLabel>Fabricante (opcional)</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Sensus" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="userId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Usuario asignado</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecciona un usuario" />
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
                                                    <Input {...field} placeholder="Residencial" />
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
                                                <Input {...field} placeholder="Av. Principal 123" />
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
                                                    <Input {...field} placeholder="Frente al parque" />
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
                                Crear Sensor
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}