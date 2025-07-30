// src/components/sensors/edit-sensor-dialog.tsx
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
import { Loader2, MapPin } from "lucide-react"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Tipo para el payload de actualización
type UpdateSensorPayload = {
    name: string
    type: string
    model: string | null
    manufacturer: string | null
    status: "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "FAULTY"
    userId: string
    tariffCategoryId: number
    direccion: string
    ruc: string
    referencia: string
    actividad: string
    ciclo: string
    urbanizacion: string
    cod_catas: string
    ruta: string
    secu: string
    locationType: "keep" | "existing" | "new"
    locationId?: number
    newLocation?: {
        latitude: number
        longitude: number
        mapId: number
        altitude: number | null
        address: string | null
        description: string | null
    }
}

const editSensorSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    type: z.string().min(1, "Tipo requerido"),
    model: z.string().optional(),
    manufacturer: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE", "FAULTY"]),
    userId: z.string().min(1, "Usuario requerido"),
    tariffCategoryId: z.number().min(1, "Categoría tarifaria requerida"),
    direccion: z.string().min(1, "Dirección requerida"),
    ruc: z.string().min(1, "RUC requerido"),
    referencia: z.string().min(1, "Referencia requerida"),
    actividad: z.string().min(1, "Actividad requerida"),
    ciclo: z.string().min(1, "Ciclo requerido"),
    urbanizacion: z.string().min(1, "Urbanización requerida"),
    cod_catas: z.string().min(1, "Código catastral requerido"),
    ruta: z.string().min(1, "Ruta requerida"),
    secu: z.string().min(1, "Secuencia requerida"),

    // Ubicación
    locationType: z.enum(["existing", "new", "keep"]),
    locationId: z.number().optional(),
    newLocation: z.object({
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
        altitude: z.number().optional(),
        address: z.string().optional(),
        description: z.string().optional(),
        mapId: z.number().optional(),
    }).optional(),
})

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
    location: {
        id: number
        latitude: number
        longitude: number
        address: string | null
    } | null
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

interface Location {
    id: number
    address: string | null
    latitude: number
    longitude: number
    description: string | null
}

interface Map {
    id: number
    name: string
    description: string | null
}

interface TariffCategory {
    id: number
    name: string
    displayName: string
}

export function EditSensorDialog({ sensor, open, onOpenChange, onSensorUpdated }: EditSensorDialogProps) {
    const [loading, setLoading] = useState(false)
    const [users, setUsers] = useState<User[]>([])
    const [locations, setLocations] = useState<Location[]>([])
    const [maps, setMaps] = useState<Map[]>([])
    const [tariffCategories, setTariffCategories] = useState<TariffCategory[]>([])

    const form = useForm<z.infer<typeof editSensorSchema>>({
        resolver: zodResolver(editSensorSchema),
        defaultValues: {
            name: "",
            type: "WATER_METER",
            model: "",
            manufacturer: "",
            status: "ACTIVE",
            userId: "",
            tariffCategoryId: 0,
            direccion: "",
            ruc: "",
            referencia: "",
            actividad: "",
            ciclo: "",
            urbanizacion: "",
            cod_catas: "",
            ruta: "",
            secu: "",
            locationType: "keep",
            locationId: undefined,
            newLocation: {
                latitude: undefined,
                longitude: undefined,
                altitude: undefined,
                address: "",
                description: "",
                mapId: undefined,
            },
        }
    })

    useEffect(() => {
        if (open) {
            fetchUsers()
            fetchLocations()
            fetchMaps()
            fetchTariffCategories()

            if (sensor) {
                form.reset({
                    name: sensor.name,
                    type: sensor.type,
                    model: sensor.model || "",
                    manufacturer: sensor.manufacturer || "",
                    status: sensor.status,
                    userId: sensor.user.id,
                    tariffCategoryId: sensor.tariffCategory.id,
                    direccion: sensor.direccion,
                    ruc: sensor.ruc,
                    referencia: sensor.referencia,
                    actividad: sensor.actividad,
                    ciclo: sensor.ciclo,
                    urbanizacion: sensor.urbanizacion,
                    cod_catas: sensor.cod_catas,
                    ruta: sensor.ruta,
                    secu: sensor.secu,
                    locationType: "keep",
                    locationId: sensor.location?.id || undefined,
                    newLocation: {
                        latitude: sensor.location?.latitude || 0,
                        longitude: sensor.location?.longitude || 0,
                        altitude: undefined,
                        address: sensor.location?.address || "",
                        description: "",
                        mapId: undefined,
                    },
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

    const fetchLocations = async () => {
        try {
            const response = await fetch("/api/locations")
            if (response.ok) {
                const data = await response.json()
                setLocations(data)
            }
        } catch (error) {
            console.error("Error fetching locations:", error)
        }
    }

    const fetchMaps = async () => {
        try {
            const response = await fetch("/api/maps")
            if (response.ok) {
                const data = await response.json()
                setMaps(data)
                if (data.length === 1) {
                    form.setValue("newLocation.mapId", data[0].id)
                }
            }
        } catch (error) {
            console.error("Error fetching maps:", error)
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

    const onSubmit = async (data: z.infer<typeof editSensorSchema>) => {
        if (!sensor) return

        setLoading(true)
        try {
            const payload: UpdateSensorPayload = {
                name: data.name,
                type: data.type,
                model: data.model || null,
                manufacturer: data.manufacturer || null,
                status: data.status,
                userId: data.userId,
                tariffCategoryId: data.tariffCategoryId,
                direccion: data.direccion,
                ruc: data.ruc,
                referencia: data.referencia,
                actividad: data.actividad,
                ciclo: data.ciclo,
                urbanizacion: data.urbanizacion,
                cod_catas: data.cod_catas,
                ruta: data.ruta,
                secu: data.secu,
                locationType: data.locationType,
            }

            if (data.locationType === "existing" && data.locationId) {
                payload.locationId = data.locationId
            } else if (data.locationType === "new" && data.newLocation &&
                data.newLocation.latitude && data.newLocation.longitude && data.newLocation.mapId) {
                payload.newLocation = {
                    latitude: data.newLocation.latitude,
                    longitude: data.newLocation.longitude,
                    mapId: data.newLocation.mapId,
                    altitude: data.newLocation.altitude || null,
                    address: data.newLocation.address || null,
                    description: data.newLocation.description || null
                }
            }

            const response = await fetch(`/api/sensors/${sensor.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Error al actualizar sensor")
            }

            toast.success("Sensor actualizado exitosamente")
            onSensorUpdated()
            onOpenChange(false)
        } catch (error) {
            console.error("Error updating sensor:", error)
            toast.error(error instanceof Error ? error.message : "Error al actualizar sensor")
        } finally {
            setLoading(false)
        }
    }

    const locationType = form.watch("locationType")

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-7xl max-h-[90vh] overflow-y-auto">
                <div className="flex flex-col h-full">
                    {/* Header fijo */}
                    <div className="p-4 sm:p-6 border-b bg-white">
                        <DialogHeader>
                            <DialogTitle className="text-lg sm:text-xl">Editar Sensor</DialogTitle>
                            <DialogDescription className="text-sm sm:text-base">
                                Modifica los datos del dispositivo
                            </DialogDescription>
                        </DialogHeader>

                        {sensor && (
                            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mt-4">
                                <p className="text-sm font-medium">Número de medidor</p>
                                <p className="text-base sm:text-lg font-mono">{sensor.numero_medidor}</p>
                            </div>
                        )}
                    </div>

                    {/* Contenido scrolleable */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <Tabs defaultValue="basic" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="basic" className="text-xs sm:text-sm">
                                            Básica
                                        </TabsTrigger>
                                        <TabsTrigger value="client" className="text-xs sm:text-sm">
                                            Cliente
                                        </TabsTrigger>
                                        <TabsTrigger value="location" className="text-xs sm:text-sm">
                                            Ubicación
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="basic" className="space-y-4 mt-6">
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

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                                        <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
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
                                                        <Select
                                                            onValueChange={(value) => field.onChange(parseInt(value))}
                                                            value={field.value?.toString()}
                                                        >
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

                                    <TabsContent value="client" className="space-y-4 mt-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                                    <TabsContent value="location" className="space-y-4 mt-6">
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

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                                        {sensor && (
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <p className="text-sm font-medium mb-2">Ubicación actual</p>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <MapPin className="h-4 w-4 text-gray-400" />
                                                    <span>{sensor.location?.address || "Sin dirección"}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {sensor.location ?
                                                        `${sensor.location.latitude.toFixed(6)}, ${sensor.location.longitude.toFixed(6)}` :
                                                        "Sin coordenadas"
                                                    }
                                                </p>
                                            </div>
                                        )}

                                        <div className="border-t pt-4">
                                            <FormField
                                                control={form.control}
                                                name="locationType"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Cambiar ubicación</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="keep">Mantener ubicación actual</SelectItem>
                                                                <SelectItem value="existing">Seleccionar ubicación existente</SelectItem>
                                                                <SelectItem value="new">Crear nueva ubicación</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {locationType === "existing" && (
                                                <FormField
                                                    control={form.control}
                                                    name="locationId"
                                                    render={({ field }) => (
                                                        <FormItem className="mt-4">
                                                            <FormLabel>Seleccionar ubicación</FormLabel>
                                                            <Select
                                                                onValueChange={(value) => field.onChange(parseInt(value))}
                                                                value={field.value?.toString()}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Selecciona una ubicación" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {locations.map((location) => (
                                                                        <SelectItem key={location.id} value={location.id.toString()}>
                                                                            <div className="flex items-center gap-2">
                                                                                <MapPin className="h-4 w-4" />
                                                                                <div>
                                                                                    <div>{location.address || "Sin dirección"}</div>
                                                                                    <div className="text-xs text-gray-500">
                                                                                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            )}

                                            {locationType === "new" && (
                                                <div className="space-y-4 mt-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="newLocation.mapId"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Mapa</FormLabel>
                                                                <Select
                                                                    onValueChange={(value) => field.onChange(parseInt(value))}
                                                                    value={field.value?.toString()}
                                                                >
                                                                    <FormControl>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Selecciona un mapa" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        {maps.map((map) => (
                                                                            <SelectItem key={map.id} value={map.id.toString()}>
                                                                                {map.name}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <FormField
                                                            control={form.control}
                                                            name="newLocation.latitude"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Latitud</FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            {...field}
                                                                            type="number"
                                                                            step="0.000001"
                                                                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                                                            value={field.value || ""}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        <FormField
                                                            control={form.control}
                                                            name="newLocation.longitude"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Longitud</FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            {...field}
                                                                            type="number"
                                                                            step="0.000001"
                                                                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                                                            value={field.value || ""}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>

                                                    <FormField
                                                        control={form.control}
                                                        name="newLocation.altitude"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Altitud (opcional)</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        {...field}
                                                                        type="number"
                                                                        placeholder="metros sobre el nivel del mar"
                                                                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                                                        value={field.value || ""}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="newLocation.description"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Descripción de la ubicación (opcional)</FormLabel>
                                                                <FormControl>
                                                                    <Input {...field} placeholder="Descripción adicional" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                </Tabs>
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
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Cambios
                            </Button>
                        </DialogFooter>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}