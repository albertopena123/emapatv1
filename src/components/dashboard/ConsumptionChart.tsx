// src/components/dashboard/ConsumptionChart.tsx
'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ConsumptionData {
    id: number
    amount: number
    consumption: number | null
    readingDate: string
    timestamp: string
}

interface ConsumptionChartProps {
    data: ConsumptionData[]
}

export default function ConsumptionChart({ data }: ConsumptionChartProps) {
    // Filtrar datos con consumo válido (mayor a 0)
    const filteredData = data.filter(item => item.consumption && item.consumption > 0)

    const chartData = filteredData.map(item => ({
        fecha: format(new Date(item.readingDate), "dd/MM", { locale: es }),
        consumo: item.consumption || 0, // Ya está en litros
        lectura: item.amount // Ya está en litros
    }))

    // Si no hay datos válidos, mostrar mensaje
    if (chartData.length === 0) {
        return (
            <div className="h-80 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500 mb-2">No hay datos de consumo disponibles</p>
                    <p className="text-sm text-gray-400">Se mostrarán los datos cuando haya lecturas con consumo mayor a 0</p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="fecha"
                        tick={{ fontSize: 12 }}
                    />
                    <YAxis
                        label={{
                            value: 'Litros',
                            angle: -90,
                            position: 'insideLeft',
                            style: { fontSize: 14 }
                        }}
                        tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                        formatter={(value: number) => `${value.toLocaleString()} L`}
                        labelFormatter={(label) => `Fecha: ${label}`}
                        contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px'
                        }}
                    />
                    <Legend
                        wrapperStyle={{
                            paddingTop: '20px'
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="consumo"
                        stroke="#06b6d4"
                        name="Consumo diario (L)"
                        strokeWidth={2}
                        dot={{ fill: '#06b6d4', r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                    {/* Línea opcional para mostrar las lecturas acumuladas */}
                    {/* <Line 
                        type="monotone" 
                        dataKey="lectura" 
                        stroke="#8b5cf6" 
                        name="Lectura acumulada (L)"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: '#8b5cf6', r: 3 }}
                        activeDot={{ r: 5 }}
                    /> */}
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}