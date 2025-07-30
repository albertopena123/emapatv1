// src/components/dashboard/ConsumptionChartWrapper.tsx
'use client'

import dynamic from 'next/dynamic'
import { Droplets } from 'lucide-react'

const ConsumptionChart = dynamic(
    () => import('./ConsumptionChart'),
    {
        ssr: false,
        loading: () => (
            <div className="h-80 flex items-center justify-center">
                <div className="text-center">
                    <Droplets className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-pulse" />
                    <div className="animate-pulse text-gray-400">Cargando gráfico...</div>
                </div>
            </div>
        )
    }
)

interface ConsumptionData {
    id: number
    amount: number
    consumption: number | null
    readingDate: string
    timestamp: string
}

interface ConsumptionChartWrapperProps {
    data: ConsumptionData[]
}

export default function ConsumptionChartWrapper({ data }: ConsumptionChartWrapperProps) {
    return <ConsumptionChart data={data} />
}