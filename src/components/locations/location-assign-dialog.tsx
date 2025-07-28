// src/components/locations/location-assign-dialog.tsx
'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogTrigger,
    ResponsiveDialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/responsive-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    MapPin,
    Navigation,
    Loader2,
    AlertCircle,
    Check
} from 'lucide-react'
import { toast } from 'sonner'
import { DynamicLocationPickerMap } from './dynamic-maps'
import { Alert, AlertDescription } from '@/components/ui/alert'

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

interface LocationAssignDialogProps {
    sensor: SensorWithLocation | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function LocationAssignDialog({
    sensor,
    open,
    onOpenChange,
    onSuccess
}: LocationAssignDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isGettingLocation, setIsGettingLocation] = useState(false)
    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
    const [address, setAddress] = useState('')

    useEffect(() => {
        if (sensor?.location) {
            setCoordinates({
                lat: sensor.location.latitude,
                lng: sensor.location.longitude
            })
            setAddress(sensor.location.address || sensor.direccion)
        } else if (sensor) {
            setCoordinates(null)
            setAddress(sensor.direccion)
        }
    }, [sensor])

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Tu navegador no soporta geolocalización')
            return
        }

        setIsGettingLocation(true)
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords
                setCoordinates({ lat: latitude, lng: longitude })
                toast.success('Ubicación obtenida correctamente')
                setIsGettingLocation(false)
            },
            (error) => {
                let message = 'Error al obtener ubicación'
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = 'Permiso de ubicación denegado'
                        break
                    case error.POSITION_UNAVAILABLE:
                        message = 'Ubicación no disponible'
                        break
                    case error.TIMEOUT:
                        message = 'Tiempo de espera agotado'
                        break
                }
                toast.error(message)
                setIsGettingLocation(false)
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        )
    }

    const handleSave = async () => {
        if (!sensor || !coordinates) return

        setIsLoading(true)
        try {
            // Primero crear o actualizar la ubicación
            const locationData = {
                latitude: coordinates.lat,
                longitude: coordinates.lng,
                address: address || sensor.direccion,
                mapId: 1 // Puerto Maldonado por defecto
            }

            let locationId: number

            if (sensor.location) {
                // Actualizar ubicación existente
                const response = await fetch(`/api/locations/${sensor.location.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(locationData)
                })
                if (!response.ok) throw new Error('Error al actualizar ubicación')
                locationId = sensor.location.id
            } else {
                // Crear nueva ubicación
                const response = await fetch('/api/locations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(locationData)
                })
                if (!response.ok) throw new Error('Error al crear ubicación')
                const newLocation = await response.json()
                locationId = newLocation.id
            }

            // Actualizar el sensor con la ubicación
            const sensorResponse = await fetch(`/api/sensors/${sensor.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ locationId })
            })

            if (!sensorResponse.ok) throw new Error('Error al actualizar sensor')

            toast.success('Ubicación asignada correctamente')
            onSuccess?.()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Error al guardar ubicación')
        } finally {
            setIsLoading(false)
        }
    }

    if (!sensor) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <ResponsiveDialogContent>
                <DialogHeader>
                    <DialogTitle>Asignar Ubicación GPS</DialogTitle>
                    <DialogDescription>
                        Sensor: {sensor.nombre || sensor.numero_medidor}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 lg:grid-cols-2 grid-cols-1">
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Información del Sensor</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div>
                                    <Label className="text-muted-foreground">Medidor</Label>
                                    <p className="font-mono text-sm">{sensor.numero_medidor}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Dirección registrada</Label>
                                    <p className="text-sm">{sensor.direccion}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Coordenadas GPS</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={getCurrentLocation}
                                    disabled={isGettingLocation}
                                >
                                    {isGettingLocation ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Navigation className="h-4 w-4 mr-2" />
                                    )}
                                    Usar mi ubicación actual
                                </Button>

                                {coordinates && (
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <Label>Latitud</Label>
                                                <Input
                                                    type="number"
                                                    step="0.000001"
                                                    value={coordinates.lat}
                                                    onChange={(e) => setCoordinates({
                                                        ...coordinates,
                                                        lat: parseFloat(e.target.value)
                                                    })}
                                                />
                                            </div>
                                            <div>
                                                <Label>Longitud</Label>
                                                <Input
                                                    type="number"
                                                    step="0.000001"
                                                    value={coordinates.lng}
                                                    onChange={(e) => setCoordinates({
                                                        ...coordinates,
                                                        lng: parseFloat(e.target.value)
                                                    })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label>Dirección (opcional)</Label>
                                            <Input
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                placeholder="Confirmar o modificar dirección"
                                            />
                                        </div>
                                    </div>
                                )}

                                {!coordinates && (
                                    <Alert>
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            Usa tu ubicación actual o selecciona un punto en el mapa
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Seleccionar en el mapa
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DynamicLocationPickerMap
                                initialCoordinates={coordinates}
                                onLocationSelect={(lat, lng) => setCoordinates({ lat, lng })}
                                height="400px"
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isLoading || !coordinates}
                    >
                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {sensor.location ? 'Actualizar ubicación' : 'Asignar ubicación'}
                    </Button>
                </div>
            </ResponsiveDialogContent>
        </Dialog>
    )
}