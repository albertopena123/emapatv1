// src/components/dashboard/ConsumptionSummaryWrapper.tsx
'use client'

import dynamic from 'next/dynamic'
import { Droplets } from 'lucide-react'

const ConsumptionSummary = dynamic(
    () => import('./ConsumptionSummary'),
    {
        ssr: false,
        loading: () => (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                    <Droplets className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-pulse" />
                    <div className="animate-pulse text-gray-400">Cargando resumen...</div>
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

interface ConsumptionSummaryWrapperProps {
    consumptionHistory: ConsumptionData[]
    currentConsumption: number
    lastReading: {
        amount: number
        readingDate: string
        consumption: number | null
    } | null
}

export default function ConsumptionSummaryWrapper(props: ConsumptionSummaryWrapperProps) {
    return <ConsumptionSummary {...props} />
}