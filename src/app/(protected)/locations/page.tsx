// src/app/(protected)/locations/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { DynamicSensorLocationMap } from '@/components/locations/dynamic-maps'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Map, List, MapPin, Loader2 } from 'lucide-react'

// Importamos la tabla responsiva que creamos
import { SensorLocationTable } from '@/components/locations/sensor-location-table'

interface SensorWithLocation {
    id: number
    nombre: string
    numero_medidor: string
    direccion: string
    status: string
    location: {
        id: number
        latitude: number
        longitude: number
        address?: string
    } | null
}

export default function LocationsPage() {
    const [sensors, setSensors] = useState<SensorWithLocation[]>([])
    const [selectedSensor, setSelectedSensor] = useState<SensorWithLocation | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchSensors()
    }, [])

    const fetchSensors = async () => {
        setIsLoading(true)
        try {
            // Usar la nueva API dedicada para ubicaciones
            const response = await fetch('/api/sensor-locations')
            if (response.ok) {
                const data = await response.json()
                setSensors(data)
            }
        } catch (error) {
            console.error('Error fetching sensors:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const sensorsWithLocation = sensors.filter(s => s.location)
    const sensorsWithoutLocation = sensors.filter(s => !s.location)

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-full">
            {/* Header responsivo */}
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    Ubicaciones de Sensores
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
                    Asigna y gestiona las ubicaciones GPS de los sensores
                </p>
            </div>

            {/* Cards de estadísticas responsivas */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3 mb-6 sm:mb-8">
                <Card>
                    <CardHeader className="pb-3 sm:pb-4">
                        <CardTitle className="text-sm sm:text-base flex items-center justify-between">
                            Total Sensores
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-xl sm:text-2xl font-bold">{sensors.length}</div>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            Sensores registrados
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3 sm:pb-4">
                        <CardTitle className="text-sm sm:text-base flex items-center justify-between">
                            Con Ubicación
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-xl sm:text-2xl font-bold text-green-600">
                            {sensorsWithLocation.length}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            {sensors.length > 0 ? Math.round((sensorsWithLocation.length / sensors.length) * 100) : 0}% del total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3 sm:pb-4">
                        <CardTitle className="text-sm sm:text-base flex items-center justify-between">
                            Sin Ubicación
                            <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-xl sm:text-2xl font-bold text-orange-600">
                            {sensorsWithoutLocation.length}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            Pendientes de asignar
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs responsivos */}
            <Tabs defaultValue="map" className="space-y-4 sm:space-y-6">
                <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-flex">
                    <TabsTrigger value="map" className="gap-2 text-sm">
                        <Map className="h-4 w-4" />
                        <span className="hidden sm:inline">Vista de </span>Mapa
                    </TabsTrigger>
                    <TabsTrigger value="list" className="gap-2 text-sm">
                        <List className="h-4 w-4" />
                        <span className="hidden sm:inline">Vista de </span>Lista
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="map" className="space-y-4 mt-4 sm:mt-6">
                    <Card>
                        <CardHeader className="pb-4 sm:pb-6">
                            <CardTitle className="text-lg sm:text-xl">Mapa de Sensores</CardTitle>
                            <CardDescription className="text-sm sm:text-base">
                                Visualiza y asigna ubicaciones a los sensores
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="relative">
                                <div className="h-[400px] sm:h-[500px] lg:h-[600px]">
                                    {isLoading ? (
                                        <div className="h-full flex items-center justify-center bg-gray-50">
                                            <div className="text-center">
                                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                                                <p className="mt-2 text-sm text-muted-foreground">Cargando mapa...</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <DynamicSensorLocationMap
                                            sensors={sensorsWithLocation}
                                            selectedSensor={selectedSensor}
                                            onSensorSelect={setSelectedSensor}
                                            height="100%"
                                        />
                                    )}
                                </div>

                                {/* Overlay de información en móviles si hay sensor seleccionado */}
                                {selectedSensor && (
                                    <div className="absolute bottom-4 left-4 right-4 sm:hidden">
                                        <Card className="border-2 border-primary">
                                            <CardContent className="p-3">
                                                <h4 className="font-medium text-sm">
                                                    {selectedSensor.nombre || selectedSensor.numero_medidor}
                                                </h4>
                                                <p className="text-xs text-muted-foreground">
                                                    {selectedSensor.direccion}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="list" className="space-y-4 mt-4 sm:mt-6">
                    <Card className="overflow-visible">
                        <CardHeader className="pb-4 sm:pb-6">
                            <CardTitle className="text-lg sm:text-xl">Lista de Sensores</CardTitle>
                            <CardDescription className="text-sm sm:text-base">
                                Administra las ubicaciones GPS de cada sensor
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 overflow-visible">
                            {isLoading ? (
                                <div className="text-center py-8 text-muted-foreground px-4 sm:px-6">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                                    <p className="mt-3 text-sm">Cargando sensores...</p>
                                </div>
                            ) : (
                                <div className="w-full overflow-x-auto px-4 sm:px-6 pb-4 sm:pb-6">
                                    <SensorLocationTable
                                        sensors={sensors}
                                        onSensorSelect={setSelectedSensor}
                                        onRefresh={fetchSensors}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Información adicional para móviles */}
            <div className="mt-6 sm:hidden">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>
                                Toca en cualquier sensor del mapa para ver sus detalles
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}