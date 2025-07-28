// src/components/locations/location-picker-map.tsx
'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
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

interface LocationPickerMapProps {
    initialCoordinates?: { lat: number; lng: number } | null
    onLocationSelect: (lat: number, lng: number) => void
    height?: string
}

function LocationPicker({
    onLocationSelect
}: {
    onLocationSelect: (lat: number, lng: number) => void
}) {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng)
        },
    })
    return null
}

export function LocationPickerMap({
    initialCoordinates,
    onLocationSelect,
    height = "400px"
}: LocationPickerMapProps) {
    const [map, setMap] = useState<L.Map | null>(null)
    const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(
        initialCoordinates ? [initialCoordinates.lat, initialCoordinates.lng] : null
    )

    useEffect(() => {
        if (initialCoordinates) {
            const newPosition: [number, number] = [initialCoordinates.lat, initialCoordinates.lng]
            setMarkerPosition(newPosition)
            if (map) {
                map.setView(newPosition, 16)
            }
        }
    }, [initialCoordinates, map])

    const handleLocationSelect = (lat: number, lng: number) => {
        setMarkerPosition([lat, lng])
        onLocationSelect(lat, lng)
    }

    return (
        <div style={{ height }} className="relative rounded-b-lg overflow-hidden">
            <MapContainer
                center={markerPosition || DEFAULT_CENTER}
                zoom={markerPosition ? 16 : DEFAULT_ZOOM}
                style={{ height: '100%', width: '100%' }}
                ref={setMap}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <LocationPicker onLocationSelect={handleLocationSelect} />

                {markerPosition && (
                    <Marker position={markerPosition} />
                )}
            </MapContainer>

            <div className="absolute bottom-4 left-4 z-[1000] bg-background/90 backdrop-blur-sm rounded-md p-2">
                <p className="text-sm">
                    Haz clic en el mapa para seleccionar la ubicación
                </p>
            </div>
        </div>
    )
}