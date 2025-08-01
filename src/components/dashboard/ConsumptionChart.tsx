// src/components/dashboard/ConsumptionChart.tsx
'use client'

import { useState, useMemo } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, Droplets, BarChart3, CalendarDays, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { DateRange } from 'react-day-picker'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

type ViewMode = 'daily' | 'hourly' | 'monthly'
type TimeRange = '7days' | '15days' | '30days' | 'custom'

interface DailyChartData {
    fecha: string
    consumoTotal: number
    lecturas: number
    lecturasConConsumo: number
    lecturasSinConsumo: number
    consumoPromedio: number
    consumoMaximo: number
    horaMaximo: string
}

interface HourlyChartData {
    fecha: string
    fechaCompleta?: string
    consumo: number
    lectura?: number
    timestamp?: string
}

interface MonthlyChartData {
    mes: string
    mesCompleto: string
    consumoTotal: number
    lecturas: number
    consumoPromedio: number
    consumoMaximo: number
    diasConLecturas: number
}

interface MonthlyGroupData {
    mes: string
    mesCompleto: string
    consumoTotal: number
    lecturas: number
    consumoPromedio: number
    consumoMaximo: number
    diasConLecturas: Set<string>
}

export default function ConsumptionChart({ data }: ConsumptionChartProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('daily')
    const [timeRange, setTimeRange] = useState<TimeRange>('30days')
    const [dateRange, setDateRange] = useState<DateRange | undefined>()

    // Filtrar datos según el rango seleccionado - INCLUIR TODAS LAS LECTURAS
    const filteredData = useMemo(() => {
        // No filtrar por consumo > 0, incluir todas las lecturas válidas
        const filtered = data.filter(item => item.consumption !== null && item.consumption !== undefined)

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
                if (dateRange?.from && dateRange?.to) {
                    startDate = startOfDay(dateRange.from)
                    endDate = endOfDay(dateRange.to)
                } else if (dateRange?.from) {
                    startDate = startOfDay(dateRange.from)
                    endDate = endOfDay(dateRange.from)
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
    }, [data, timeRange, dateRange])

    // Preparar datos para el gráfico
    const chartData = useMemo(() => {
        if (viewMode === 'monthly') {
            // Agrupar por mes
            const groupedByMonth = filteredData.reduce((acc, item) => {
                const month = format(parseISO(item.readingDate), 'yyyy-MM')
                const monthLabel = format(parseISO(item.readingDate), 'MMM yy', { locale: es })

                if (!acc[month]) {
                    acc[month] = {
                        mes: monthLabel,
                        mesCompleto: format(parseISO(item.readingDate), 'MMMM yyyy', { locale: es }),
                        consumoTotal: 0,
                        lecturas: 0,
                        consumoPromedio: 0,
                        consumoMaximo: 0,
                        diasConLecturas: new Set<string>()
                    }
                }

                const consumo = item.consumption || 0
                acc[month].consumoTotal += consumo
                acc[month].lecturas += 1
                acc[month].diasConLecturas.add(format(parseISO(item.readingDate), 'yyyy-MM-dd'))

                if (consumo > acc[month].consumoMaximo) {
                    acc[month].consumoMaximo = consumo
                }

                return acc
            }, {} as Record<string, MonthlyGroupData>)

            return Object.entries(groupedByMonth)
                .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
                .map(([_, month]): MonthlyChartData => ({
                    mes: month.mes,
                    mesCompleto: month.mesCompleto,
                    consumoTotal: month.consumoTotal,
                    lecturas: month.lecturas,
                    consumoPromedio: month.lecturas > 0 ? Math.round(month.consumoTotal / month.lecturas) : 0,
                    consumoMaximo: month.consumoMaximo,
                    diasConLecturas: month.diasConLecturas.size
                }))
        } else if (viewMode === 'daily') {
            // Agrupar por día
            const groupedByDay = filteredData.reduce((acc, item) => {
                const day = format(parseISO(item.readingDate), 'yyyy-MM-dd')
                if (!acc[day]) {
                    acc[day] = {
                        fecha: format(parseISO(item.readingDate), 'dd/MM', { locale: es }),
                        consumoTotal: 0,
                        lecturas: 0,
                        lecturasConConsumo: 0,
                        lecturasSinConsumo: 0,
                        consumoPromedio: 0,
                        consumoMaximo: 0,
                        horaMaximo: ''
                    }
                }

                const consumo = item.consumption || 0
                acc[day].consumoTotal += consumo
                acc[day].lecturas += 1

                // Contar lecturas con y sin consumo
                if (consumo > 0) {
                    acc[day].lecturasConConsumo += 1
                } else {
                    acc[day].lecturasSinConsumo += 1
                }

                if (consumo > acc[day].consumoMaximo) {
                    acc[day].consumoMaximo = consumo
                    acc[day].horaMaximo = format(parseISO(item.readingDate), 'HH:mm')
                }
                return acc
            }, {} as Record<string, DailyChartData>)

            return Object.values(groupedByDay).map((day) => ({
                ...day,
                consumoPromedio: day.lecturas > 0 ? Math.round(day.consumoTotal / day.lecturas) : 0
            }))
        } else {
            // Vista por hora - MOSTRAR CADA LECTURA INDIVIDUAL
            // Ordenar por fecha/hora para que el gráfico sea coherente
            const hourlyData = filteredData
                .sort((a, b) => new Date(a.readingDate).getTime() - new Date(b.readingDate).getTime())
                .map(item => ({
                    fecha: format(parseISO(item.readingDate), 'HH:mm', { locale: es }),
                    fechaCompleta: format(parseISO(item.readingDate), 'dd/MM HH:mm', { locale: es }),
                    consumo: item.consumption || 0,
                    lectura: item.amount,
                    timestamp: item.readingDate
                }))

            return hourlyData
        }
    }, [filteredData, viewMode])

    // Calcular título descriptivo basado en los datos reales filtrados
    const getChartTitle = () => {
        if (filteredData.length === 0) {
            return 'Sin datos para mostrar'
        }

        switch (timeRange) {
            case '7days':
                return 'Últimos 7 días'
            case '15days':
                return 'Últimos 15 días'
            case '30days':
                return 'Últimos 30 días'
            case 'custom':
                if (dateRange?.from && dateRange?.to) {
                    return `${format(dateRange.from, 'dd MMM', { locale: es })} - ${format(dateRange.to, 'dd MMM yyyy', { locale: es })}`
                } else if (dateRange?.from) {
                    return format(dateRange.from, 'dd MMMM yyyy', { locale: es })
                }
                return 'Rango personalizado'
            default:
                return 'Consumo de agua'
        }
    }

    return (
        <div className="space-y-4">
            {/* Título con información contextual */}
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-gray-700">
                    Consumo: {getChartTitle()}
                </h3>
                <span className="text-sm text-gray-500">
                    {filteredData.length} lecturas
                </span>
            </div>
            {/* Controles - SIEMPRE VISIBLES */}
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
                            <SelectItem value="custom">Rango personalizado</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Selector de fecha personalizada */}
                    {timeRange === 'custom' && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full sm:w-[280px] justify-start text-left font-normal",
                                        !dateRange?.from && "text-muted-foreground"
                                    )}
                                >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                            <>
                                                {format(dateRange.from, "dd MMM", { locale: es })} -{" "}
                                                {format(dateRange.to, "dd MMM yyyy", { locale: es })}
                                            </>
                                        ) : (
                                            format(dateRange.from, "PPP", { locale: es })
                                        )
                                    ) : (
                                        <span>Seleccionar rango</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                    mode="range"
                                    selected={dateRange}
                                    onSelect={setDateRange}
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
                    <TabsList className="grid w-full sm:w-[400px] grid-cols-3">
                        <TabsTrigger value="monthly" className="flex items-center gap-1">
                            <BarChart3 className="h-4 w-4" />
                            Por mes
                        </TabsTrigger>
                        <TabsTrigger value="daily" className="flex items-center gap-1">
                            <CalendarDays className="h-4 w-4" />
                            Por día
                        </TabsTrigger>
                        <TabsTrigger value="hourly" className="flex items-center gap-1">
                            <Activity className="h-4 w-4" />
                            Por lectura
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Verificar si hay datos */}
            {chartData.length === 0 ? (
                <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                        <Droplets className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-2">No hay datos de consumo en el período seleccionado</p>
                        <p className="text-sm text-gray-400">Intenta seleccionar un rango de fechas diferente</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Gráfico */}
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            {viewMode === 'monthly' ? (
                                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="mes"
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
                                                        <p className="font-semibold text-sm">{data.mesCompleto}</p>
                                                        <p className="text-sm mt-1">
                                                            <span className="text-cyan-600">Consumo total:</span> {data.consumoTotal.toLocaleString()} L
                                                        </p>
                                                        <p className="text-sm">
                                                            <span className="text-blue-600">Promedio por lectura:</span> {data.consumoPromedio.toLocaleString()} L
                                                        </p>
                                                        <p className="text-sm">
                                                            <span className="text-purple-600">Máximo:</span> {data.consumoMaximo.toLocaleString()} L
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Total lecturas: {data.lecturas}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            Días con lecturas: {data.diasConLecturas}
                                                        </p>
                                                    </div>
                                                )
                                            }
                                            return null
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="consumoTotal" fill="#06b6d4" name="Consumo mensual (L)" />
                                </BarChart>
                            ) : viewMode === 'daily' ? (
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
                                                            Hora pico: {data.horaMaximo || 'N/A'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            Total lecturas: {data.lecturas}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            Con consumo: {data.lecturasConConsumo} | Sin consumo: {data.lecturasSinConsumo}
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
                                        tick={{ fontSize: 11 }}
                                        interval={Math.floor(chartData.length / 10)} // Mostrar solo algunas etiquetas para evitar superposición
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
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
                                                        {data.lectura !== undefined && (
                                                            <p className="text-sm">
                                                                <span className="text-purple-600">Lectura acumulada:</span> {data.lectura.toLocaleString()} L
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            Lectura individual
                                                        </p>
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
                                        name="Consumo por lectura (L)"
                                        strokeWidth={2}
                                        dot={{ fill: '#06b6d4', r: 3 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            )}
                        </ResponsiveContainer>
                    </div>

                    {/* Resumen de estadísticas */}
                    {viewMode === 'monthly' && chartData.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Consumo total período</p>
                                <p className="text-xl font-bold text-cyan-600">
                                    {(chartData as MonthlyChartData[]).reduce((sum, item) => sum + item.consumoTotal, 0).toLocaleString()} L
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Promedio mensual</p>
                                <p className="text-xl font-bold text-blue-600">
                                    {Math.round(
                                        (chartData as MonthlyChartData[]).reduce((sum, item) => sum + item.consumoTotal, 0) / chartData.length
                                    ).toLocaleString()} L
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Mes máximo</p>
                                <p className="text-xl font-bold text-purple-600">
                                    {Math.max(...(chartData as MonthlyChartData[]).map(item => item.consumoTotal)).toLocaleString()} L
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Meses analizados</p>
                                <p className="text-xl font-bold text-gray-600">
                                    {chartData.length}
                                </p>
                            </div>
                        </div>
                    )}

                    {viewMode === 'daily' && chartData.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
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
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Días sin consumo</p>
                                <p className="text-xl font-bold text-orange-600">
                                    {(chartData as DailyChartData[]).filter(item => item.consumoTotal === 0).length}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Resumen para vista de lecturas individuales */}
                    {viewMode === 'hourly' && chartData.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Total lecturas</p>
                                <p className="text-xl font-bold text-gray-600">
                                    {chartData.length}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Consumo promedio</p>
                                <p className="text-xl font-bold text-blue-600">
                                    {Math.round(
                                        (chartData as HourlyChartData[]).reduce((sum, item) => sum + item.consumo, 0) / chartData.length
                                    ).toLocaleString()} L
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Consumo máximo</p>
                                <p className="text-xl font-bold text-purple-600">
                                    {Math.max(...(chartData as HourlyChartData[]).map(item => item.consumo)).toLocaleString()} L
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Lecturas con 0L</p>
                                <p className="text-xl font-bold text-orange-600">
                                    {(chartData as HourlyChartData[]).filter(item => item.consumo === 0).length}
                                </p>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}