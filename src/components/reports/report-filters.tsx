
// ============================================================================
// src/components/reports/report-filters.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface ReportFiltersProps {
    filters: Record<string, string>
    onChange: (filters: Record<string, string>) => void
    onApply: () => void
}

export function ReportFilters({ filters, onChange, onApply }: ReportFiltersProps) {
    const updateFilter = (key: string, value: string) => {
        onChange({ ...filters, [key]: value })
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
                <Label htmlFor="startDate">Fecha Inicio</Label>
                <Input
                    id="startDate"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => updateFilter('startDate', e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="endDate">Fecha Fin</Label>
                <Input
                    id="endDate"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => updateFilter('endDate', e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="groupBy">Agrupar por</Label>
                <Select value={filters.groupBy} onValueChange={(value) => updateFilter('groupBy', value)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccionar agrupación" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="day">Día</SelectItem>
                        <SelectItem value="week">Semana</SelectItem>
                        <SelectItem value="month">Mes</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="sensorId">Sensor (Opcional)</Label>
                <Input
                    id="sensorId"
                    placeholder="ID del sensor"
                    value={filters.sensorId}
                    onChange={(e) => updateFilter('sensorId', e.target.value)}
                />
            </div>

            <div className="flex items-end">
                <Button onClick={onApply} className="w-full">
                    Generar Reporte
                </Button>
            </div>
        </div>
    )
}
