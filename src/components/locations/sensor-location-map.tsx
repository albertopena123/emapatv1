// src/components/locations/sensor-location-map.tsx
'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Navigation, Cpu, MapPin } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

// Fix para los iconos de Leaflet
interface IconDefaultPrototype extends L.Icon.Default {
    _getIconUrl?: string;
}
delete (L.Icon.Default.prototype as IconDefaultPrototype)._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/leaflet/marker-icon-2x.png',
    iconUrl: '/leaflet/marker-icon.png',
    shadowUrl: '/leaflet/marker-shadow.png',
})

const DEFAULT_CENTER: [number, number] = [-12.5864, -69.1891]
const DEFAULT_ZOOM = 13

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

interface SensorLocationMapProps {
    sensors: SensorWithLocation[]
    selectedSensor?: SensorWithLocation | null
    onSensorSelect?: (sensor: SensorWithLocation) => void
    height?: string
}

export function SensorLocationMap({
    sensors,
    selectedSensor,
    onSensorSelect,
    height = "600px"
}: SensorLocationMapProps) {
    const [map, setMap] = useState<L.Map | null>(null)

    useEffect(() => {
        if (map && selectedSensor?.location) {
            // Pequeño retraso para asegurar que el mapa esté completamente renderizado
            const timeoutId = setTimeout(() => {
                // Cerrar todos los popups abiertos primero
                map.eachLayer((layer) => {
                    if (layer instanceof L.Marker) {
                        layer.closePopup()
                    }
                })

                // Animar el zoom hacia el sensor seleccionado
                map.flyTo(
                    [selectedSensor.location!.latitude, selectedSensor.location!.longitude],
                    16,
                    {
                        duration: 1.5,
                        easeLinearity: 0.25
                    }
                )

                // Abrir el popup del marcador seleccionado después de la animación
                setTimeout(() => {
                    map.eachLayer((layer) => {
                        if (layer instanceof L.Marker) {
                            const markerLatLng = layer.getLatLng()
                            if (
                                selectedSensor.location &&
                                Math.abs(markerLatLng.lat - selectedSensor.location.latitude) < 0.0001 &&
                                Math.abs(markerLatLng.lng - selectedSensor.location.longitude) < 0.0001
                            ) {
                                layer.openPopup()
                            }
                        }
                    })
                }, 1600)
            }, 100)

            return () => clearTimeout(timeoutId)
        }
    }, [map, selectedSensor])

    const createCustomIcon = (status: string, isSelected: boolean) => {
        const colorMap: Record<string, string> = {
            'ACTIVE': '#22c55e',
            'INACTIVE': '#6b7280',
            'MAINTENANCE': '#f59e0b',
            'FAULTY': '#ef4444'
        }

        const color = colorMap[status] || '#3b82f6'

        return L.divIcon({
            className: 'custom-div-icon',
            html: `
        <div class="relative">
          <div class="absolute -top-8 -left-4 ${isSelected ? 'animate-bounce' : ''}" style="color: ${color}">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          ${isSelected ? '<div class="absolute -top-10 -left-6 w-12 h-12 rounded-full border-2 border-blue-500 animate-ping"></div>' : ''}
        </div>
      `,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
        })
    }

    const centerMap = () => {
        if (map) {
            map.setView(DEFAULT_CENTER, DEFAULT_ZOOM)
        }
    }

    const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
        switch (status) {
            case 'ACTIVE': return 'default'
            case 'INACTIVE': return 'secondary'
            case 'MAINTENANCE': return 'outline'
            case 'FAULTY': return 'destructive'
            default: return 'outline'
        }
    }

    return (
        <div className="relative" style={{ height }}>
            <MapContainer
                center={DEFAULT_CENTER}
                zoom={DEFAULT_ZOOM}
                style={{ height: '100%', width: '100%' }}
                ref={setMap}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {sensors.map((sensor) => (
                    sensor.location && (
                        <Marker
                            key={sensor.id}
                            position={[sensor.location.latitude, sensor.location.longitude]}
                            icon={createCustomIcon(sensor.status, selectedSensor?.id === sensor.id)}
                            eventHandlers={{
                                click: () => onSensorSelect?.(sensor)
                            }}
                        >
                            <Popup>
                                <div className="p-2 min-w-[200px]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Cpu className="h-4 w-4 text-muted-foreground" />
                                        <h3 className="font-semibold">
                                            {sensor.nombre || `Sensor ${sensor.id}`}
                                        </h3>
                                    </div>

                                    <div className="space-y-1 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Medidor:</span>{' '}
                                            <code className="text-xs">{sensor.numero_medidor}</code>
                                        </div>

                                        <div>
                                            <span className="text-muted-foreground">Estado:</span>{' '}
                                            <Badge variant={getStatusBadgeVariant(sensor.status)} className="h-5">
                                                {sensor.status}
                                            </Badge>
                                        </div>

                                        <div>
                                            <span className="text-muted-foreground">Dirección:</span><br />
                                            {sensor.location.address || sensor.direccion}
                                        </div>

                                        <div className="pt-2 text-xs text-muted-foreground">
                                            Lat: {sensor.location.latitude.toFixed(6)}<br />
                                            Lng: {sensor.location.longitude.toFixed(6)}
                                        </div>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    )
                ))}
            </MapContainer>

            <Button
                size="sm"
                variant="secondary"
                className="absolute top-4 right-4 z-[1000]"
                onClick={centerMap}
            >
                <Navigation className="h-4 w-4" />
            </Button>

            <div className="absolute bottom-4 left-4 z-[1000] bg-background/90 backdrop-blur-sm rounded-md p-3">
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span>Activo</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                        <span>Inactivo</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <span>Mantenimiento</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span>Falla</span>
                    </div>
                </div>
            </div>

            {selectedSensor && (
                <div className="absolute top-4 left-4 z-[1000] bg-background/90 backdrop-blur-sm rounded-md p-3 max-w-xs">
                    <div className="text-sm">
                        <p className="font-medium text-xs text-muted-foreground mb-1">Sensor seleccionado:</p>
                        <p className="font-semibold">{selectedSensor.nombre || selectedSensor.numero_medidor}</p>
                    </div>
                </div>
            )}
        </div>
    )
}