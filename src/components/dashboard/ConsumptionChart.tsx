// src/components/dashboard/ConsumptionChart.tsx
'use client'

import { useState, useMemo } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, Clock, Droplets, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

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

type ViewMode = 'daily' | 'hourly'
type TimeRange = '7days' | '15days' | '30days' | 'custom'

interface DailyChartData {
    fecha: string
    consumoTotal: number
    lecturas: number
    consumoPromedio: number
    consumoMaximo: number
    horaMaximo: string
}

interface HourlyChartData {
    fecha: string
    fechaCompleta?: string
    consumo: number
    lectura?: number
}

interface HourlyGroupData {
    fecha: string
    consumoTotal: number
    lecturas: number
    consumoPromedio: number
}

export default function ConsumptionChart({ data }: ConsumptionChartProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('daily')
    const [timeRange, setTimeRange] = useState<TimeRange>('30days')
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
    const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
        from: undefined,
        to: undefined,
    })

    // Filtrar datos según el rango seleccionado
    const filteredData = useMemo(() => {
        const filtered = data.filter(item => item.consumption && item.consumption > 0)

        const now = new Date()
        let startDate: Date
        let endDate = now

        switch (timeRange) {
            case '7days':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                break
            case '15days':
                startDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)
                break
            case '30days':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                break
            case 'custom':
                if (dateRange.from && dateRange.to) {
                    startDate = dateRange.from
                    endDate = dateRange.to
                } else if (selectedDate) {
                    startDate = startOfDay(selectedDate)
                    endDate = endOfDay(selectedDate)
                } else {
                    return filtered
                }
                break
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        }

        return filtered.filter(item => {
            const itemDate = parseISO(item.readingDate)
            return isWithinInterval(itemDate, { start: startDate, end: endDate })
        })
    }, [data, timeRange, selectedDate, dateRange])

    // Preparar datos para el gráfico
    const chartData = useMemo(() => {
        if (viewMode === 'daily') {
            // Agrupar por día
            const groupedByDay = filteredData.reduce((acc, item) => {
                const day = format(parseISO(item.readingDate), 'yyyy-MM-dd')
                if (!acc[day]) {
                    acc[day] = {
                        fecha: format(parseISO(item.readingDate), 'dd/MM', { locale: es }),
                        consumoTotal: 0,
                        lecturas: 0,
                        consumoPromedio: 0,
                        consumoMaximo: 0,
                        horaMaximo: ''
                    }
                }
                acc[day].consumoTotal += item.consumption || 0
                acc[day].lecturas += 1
                if ((item.consumption || 0) > acc[day].consumoMaximo) {
                    acc[day].consumoMaximo = item.consumption || 0
                    acc[day].horaMaximo = format(parseISO(item.readingDate), 'HH:mm')
                }
                return acc
            }, {} as Record<string, DailyChartData>)

            return Object.values(groupedByDay).map((day) => ({
                ...day,
                consumoPromedio: Math.round(day.consumoTotal / day.lecturas)
            }))
        } else {
            // Vista por hora (para un día específico o últimas 24 horas)
            const hourlyData = filteredData.map(item => ({
                fecha: format(parseISO(item.readingDate), 'HH:mm', { locale: es }),
                fechaCompleta: format(parseISO(item.readingDate), 'dd/MM HH:mm', { locale: es }),
                consumo: item.consumption || 0,
                lectura: item.amount
            }))

            // Si hay muchos datos, agrupar por hora
            if (hourlyData.length > 48) {
                const groupedByHour = hourlyData.reduce((acc, item) => {
                    const hour = item.fecha.split(':')[0] + ':00'
                    if (!acc[hour]) {
                        acc[hour] = {
                            fecha: hour,
                            consumoTotal: 0,
                            lecturas: 0,
                            consumoPromedio: 0
                        }
                    }
                    acc[hour].consumoTotal += item.consumo
                    acc[hour].lecturas += 1
                    return acc
                }, {} as Record<string, HourlyGroupData>)

                return Object.values(groupedByHour).map((hour) => ({
                    fecha: hour.fecha,
                    consumo: Math.round(hour.consumoTotal / hour.lecturas)
                }))
            }

            return hourlyData
        }
    }, [filteredData, viewMode])

    if (chartData.length === 0) {
        return (
            <div className="h-80 flex items-center justify-center">
                <div className="text-center">
                    <Droplets className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No hay datos de consumo en el período seleccionado</p>
                    <p className="text-sm text-gray-400">Intenta seleccionar un rango de fechas diferente</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Controles */}
            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1 flex flex-col sm:flex-row gap-2">
                    {/* Selector de rango de tiempo */}
                    <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <Calendar className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Período" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7days">Últimos 7 días</SelectItem>
                            <SelectItem value="15days">Últimos 15 días</SelectItem>
                            <SelectItem value="30days">Últimos 30 días</SelectItem>
                            <SelectItem value="custom">Personalizado</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Selector de fecha personalizada */}
                    {timeRange === 'custom' && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full sm:w-[240px] justify-start text-left font-normal",
                                        !selectedDate && "text-muted-foreground"
                                    )}
                                >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {selectedDate ? (
                                        format(selectedDate, "PPP", { locale: es })
                                    ) : (
                                        <span>Seleccionar fecha</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    locale={es}
                                    disabled={(date) =>
                                        date > new Date() || date < new Date("2024-01-01")
                                    }
                                />
                            </PopoverContent>
                        </Popover>
                    )}
                </div>

                {/* Tabs para cambiar vista */}
                <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                    <TabsList className="grid w-full sm:w-[200px] grid-cols-2">
                        <TabsTrigger value="daily">Por día</TabsTrigger>
                        <TabsTrigger value="hourly">Por hora</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Gráfico */}
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    {viewMode === 'daily' ? (
                        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload
                                        return (
                                            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                                                <p className="font-semibold text-sm">{data.fecha}</p>
                                                <p className="text-sm mt-1">
                                                    <span className="text-cyan-600">Consumo total:</span> {data.consumoTotal.toLocaleString()} L
                                                </p>
                                                <p className="text-sm">
                                                    <span className="text-blue-600">Promedio:</span> {data.consumoPromedio.toLocaleString()} L
                                                </p>
                                                <p className="text-sm">
                                                    <span className="text-purple-600">Máximo:</span> {data.consumoMaximo.toLocaleString()} L
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Hora pico: {data.horaMaximo}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Total lecturas: {data.lecturas}
                                                </p>
                                            </div>
                                        )
                                    }
                                    return null
                                }}
                            />
                            <Legend />
                            <Bar dataKey="consumoTotal" fill="#06b6d4" name="Consumo total (L)" />
                            <Bar dataKey="consumoPromedio" fill="#3b82f6" name="Promedio (L)" />
                        </BarChart>
                    ) : (
                        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload
                                        return (
                                            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                                                <p className="font-semibold text-sm">
                                                    {data.fechaCompleta || data.fecha}
                                                </p>
                                                <p className="text-sm mt-1">
                                                    <span className="text-cyan-600">Consumo:</span> {data.consumo.toLocaleString()} L
                                                </p>
                                                {data.lectura && (
                                                    <p className="text-sm">
                                                        <span className="text-purple-600">Lectura:</span> {data.lectura.toLocaleString()} L
                                                    </p>
                                                )}
                                            </div>
                                        )
                                    }
                                    return null
                                }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="consumo"
                                stroke="#06b6d4"
                                name="Consumo (L)"
                                strokeWidth={2}
                                dot={{ fill: '#06b6d4', r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    )}
                </ResponsiveContainer>
            </div>

            {/* Resumen de estadísticas */}
            {viewMode === 'daily' && chartData.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                        <p className="text-sm text-gray-600">Consumo total</p>
                        <p className="text-xl font-bold text-cyan-600">
                            {(chartData as DailyChartData[]).reduce((sum, item) => sum + item.consumoTotal, 0).toLocaleString()} L
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-gray-600">Promedio diario</p>
                        <p className="text-xl font-bold text-blue-600">
                            {Math.round(
                                (chartData as DailyChartData[]).reduce((sum, item) => sum + item.consumoTotal, 0) / chartData.length
                            ).toLocaleString()} L
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-gray-600">Día máximo</p>
                        <p className="text-xl font-bold text-purple-600">
                            {Math.max(...(chartData as DailyChartData[]).map(item => item.consumoTotal)).toLocaleString()} L
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-gray-600">Total lecturas</p>
                        <p className="text-xl font-bold text-gray-600">
                            {(chartData as DailyChartData[]).reduce((sum, item) => sum + item.lecturas, 0)}
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}