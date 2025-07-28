// src/app/(protected)/maps/page.tsx
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Plus,
    Map as MapIcon,
    MapPin,
    Activity,
    Share2,
    Navigation,
    Download,
    Settings,
    Maximize2,
    Search,
    User,
    Loader2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { InteractiveMap } from "@/components/maps/dynamic-map"
import { CreateMapDialog } from "@/components/maps/create-map-dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface Map {
    id: number
    name: string
    description: string | null
    _count: {
        locations: number
    }
}

interface Location {
    id: number
    latitude: number
    longitude: number
    address: string | null
    description: string | null
    _count: {
        sensors: number
    }
    map: {
        id: number
        name: string
    }
}

interface Sensor {
    id: number
    name?: string
    nombre?: string // Para compatibilidad con includeLocation=true
    status: string
    numero_medidor: string
    user: {
        name: string | null
        dni: string
    }
    location: {
        latitude: number
        longitude: number
        address: string | null
    } | null // Puede ser null
}

export default function MapsPage() {
    const [maps, setMaps] = useState<Map[]>([])
    const [locations, setLocations] = useState<Location[]>([])
    const [sensors, setSensors] = useState<Sensor[]>([])
    const [selectedMap, setSelectedMap] = useState<string>("all")
    const [loading, setLoading] = useState(true)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [searchTerm, setSearchTerm] = useState("")
    const [viewMode, setViewMode] = useState<"map" | "table">("map")
    const [createMapDialogOpen, setCreateMapDialogOpen] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [mapsRes, locationsRes, sensorsRes] = await Promise.all([
                fetch("/api/maps"),
                fetch("/api/locations"),
                fetch("/api/sensors?includeLocation=true") // ✅ Agregar este parámetro
            ])

            if (mapsRes.ok && locationsRes.ok && sensorsRes.ok) {
                const [mapsData, locationsData, sensorsData] = await Promise.all([
                    mapsRes.json(),
                    locationsRes.json(),
                    sensorsRes.json()
                ])

                setMaps(mapsData)
                setLocations(locationsData)
                setSensors(sensorsData)
            }
        } catch (error) {
            console.error("Error fetching data:", error)
        } finally {
            setLoading(false)
        }
    }

    const filteredLocations = selectedMap === "all"
        ? locations
        : locations.filter(loc => loc.map.id.toString() === selectedMap)

    const filteredSensors = sensors.filter(sensor => {
        const matchesStatus = statusFilter === "all" || sensor.status === statusFilter

        // Manejar ambas estructuras de datos (name vs nombre)
        const sensorName = sensor.name || sensor.nombre || ""
        const userNameValue = sensor.user?.name || ""
        const addressValue = sensor.location?.address || ""

        const matchesSearch = searchTerm === "" ||
            sensorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sensor.numero_medidor.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sensor.user.dni.includes(searchTerm) ||
            userNameValue.toLowerCase().includes(searchTerm.toLowerCase()) ||
            addressValue.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesMap = selectedMap === "all" ||
            (sensor.location && filteredLocations.some(loc =>
                loc.latitude === sensor.location!.latitude &&
                loc.longitude === sensor.location!.longitude
            ))

        return matchesStatus && matchesSearch && matchesMap
    })

    // Solo sensores con ubicación para el mapa
    const sensorsWithLocation = filteredSensors.filter(sensor => sensor.location)

    const getStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            ACTIVE: "bg-green-100 text-green-800",
            INACTIVE: "bg-gray-100 text-gray-800",
            MAINTENANCE: "bg-yellow-100 text-yellow-800",
            FAULTY: "bg-red-100 text-red-800"
        }
        const labels: Record<string, string> = {
            ACTIVE: "Activo",
            INACTIVE: "Inactivo",
            MAINTENANCE: "Mantenimiento",
            FAULTY: "Con fallas"
        }
        return (
            <Badge className={variants[status] || "bg-gray-100 text-gray-800"}>
                {labels[status] || status}
            </Badge>
        )
    }

    const shareLocation = (lat: number, lng: number, address?: string) => {
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
        const whatsappText = `📍 *Ubicación del Sensor*\n${address || 'Sin dirección'}\nCoordenadas: ${lat}, ${lng}\n\nVer en Google Maps: ${googleMapsUrl}`

        if (navigator.share) {
            navigator.share({
                title: 'Ubicación del Sensor',
                text: whatsappText,
                url: googleMapsUrl
            }).catch(() => { })
        } else {
            // Opción de copiar o abrir WhatsApp Web
            const option = confirm("¿Deseas compartir por WhatsApp o copiar el enlace?\n\nOK = WhatsApp\nCancelar = Copiar enlace")
            if (option) {
                window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText)}`, '_blank')
            } else {
                navigator.clipboard.writeText(googleMapsUrl)
                toast.success("Enlace de Google Maps copiado")
            }
        }
    }

    const navigateToLocation = (lat: number, lng: number) => {
        // Abre Google Maps con la ruta desde la ubicación actual del usuario
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const url = `https://www.google.com/maps/dir/${position.coords.latitude},${position.coords.longitude}/${lat},${lng}`
                    window.open(url, '_blank')
                },
                () => {
                    // Si no se puede obtener la ubicación, abre sin punto de origen
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
                }
            )
        } else {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
        }
    }

    const totalSensors = sensors.length
    const activeSensors = sensors.filter(s => s.status === "ACTIVE").length
    const inactiveSensors = sensors.filter(s => s.status === "INACTIVE").length
    const maintenanceSensors = sensors.filter(s => s.status === "MAINTENANCE").length
    const faultySensors = sensors.filter(s => s.status === "FAULTY").length
    const totalLocations = locations.length

    if (loading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                        <p className="text-sm text-gray-500">Cargando mapas y sensores...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-full">
            {/* Header responsivo */}
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">Mapas y Ubicaciones</h1>
                        <p className="text-sm sm:text-base text-gray-600 mt-1">
                            Monitoreo en tiempo real de sensores y ubicaciones
                        </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            onClick={() => setViewMode(viewMode === "map" ? "table" : "map")}
                            className="flex-1 sm:flex-none text-sm"
                        >
                            {viewMode === "map" ? "Ver Tabla" : "Ver Mapa"}
                        </Button>
                        <Button className="flex-1 sm:flex-none text-sm" onClick={() => setCreateMapDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Nuevo Mapa</span>
                            <span className="sm:hidden">Nuevo</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Estadísticas responsivas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
                <Card className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <MapIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                        <div>
                            <div className="text-xs sm:text-sm text-gray-500">Mapas</div>
                            <div className="text-lg sm:text-2xl font-bold">{maps.length}</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
                        <div>
                            <div className="text-xs sm:text-sm text-gray-500">Ubicaciones</div>
                            <div className="text-lg sm:text-2xl font-bold">{totalLocations}</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-3 sm:p-4 bg-green-50 border-green-200">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                        <div>
                            <div className="text-xs sm:text-sm text-green-700">Activos</div>
                            <div className="text-lg sm:text-2xl font-bold text-green-800">{activeSensors}</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-3 sm:p-4 bg-gray-50 border-gray-200">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-gray-600" />
                        <div>
                            <div className="text-xs sm:text-sm text-gray-700">Inactivos</div>
                            <div className="text-lg sm:text-2xl font-bold text-gray-800">{inactiveSensors}</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-3 sm:p-4 bg-yellow-50 border-yellow-200">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
                        <div>
                            <div className="text-xs sm:text-sm text-yellow-700">Mantenimiento</div>
                            <div className="text-lg sm:text-2xl font-bold text-yellow-800">{maintenanceSensors}</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-3 sm:p-4 bg-red-50 border-red-200">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                        <div>
                            <div className="text-xs sm:text-sm text-red-700">Con fallas</div>
                            <div className="text-lg sm:text-2xl font-bold text-red-800">{faultySensors}</div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filtros responsivos */}
            <div className="space-y-4 mb-6">
                {/* Búsqueda */}
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Buscar por nombre, medidor, DNI, dirección..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Filtros */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
                    <Select value={selectedMap} onValueChange={setSelectedMap}>
                        <SelectTrigger className="w-full sm:w-[250px]">
                            <SelectValue placeholder="Filtrar por mapa" />
                        </SelectTrigger>
                        <SelectContent className="z-[9999]">
                            <SelectItem value="all">Todos los mapas</SelectItem>
                            {maps.map((map) => (
                                <SelectItem key={map.id} value={map.id.toString()}>
                                    {map.name} ({map._count.locations} ubicaciones)
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Estado del sensor" />
                        </SelectTrigger>
                        <SelectContent className="z-[9999]">
                            <SelectItem value="all">Todos los estados</SelectItem>
                            <SelectItem value="ACTIVE">Activos</SelectItem>
                            <SelectItem value="INACTIVE">Inactivos</SelectItem>
                            <SelectItem value="MAINTENANCE">En mantenimiento</SelectItem>
                            <SelectItem value="FAULTY">Con fallas</SelectItem>
                        </SelectContent>
                    </Select>

                    {viewMode === "map" && (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="w-full sm:w-auto"
                        >
                            <Maximize2 className="h-4 w-4" />
                            <span className="ml-2 sm:hidden">Pantalla completa</span>
                        </Button>
                    )}
                </div>
            </div>

            {viewMode === "map" ? (
                /* Vista de mapa responsiva */
                <div className={`bg-white rounded-lg border transition-all ${isFullscreen ? 'fixed inset-2 sm:inset-4 z-50' : ''
                    } ${createMapDialogOpen ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="p-2 sm:p-4">
                        <InteractiveMap
                            locations={filteredLocations.map(loc => ({
                                ...loc,
                                sensors: sensorsWithLocation.filter(s =>
                                    s.location!.latitude === loc.latitude &&
                                    s.location!.longitude === loc.longitude
                                )
                            }))}
                            onLocationClick={(location) => {
                                const sensor = sensorsWithLocation.find(s =>
                                    s.location!.latitude === location.latitude &&
                                    s.location!.longitude === location.longitude
                                )
                                if (sensor) {
                                    setSearchTerm(sensor.numero_medidor)
                                }
                            }}
                            onMapClick={(lat, lng) => {
                                console.log('Nueva ubicación:', lat, lng)
                            }}
                            style={{
                                height: isFullscreen
                                    ? 'calc(100vh - 80px)'
                                    : window.innerWidth < 640
                                        ? '400px'
                                        : '500px'
                            }}
                        />
                    </div>
                </div>
            ) : (
                /* Vista de tabla responsiva */
                <div className="bg-white">
                    {/* Vista de tabla para desktop */}
                    <div className="hidden md:block rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Sensor</TableHead>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead>Ubicación</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSensors.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                            No se encontraron sensores
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredSensors.map((sensor) => (
                                        <TableRow key={sensor.id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{sensor.name || sensor.nombre}</div>
                                                    <div className="text-sm text-gray-500">
                                                        Medidor: {sensor.numero_medidor}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-gray-400" />
                                                    <div>
                                                        <div className="text-sm">{sensor.user.name || "Sin nombre"}</div>
                                                        <div className="text-xs text-gray-500">DNI: {sensor.user.dni}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {sensor.location ? (
                                                    <div className="flex items-start gap-2">
                                                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                                                        <div>
                                                            <div className="text-sm">{sensor.location.address || "Sin dirección"}</div>
                                                            <div className="text-xs text-gray-500">
                                                                {sensor.location.latitude.toFixed(6)}, {sensor.location.longitude.toFixed(6)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-gray-400">
                                                        <MapPin className="h-4 w-4" />
                                                        <span className="text-sm">Sin ubicación</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(sensor.status)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {sensor.location && (
                                                    <div className="flex gap-2 justify-end">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => shareLocation(
                                                                sensor.location!.latitude,
                                                                sensor.location!.longitude,
                                                                sensor.location!.address || undefined
                                                            )}
                                                            title="Compartir"
                                                        >
                                                            <Share2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => navigateToLocation(
                                                                sensor.location!.latitude,
                                                                sensor.location!.longitude
                                                            )}
                                                            title="Navegar"
                                                        >
                                                            <Navigation className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Vista de tarjetas para móviles */}
                    <div className="md:hidden space-y-4">
                        {filteredSensors.length === 0 ? (
                            <div className="text-center py-12">
                                <MapIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-500">No se encontraron sensores</p>
                            </div>
                        ) : (
                            filteredSensors.map((sensor) => (
                                <div key={sensor.id} className="border rounded-lg p-4 bg-white shadow-sm">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Activity className="h-4 w-4 text-gray-400" />
                                                <h3 className="font-medium text-base">{sensor.name || sensor.nombre}</h3>
                                                {getStatusBadge(sensor.status)}
                                            </div>
                                            <div className="text-sm text-gray-600 mb-2">
                                                <span className="text-gray-500">Medidor:</span>{" "}
                                                <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                                                    {sensor.numero_medidor}
                                                </code>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Información del usuario */}
                                    <div className="border-t pt-3 mb-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <User className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm font-medium">Usuario</span>
                                        </div>
                                        <div className="ml-6 space-y-1">
                                            <div className="text-sm">{sensor.user.name || "Sin nombre"}</div>
                                            <div className="text-xs text-gray-500">DNI: {sensor.user.dni}</div>
                                        </div>
                                    </div>

                                    {/* Información de ubicación */}
                                    <div className="border-t pt-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <MapPin className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm font-medium">Ubicación</span>
                                        </div>
                                        {sensor.location ? (
                                            <div className="ml-6 space-y-1">
                                                <div className="text-sm">{sensor.location.address || "Sin dirección"}</div>
                                                <div className="text-xs text-gray-500">
                                                    {sensor.location.latitude.toFixed(6)}, {sensor.location.longitude.toFixed(6)}
                                                </div>

                                                {/* Botones de acción para móviles */}
                                                <div className="flex gap-2 pt-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1 text-xs"
                                                        onClick={() => shareLocation(
                                                            sensor.location!.latitude,
                                                            sensor.location!.longitude,
                                                            sensor.location!.address || undefined
                                                        )}
                                                    >
                                                        <Share2 className="h-3 w-3 mr-1" />
                                                        Compartir
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1 text-xs"
                                                        onClick={() => navigateToLocation(
                                                            sensor.location!.latitude,
                                                            sensor.location!.longitude
                                                        )}
                                                    >
                                                        <Navigation className="h-3 w-3 mr-1" />
                                                        Navegar
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="ml-6">
                                                <div className="text-sm text-gray-400">Sin ubicación asignada</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            <CreateMapDialog
                open={createMapDialogOpen}
                onOpenChange={setCreateMapDialogOpen}
                onMapCreated={() => {
                    setCreateMapDialogOpen(false)
                    fetchData() // Refrescar los datos después de crear
                }}
            />
        </div>
    )
}