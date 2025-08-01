// src/components/reports/report-filters.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Search } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"

interface ReportFiltersProps {
    filters: Record<string, string>
    onChange: (filters: Record<string, string>) => void
    onApply: () => void
}

export function ReportFilters({ filters, onChange, onApply }: ReportFiltersProps) {
    const [dateRange, setDateRange] = useState<DateRange | undefined>()

    const handleDateRangeSelect = (range: DateRange | undefined) => {
        setDateRange(range)
        if (range?.from) {
            onChange({
                ...filters,
                startDate: format(range.from, 'yyyy-MM-dd'),
                endDate: range.to ? format(range.to, 'yyyy-MM-dd') : format(range.from, 'yyyy-MM-dd')
            })
        }
    }

    const handleQuickDateSelect = (days: number) => {
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - days)

        setDateRange({ from: start, to: end })
        onChange({
            ...filters,
            startDate: format(start, 'yyyy-MM-dd'),
            endDate: format(end, 'yyyy-MM-dd')
        })
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Selector de rango de fechas */}
                <div className="space-y-2">
                    <Label>Rango de fechas</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !dateRange && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, "dd MMM", { locale: es })} -{" "}
                                            {format(dateRange.to, "dd MMM yyyy", { locale: es })}
                                        </>
                                    ) : (
                                        format(dateRange.from, "dd MMM yyyy", { locale: es })
                                    )
                                ) : (
                                    <span>Seleccionar fechas</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={handleDateRangeSelect}
                                numberOfMonths={2}
                                locale={es}
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Botones de fecha rápida */}
                <div className="space-y-2">
                    <Label>Selección rápida</Label>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickDateSelect(0)}
                        >
                            Hoy
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickDateSelect(7)}
                        >
                            7 días
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickDateSelect(30)}
                        >
                            30 días
                        </Button>
                    </div>
                </div>

                {/* Agrupar por */}
                <div className="space-y-2">
                    <Label>Agrupar por</Label>
                    <Select
                        value={filters.groupBy || 'day'}
                        onValueChange={(value) => onChange({ ...filters, groupBy: value })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="day">Día</SelectItem>
                            <SelectItem value="week">Semana</SelectItem>
                            <SelectItem value="month">Mes</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Botón aplicar */}
                <div className="flex items-end">
                    <Button
                        onClick={onApply}
                        className="w-full"
                        disabled={!filters.startDate || !filters.endDate}
                    >
                        <Search className="mr-2 h-4 w-4" />
                        Generar reporte
                    </Button>
                </div>
            </div>
        </div>
    )
}