// src/components/maps/interactive-map.tsx
"use client"

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Activity, Share2, Navigation, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

// Arreglar iconos de Leaflet
interface IconDefault extends L.Icon.Default {
    _getIconUrl?: string;
}
delete (L.Icon.Default.prototype as IconDefault)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/leaflet/marker-icon-2x.png',
    iconUrl: '/leaflet/marker-icon.png',
    shadowUrl: '/leaflet/marker-shadow.png',
})

interface Location {
    id: number
    latitude: number
    longitude: number
    address: string | null
    sensors?: {
        id: number
        name?: string
        nombre?: string // Para compatibilidad
        status: string
        numero_medidor: string
        user?: {
            name: string | null
            dni: string
        }
    }[]
}

interface InteractiveMapProps {
    locations: Location[]
    center?: [number, number]
    zoom?: number
    onLocationClick?: (location: Location) => void
    onMapClick?: (lat: number, lng: number) => void
    style?: React.CSSProperties
}

function MapController({ center, onMapClick }: { center: [number, number], onMapClick?: (lat: number, lng: number) => void }) {
    const map = useMap()

    useEffect(() => {
        map.setView(center)
    }, [center, map])

    useEffect(() => {
        if (onMapClick) {
            const handleClick = (e: L.LeafletMouseEvent) => {
                onMapClick(e.latlng.lat, e.latlng.lng)
            }

            map.on('click', handleClick)

            return () => {
                map.off('click', handleClick)
            }
        }
    }, [map, onMapClick])

    return null
}

// Hook para detectar dispositivos móviles
const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)

        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    return isMobile
}

// Iconos personalizados por estado (responsivos)
const createCustomIcon = (status: string, isMobile: boolean = false) => {
    const colors = {
        ACTIVE: '#10b981',
        INACTIVE: '#6b7280',
        MAINTENANCE: '#f59e0b',
        FAULTY: '#ef4444'
    }

    const color = colors[status as keyof typeof colors] || colors.INACTIVE
    const size = isMobile ? 28 : 32 // Tamaño adaptativo

    return L.divIcon({
        html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="transform: rotate(45deg); color: white;">
          <svg width="${isMobile ? 14 : 16}" height="${isMobile ? 14 : 16}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
        </div>
      </div>
    `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size],
        className: 'custom-marker'
    })
}

// Componente para acciones de ubicación
function LocationActions({ location }: { location: Location }) {
    const shareLocation = () => {
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`
        const whatsappText = `📍 *Ubicación del Sensor*\n${location.address || 'Sin dirección'}\nCoordenadas: ${location.latitude}, ${location.longitude}\n\nVer en Google Maps: ${googleMapsUrl}`

        if (navigator.share) {
            navigator.share({
                title: 'Ubicación del Sensor',
                text: whatsappText,
                url: googleMapsUrl
            }).catch(() => { })
        } else {
            // Copiar enlace
            navigator.clipboard.writeText(googleMapsUrl)
            toast.success("Enlace copiado al portapapeles")
        }
    }

    const navigateToLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const url = `https://www.google.com/maps/dir/${position.coords.latitude},${position.coords.longitude}/${location.latitude},${location.longitude}`
                    window.open(url, '_blank')
                },
                () => {
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`, '_blank')
                }
            )
        } else {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`, '_blank')
        }
    }

    return (
        <div className="flex gap-1 mt-2">
            <Button
                variant="outline"
                size="sm"
                onClick={shareLocation}
                className="flex-1 text-xs h-7"
            >
                <Share2 className="h-3 w-3 mr-1" />
                Compartir
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={navigateToLocation}
                className="flex-1 text-xs h-7"
            >
                <Navigation className="h-3 w-3 mr-1" />
                Ir
            </Button>
        </div>
    )
}

// Componente para el popup responsivo
function ResponsivePopup({ location }: { location: Location }) {
    const isMobile = useIsMobile()
    const hasSensors = location.sensors && location.sensors.length > 0

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
            <Badge className={`${variants[status] || variants.INACTIVE} text-xs`}>
                {labels[status] || status}
            </Badge>
        )
    }

    return (
        <div className={`${isMobile ? 'w-64' : 'w-72'}`}>
            {/* Header */}
            <div className="border-b pb-2 mb-2">
                <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">
                            {location.address || 'Ubicación sin dirección'}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Sensores */}
            {hasSensors ? (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-700">
                            Sensores ({location.sensors!.length})
                        </span>
                    </div>

                    <div className="space-y-2 max-h-32 overflow-y-auto">
                        {location.sensors!.map((sensor) => (
                            <div key={sensor.id} className="bg-gray-50 rounded p-2">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className="text-sm font-medium truncate flex-1">
                                        {sensor.name || sensor.nombre}
                                    </span>
                                    {getStatusBadge(sensor.status)}
                                </div>

                                <div className="space-y-1">
                                    <div className="text-xs text-gray-600">
                                        <span className="font-medium">Medidor:</span> {sensor.numero_medidor}
                                    </div>
                                    {sensor.user && (
                                        <div className="text-xs text-gray-600">
                                            <span className="font-medium">Cliente:</span> {sensor.user.name || 'Sin nombre'} (DNI: {sensor.user.dni})
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-2">
                    <Activity className="h-6 w-6 text-gray-300 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Sin sensores asignados</p>
                </div>
            )}

            {/* Acciones */}
            <LocationActions location={location} />
        </div>
    )
}

export function InteractiveMap({
    locations,
    center = [-12.5864, -69.1891], // Puerto Maldonado por defecto
    zoom = 13,
    onLocationClick,
    onMapClick,
    style = { height: '500px', width: '100%' }
}: InteractiveMapProps) {
    const mapRef = useRef<L.Map | null>(null)
    const isMobile = useIsMobile()

    useEffect(() => {
        // Ajustar vista para mostrar todos los marcadores
        if (mapRef.current && locations.length > 0) {
            const bounds = L.latLngBounds(
                locations.map(loc => [loc.latitude, loc.longitude] as L.LatLngTuple)
            )
            const padding: [number, number] = isMobile ? [20, 20] : [50, 50] // Padding adaptativo
            mapRef.current.fitBounds(bounds, { padding })
        }
    }, [locations, isMobile])

    // Configuración responsiva del mapa
    const mapOptions = {
        zoomControl: !isMobile, // Ocultar controles de zoom en móviles
        attributionControl: !isMobile, // Ocultar atribución en móviles
        scrollWheelZoom: !isMobile, // Desactivar zoom con scroll en móviles
    }

    return (
        <div className="relative">
            <MapContainer
                center={center}
                zoom={isMobile ? zoom - 1 : zoom} // Zoom inicial menor en móviles
                style={style}
                ref={mapRef}
                {...mapOptions}
            >
                <TileLayer
                    attribution={isMobile ? '' : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapController center={center} onMapClick={onMapClick} />

                {locations.map((location) => {
                    const hasSensors = location.sensors && location.sensors.length > 0
                    const status = hasSensors && location.sensors ? location.sensors[0].status : 'INACTIVE'

                    return (
                        <Marker
                            key={location.id}
                            position={[location.latitude, location.longitude]}
                            icon={createCustomIcon(status, isMobile)}
                            eventHandlers={{
                                click: () => onLocationClick?.(location)
                            }}
                        >
                            <Popup
                                maxWidth={isMobile ? 280 : 320}
                                className={isMobile ? 'mobile-popup' : 'desktop-popup'}
                            >
                                <ResponsivePopup location={location} />
                            </Popup>
                        </Marker>
                    )
                })}
            </MapContainer>

            {/* Controles flotantes para móviles */}
            {isMobile && (
                <div className="absolute top-2 right-2 z-[1000] flex flex-col gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 w-8 p-0 shadow-lg"
                        onClick={() => {
                            if (mapRef.current) {
                                mapRef.current.zoomIn()
                            }
                        }}
                    >
                        +
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 w-8 p-0 shadow-lg"
                        onClick={() => {
                            if (mapRef.current) {
                                mapRef.current.zoomOut()
                            }
                        }}
                    >
                        -
                    </Button>
                </div>
            )}

            {/* Indicador de carga para móviles */}
            {isMobile && (
                <style jsx global>{`
                    .mobile-popup .leaflet-popup-content-wrapper {
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    }
                    .mobile-popup .leaflet-popup-content {
                        margin: 8px 12px;
                        line-height: 1.4;
                    }
                    .desktop-popup .leaflet-popup-content {
                        margin: 12px 16px;
                    }
                `}</style>
            )}
        </div>
    )
}