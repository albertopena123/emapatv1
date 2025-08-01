// src/components/dashboard/ConsumptionSummary.tsx
'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Droplets, Clock, Calendar, TrendingUp, TrendingDown } from "lucide-react"
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, getDaysInMonth } from "date-fns"
import { es } from "date-fns/locale"

interface ConsumptionData {
    id: number
    amount: number
    consumption: number | null
    readingDate: string
    timestamp: string
}

interface ConsumptionSummaryProps {
    consumptionHistory: ConsumptionData[]
}

export default function ConsumptionSummary({
    consumptionHistory
}: ConsumptionSummaryProps) {
    // Obtener lista de meses disponibles primero
    const availableMonthsList = useMemo(() => {
        const months = new Set<string>()

        // Solo agregar meses que tienen lecturas reales
        consumptionHistory.forEach(item => {
            if (item.consumption !== null && item.consumption !== undefined) {
                const month = format(parseISO(item.readingDate), 'yyyy-MM')
                months.add(month)
            }
        })

        // Convertir a array y ordenar descendente
        return Array.from(months).sort((a, b) => b.localeCompare(a))
    }, [consumptionHistory])

    // Usar el primer mes disponible como predeterminado
    const [selectedMonth, setSelectedMonth] = useState(
        availableMonthsList.length > 0 ? availableMonthsList[0] : format(new Date(), 'yyyy-MM')
    )

    // Asegurar que el mes seleccionado sea válido
    useEffect(() => {
        if (availableMonthsList.length > 0 && !availableMonthsList.includes(selectedMonth)) {
            setSelectedMonth(availableMonthsList[0])
        }
    }, [availableMonthsList, selectedMonth])



    // Obtener lista de meses disponibles - SOLO meses con datos reales
    const availableMonths = useMemo(() => {
        const months = new Set<string>()

        // Solo agregar meses que tienen lecturas reales
        consumptionHistory.forEach(item => {
            if (item.consumption !== null && item.consumption !== undefined) {
                const month = format(parseISO(item.readingDate), 'yyyy-MM')
                months.add(month)
            }
        })

        // Convertir a array y ordenar descendente
        return Array.from(months).sort((a, b) => b.localeCompare(a))
    }, [consumptionHistory])

    // Calcular datos del mes seleccionado
    const monthData = useMemo(() => {
        if (!selectedMonth) {
            return {
                totalConsumption: 0,
                lastReading: null,
                readingsCount: 0
            }
        }

        const [year, month] = selectedMonth.split('-').map(Number)
        const monthStart = startOfMonth(new Date(year, month - 1))
        const monthEnd = endOfMonth(new Date(year, month - 1))

        // Filtrar lecturas del mes seleccionado con validación estricta
        const monthReadings = consumptionHistory.filter(item => {
            try {
                const itemDate = parseISO(item.readingDate)
                const itemYearMonth = format(itemDate, 'yyyy-MM')

                // Comparar directamente el año-mes
                const matches = itemYearMonth === selectedMonth

                if (matches) {
                    console.log(`✓ Lectura ${item.readingDate} SÍ pertenece a ${selectedMonth}`)
                }

                return matches
            } catch (error) {
                console.error('Error parseando fecha:', item.readingDate, error)
                return false
            }
        })

        // Debug: Ver qué lecturas se están filtrando
        console.log('=== DEBUG Filtrado ===')
        console.log('Mes seleccionado:', selectedMonth)
        console.log('Rango:', format(monthStart, 'dd/MM/yyyy HH:mm:ss'), '-', format(monthEnd, 'dd/MM/yyyy HH:mm:ss'))

        monthReadings.forEach(reading => {
            console.log('Lectura incluida:',
                format(parseISO(reading.readingDate), 'dd/MM/yyyy HH:mm'),
                'Consumo:', reading.consumption)
        })

        console.log('Total lecturas encontradas:', monthReadings.length)

        // Calcular el consumo total del mes
        const totalConsumption = monthReadings.reduce((sum, item) => sum + (item.consumption || 0), 0)

        // Obtener la última lectura del mes
        const lastReadingInMonth = monthReadings
            .sort((a, b) => new Date(b.readingDate).getTime() - new Date(a.readingDate).getTime())[0]

        return {
            totalConsumption,
            lastReading: lastReadingInMonth ? {
                amount: lastReadingInMonth.amount,
                readingDate: lastReadingInMonth.readingDate,
                consumption: lastReadingInMonth.consumption
            } : null,
            readingsCount: monthReadings.length
        }
    }, [selectedMonth, consumptionHistory])

    // Calcular comparación con el mes anterior
    const comparison = useMemo(() => {
        const currentIndex = availableMonths.indexOf(selectedMonth)
        if (currentIndex === -1 || currentIndex === availableMonths.length - 1) return null

        const previousMonth = availableMonths[currentIndex + 1]
        const [prevYear, prevMonth] = previousMonth.split('-').map(Number)
        const prevMonthStart = startOfMonth(new Date(prevYear, prevMonth - 1))
        const prevMonthEnd = endOfMonth(new Date(prevYear, prevMonth - 1))

        const prevMonthReadings = consumptionHistory.filter(item => {
            const itemDate = parseISO(item.readingDate)
            return isWithinInterval(itemDate, { start: prevMonthStart, end: prevMonthEnd })
        })

        const prevTotalConsumption = prevMonthReadings.reduce((sum, item) => sum + (item.consumption || 0), 0)

        if (prevTotalConsumption === 0) return null

        const percentageChange = ((monthData.totalConsumption - prevTotalConsumption) / prevTotalConsumption) * 100
        return {
            value: percentageChange,
            absolute: monthData.totalConsumption - prevTotalConsumption
        }
    }, [selectedMonth, availableMonths, consumptionHistory, monthData.totalConsumption])

    // Si no hay meses con datos o no se ha seleccionado un mes, mostrar mensaje
    if (availableMonthsList.length === 0 || !selectedMonth) {
        return (
            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Droplets className="h-5 w-5 text-cyan-600" />
                        Resumen de Consumo
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <Droplets className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No hay datos de consumo disponibles</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-0 shadow-lg">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Droplets className="h-5 w-5 text-cyan-600" />
                        Resumen de Consumo
                    </CardTitle>
                    <Select
                        value={selectedMonth}
                        onValueChange={(value) => {
                            console.log('Cambiando mes a:', value)
                            setSelectedMonth(value)
                        }}
                    >
                        <SelectTrigger className="w-[180px]">
                            <Calendar className="mr-2 h-4 w-4" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {availableMonthsList.map(month => (
                                <SelectItem key={month} value={month}>
                                    {format(new Date(month + '-01'), 'MMMM yyyy', { locale: es })}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                {monthData.readingsCount === 0 ? (
                    // Si no hay datos para el mes seleccionado
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">
                            No hay lecturas en {format(new Date(selectedMonth + '-01'), 'MMMM yyyy', { locale: es })}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            Selecciona otro mes para ver el consumo
                        </p>
                    </div>
                ) : (
                    // Mostrar datos normalmente
                    <div className="space-y-4">
                        {/* Consumo del mes */}
                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                                <p className="font-medium">
                                    Consumo de {format(new Date(selectedMonth + '-01'), 'MMMM yyyy', { locale: es })}
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {monthData.totalConsumption.toLocaleString()} L
                                </p>
                                <p className="text-sm text-gray-500">
                                    ({(monthData.totalConsumption / 1000).toFixed(2)} m³)
                                </p>
                                {comparison && monthData.readingsCount > 0 && (
                                    <div className={`flex items-center gap-1 mt-2 text-sm ${comparison.value > 0 ? 'text-red-600' : 'text-green-600'
                                        }`}>
                                        {comparison.value > 0 ? (
                                            <TrendingUp className="h-4 w-4" />
                                        ) : (
                                            <TrendingDown className="h-4 w-4" />
                                        )}
                                        <span>
                                            {Math.abs(comparison.value).toFixed(1)}% vs mes anterior
                                        </span>
                                        <span className="text-gray-500">
                                            ({comparison.absolute > 0 ? '+' : ''}{comparison.absolute.toLocaleString()} L)
                                        </span>
                                    </div>
                                )}
                            </div>
                            <Droplets className="h-8 w-8 text-cyan-500" />
                        </div>

                        {/* Última lectura del mes */}
                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                                <p className="font-medium">Última Lectura del Mes</p>
                                {monthData.lastReading ? (
                                    <>
                                        <p className="text-sm text-gray-600">
                                            {format(parseISO(monthData.lastReading.readingDate), "dd/MM/yyyy HH:mm", { locale: es })}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Lectura: {monthData.lastReading.amount.toLocaleString()} L
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Consumo en esa lectura: {(monthData.lastReading.consumption || 0).toLocaleString()} L
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-sm text-gray-600">
                                        No hay lecturas registradas en {format(new Date(selectedMonth + '-01'), 'MMMM yyyy', { locale: es })}
                                    </p>
                                )}
                            </div>
                            <Clock className="h-8 w-8 text-gray-400" />
                        </div>

                        {/* Estadísticas adicionales del mes */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-blue-50 rounded-lg text-center">
                                <p className="text-sm text-blue-600 font-medium">Lecturas del mes</p>
                                <p className="text-xl font-bold text-blue-800">{monthData.readingsCount}</p>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg text-center">
                                <p className="text-sm text-purple-600 font-medium">Promedio diario</p>
                                <p className="text-xl font-bold text-purple-800">
                                    {monthData.readingsCount > 0
                                        ? Math.round(
                                            monthData.totalConsumption /
                                            getDaysInMonth(new Date(selectedMonth + '-01'))
                                        ).toLocaleString()
                                        : 0
                                    } L
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}