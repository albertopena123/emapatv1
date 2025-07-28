// src/components/locations/dynamic-maps.tsx
import dynamic from 'next/dynamic'

export const DynamicSensorLocationMap = dynamic(
    () => import('./sensor-location-map').then((mod) => mod.SensorLocationMap),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded-lg">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-500">Cargando mapa...</p>
                </div>
            </div>
        )
    }
)

export const DynamicLocationPickerMap = dynamic(
    () => import('./location-picker-map').then((mod) => mod.LocationPickerMap),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center h-[400px] bg-gray-50 rounded-lg">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Cargando mapa...</p>
                </div>
            </div>
        )
    }
)