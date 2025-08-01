//El problema del doble renderizado es causado por el dynamic import con ssr: false.Aquí está la solución:
// src/components/dashboard/ConsumptionChartWrapper.tsx
'use client'

import ConsumptionChart from './ConsumptionChart'

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