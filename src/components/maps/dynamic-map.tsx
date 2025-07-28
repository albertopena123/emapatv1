// src/components/maps/dynamic-map.tsx
import dynamic from 'next/dynamic'
import { Loader2, Map } from 'lucide-react'

// Loading component responsivo
const ResponsiveMapLoader = ({ height = '500px' }: { height?: string }) => (
    <div
        className="flex items-center justify-center bg-gray-50 rounded-lg border"
        style={{ height }}
    >
        <div className="text-center p-4">
            <div className="relative mb-4">
                <Map className="h-8 w-8 sm:h-12 sm:w-12 text-gray-300 mx-auto" />
                <Loader2 className="h-4 w-4 sm:h-6 sm:w-6 text-blue-500 animate-spin absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-sm sm:text-base text-gray-500">Cargando mapa...</p>
            <p className="text-xs text-gray-400 mt-1 hidden sm:block">
                Preparando ubicaciones y sensores
            </p>
        </div>
    </div>
)

export const InteractiveMap = dynamic(
    () => import('./interactive-map').then((mod) => mod.InteractiveMap),
    {
        ssr: false,
        loading: () => <ResponsiveMapLoader />
    }
)