// src/components/maintenance/maintenance-form.tsx
"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, X, Upload } from "lucide-react"

const maintenanceSchema = z.object({
    sensorId: z.number(),
    type: z.enum(['PREVENTIVE', 'CORRECTIVE', 'CALIBRATION', 'INSTALLATION', 'UNINSTALLATION']),
    status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
    scheduledDate: z.string(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    technician: z.string().optional(),
    description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
    findings: z.string().optional(),
    actionsTaken: z.string().optional(),
    cost: z.number().optional(),
    nextMaintenance: z.string().optional(),
})

type MaintenanceFormData = z.infer<typeof maintenanceSchema>

interface Sensor {
    id: number
    name: string
    numero_medidor: string
    direccion: string
    user: {
        name: string
        dni: string
    }
}

interface Maintenance {
    id: string
    sensorId: number
    type: 'PREVENTIVE' | 'CORRECTIVE' | 'CALIBRATION' | 'INSTALLATION' | 'UNINSTALLATION'
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
    scheduledDate: string
    startDate?: string
    endDate?: string
    technician?: string
    description: string
    findings?: string
    actionsTaken?: string
    partsReplaced: string[]
    cost?: number
    nextMaintenance?: string
}

interface MaintenanceFormProps {
    maintenance?: Maintenance
    onSuccess?: () => void
    trigger?: React.ReactNode
}

const maintenanceTypes = [
    { value: 'PREVENTIVE', label: 'Preventivo' },
    { value: 'CORRECTIVE', label: 'Correctivo' },
    { value: 'CALIBRATION', label: 'Calibración' },
    { value: 'INSTALLATION', label: 'Instalación' },
    { value: 'UNINSTALLATION', label: 'Desinstalación' }
]

const maintenanceStatuses = [
    { value: 'SCHEDULED', label: 'Programado' },
    { value: 'IN_PROGRESS', label: 'En Progreso' },
    { value: 'COMPLETED', label: 'Completado' },
    { value: 'CANCELLED', label: 'Cancelado' }
]

export function MaintenanceForm({ maintenance, onSuccess, trigger }: MaintenanceFormProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [sensors, setSensors] = useState<Sensor[]>([])
    const [partsReplaced, setPartsReplaced] = useState<string[]>(maintenance?.partsReplaced || [])
    const [newPart, setNewPart] = useState("")

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors }
    } = useForm<MaintenanceFormData>({
        resolver: zodResolver(maintenanceSchema),
        defaultValues: maintenance ? {
            sensorId: maintenance.sensorId,
            type: maintenance.type,
            status: maintenance.status,
            scheduledDate: maintenance.scheduledDate ? new Date(maintenance.scheduledDate).toISOString().split('T')[0] : '',
            startDate: maintenance.startDate ? new Date(maintenance.startDate).toISOString().split('T')[0] : '',
            endDate: maintenance.endDate ? new Date(maintenance.endDate).toISOString().split('T')[0] : '',
            technician: maintenance.technician || '',
            description: maintenance.description,
            findings: maintenance.findings || '',
            actionsTaken: maintenance.actionsTaken || '',
            cost: maintenance.cost || undefined,
            nextMaintenance: maintenance.nextMaintenance ? new Date(maintenance.nextMaintenance).toISOString().split('T')[0] : '',
        } : {}
    })

    useEffect(() => {
        fetchSensors()
    }, [])

    const fetchSensors = async () => {
        try {
            const response = await fetch('/api/sensors?simple=true')
            if (response.ok) {
                const data = await response.json()
                setSensors(data)
            }
        } catch (error) {
            console.error('Error fetching sensors:', error)
        }
    }

    const addPart = () => {
        if (newPart.trim() && !partsReplaced.includes(newPart.trim())) {
            setPartsReplaced([...partsReplaced, newPart.trim()])
            setNewPart("")
        }
    }

    const removePart = (index: number) => {
        setPartsReplaced(partsReplaced.filter((_, i) => i !== index))
    }

    const onSubmit = async (data: MaintenanceFormData) => {
        setLoading(true)

        try {
            const payload = {
                ...data,
                partsReplaced,
                scheduledDate: new Date(data.scheduledDate).toISOString(),
                startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
                endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
                nextMaintenance: data.nextMaintenance ? new Date(data.nextMaintenance).toISOString() : null,
            }

            const url = maintenance ? `/api/maintenance/${maintenance.id}` : '/api/maintenance'
            const method = maintenance ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (response.ok) {
                toast.success(maintenance ? 'Mantenimiento actualizado' : 'Mantenimiento creado')
                setOpen(false)
                reset()
                setPartsReplaced([])
                onSuccess?.()
            } else {
                const error = await response.json()
                toast.error(error.error || 'Error al guardar')
            }
        } catch (error) {
            toast.error('Error de conexión')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Mantenimiento
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {maintenance ? 'Editar Mantenimiento' : 'Nuevo Mantenimiento'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="sensorId">Sensor *</Label>
                        <Select
                            onValueChange={(value) => setValue('sensorId', parseInt(value))}
                            defaultValue={maintenance?.sensorId?.toString()}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar sensor" />
                            </SelectTrigger>
                            <SelectContent>
                                {sensors.map((sensor) => (
                                    <SelectItem key={sensor.id} value={sensor.id.toString()}>
                                        {sensor.name} - {sensor.numero_medidor} ({sensor.user.name})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.sensorId && (
                            <p className="text-sm text-red-500">Selecciona un sensor</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Tipo *</Label>
                            <Select
                                onValueChange={(value) => setValue('type', value as 'PREVENTIVE' | 'CORRECTIVE' | 'CALIBRATION' | 'INSTALLATION' | 'UNINSTALLATION')}
                                defaultValue={maintenance?.type}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {maintenanceTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.type && (
                                <p className="text-sm text-red-500">Selecciona un tipo</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Estado *</Label>
                            <Select
                                onValueChange={(value) => setValue('status', value as 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED')}
                                defaultValue={maintenance?.status || 'SCHEDULED'}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    {maintenanceStatuses.map((status) => (
                                        <SelectItem key={status.value} value={status.value}>
                                            {status.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="scheduledDate">Fecha Programada *</Label>
                            <Input
                                type="date"
                                {...register('scheduledDate')}
                                className={errors.scheduledDate ? 'border-red-500' : ''}
                            />
                            {errors.scheduledDate && (
                                <p className="text-sm text-red-500">{errors.scheduledDate.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="startDate">Fecha Inicio</Label>
                            <Input type="date" {...register('startDate')} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="endDate">Fecha Fin</Label>
                            <Input type="date" {...register('endDate')} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="technician">Técnico</Label>
                            <Input {...register('technician')} placeholder="Nombre del técnico" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="cost">Costo</Label>
                            <Input
                                type="number"
                                step="0.01"
                                {...register('cost', { valueAsNumber: true })}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="nextMaintenance">Próximo Mantenimiento</Label>
                            <Input type="date" {...register('nextMaintenance')} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción *</Label>
                        <Textarea
                            {...register('description')}
                            placeholder="Descripción del mantenimiento..."
                            className={errors.description ? 'border-red-500' : ''}
                        />
                        {errors.description && (
                            <p className="text-sm text-red-500">{errors.description.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="findings">Hallazgos</Label>
                        <Textarea
                            {...register('findings')}
                            placeholder="Hallazgos durante el mantenimiento..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="actionsTaken">Acciones Realizadas</Label>
                        <Textarea
                            {...register('actionsTaken')}
                            placeholder="Acciones realizadas durante el mantenimiento..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Partes Reemplazadas</Label>
                        <div className="flex gap-2">
                            <Input
                                value={newPart}
                                onChange={(e) => setNewPart(e.target.value)}
                                placeholder="Agregar parte..."
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPart())}
                            />
                            <Button type="button" onClick={addPart} size="sm">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        {partsReplaced.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {partsReplaced.map((part, index) => (
                                    <div key={index} className="bg-gray-100 px-2 py-1 rounded-md flex items-center gap-1">
                                        <span className="text-sm">{part}</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removePart(index)}
                                            className="h-auto p-0 text-red-500"
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : maintenance ? 'Actualizar' : 'Crear'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}