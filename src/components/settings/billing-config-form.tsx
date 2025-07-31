// src/components/settings/billing-config-form.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Save, RefreshCw, Calendar, Clock, AlertCircle, History } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface BillingConfig {
    id?: string
    name: string
    description?: string
    isActive: boolean
    billingDay: number
    billingHour: number
    billingMinute: number
    timezone: string
    billingCycle: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
    periodDuration: number
    includeWeekends: boolean
    retryOnFailure: boolean
    maxRetries: number
    tariffCategories: number[]
    sensorStatuses: string[]
    notifyOnSuccess: boolean
    notifyOnError: boolean
    notifyEmails: string[]
    lastRun?: string
    lastRunStatus?: string
    nextRun?: string
    totalInvoices: number
}

export function BillingConfigForm() {
    const [loading, setLoading] = useState(false)
    const [configs, setConfigs] = useState<BillingConfig[]>([])
    const [selectedConfig, setSelectedConfig] = useState<BillingConfig | null>(null)
    const [emailInput, setEmailInput] = useState("")

    useEffect(() => {
        fetchConfigs()
    }, [])

    const fetchConfigs = async () => {
        try {
            const response = await fetch('/api/settings/billing')
            if (response.ok) {
                const data = await response.json()
                setConfigs(data)
                if (data.length > 0 && !selectedConfig) {
                    setSelectedConfig(data[0])
                }
            }
        } catch (error) {
            toast.error("Error al cargar configuraciones")
        }
    }

    const handleSave = async () => {
        if (!selectedConfig) return

        setLoading(true)
        try {
            const url = selectedConfig.id
                ? `/api/settings/billing/${selectedConfig.id}`
                : '/api/settings/billing'

            const response = await fetch(url, {
                method: selectedConfig.id ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(selectedConfig),
            })

            if (!response.ok) throw new Error('Error al guardar')

            toast.success("Configuración de facturación guardada")
            fetchConfigs()
        } catch (error) {
            toast.error("Error al guardar la configuración")
        } finally {
            setLoading(false)
        }
    }

    const updateConfig = <K extends keyof BillingConfig>(
        key: K,
        value: BillingConfig[K]
    ) => {
        if (!selectedConfig) return
        setSelectedConfig({ ...selectedConfig, [key]: value })
    }

    const addEmail = () => {
        if (!selectedConfig || !emailInput) return

        const emails = [...selectedConfig.notifyEmails]
        if (!emails.includes(emailInput)) {
            emails.push(emailInput)
            updateConfig('notifyEmails', emails)
            setEmailInput("")
        }
    }

    const removeEmail = (email: string) => {
        if (!selectedConfig) return
        updateConfig('notifyEmails', selectedConfig.notifyEmails.filter(e => e !== email))
    }

    if (!selectedConfig) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Configuración de Facturación Automática</CardTitle>
                    <CardDescription>No hay configuraciones disponibles</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => setSelectedConfig({
                        name: "Nueva configuración",
                        isActive: true,
                        billingDay: 1,
                        billingHour: 0,
                        billingMinute: 0,
                        timezone: "America/Lima",
                        billingCycle: 'MONTHLY',
                        periodDuration: 30,
                        includeWeekends: true,
                        retryOnFailure: true,
                        maxRetries: 3,
                        tariffCategories: [],
                        sensorStatuses: ['ACTIVE'],
                        notifyOnSuccess: true,
                        notifyOnError: true,
                        notifyEmails: [],
                        totalInvoices: 0
                    })}>
                        Crear configuración
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Configuración de Facturación Automática</CardTitle>
                            <CardDescription>
                                Configura la generación automática de facturas
                            </CardDescription>
                        </div>
                        <Switch
                            checked={selectedConfig.isActive}
                            onCheckedChange={(checked) => updateConfig('isActive', checked)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Información básica */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nombre de la configuración</Label>
                                <Input
                                    value={selectedConfig.name}
                                    onChange={(e) => updateConfig('name', e.target.value)}
                                    placeholder="Ej: Facturación mensual"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Descripción</Label>
                                <Input
                                    value={selectedConfig.description || ''}
                                    onChange={(e) => updateConfig('description', e.target.value)}
                                    placeholder="Descripción opcional"
                                />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Programación */}
                    <div className="space-y-4">
                        <h4 className="font-medium flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Programación
                        </h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Ciclo de facturación</Label>
                                <Select
                                    value={selectedConfig.billingCycle}
                                    onValueChange={(value) => updateConfig('billingCycle', value as BillingConfig['billingCycle'])}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DAILY">Diario</SelectItem>
                                        <SelectItem value="WEEKLY">Semanal</SelectItem>
                                        <SelectItem value="MONTHLY">Mensual</SelectItem>
                                        <SelectItem value="QUARTERLY">Trimestral</SelectItem>
                                        <SelectItem value="YEARLY">Anual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedConfig.billingCycle === 'MONTHLY' && (
                                <div className="space-y-2">
                                    <Label>Día del mes</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="31"
                                        value={selectedConfig.billingDay}
                                        onChange={(e) => updateConfig('billingDay', parseInt(e.target.value))}
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Hora de ejecución</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        min="0"
                                        max="23"
                                        value={selectedConfig.billingHour}
                                        onChange={(e) => updateConfig('billingHour', parseInt(e.target.value))}
                                        placeholder="HH"
                                        className="w-20"
                                    />
                                    <span className="self-center">:</span>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="59"
                                        value={selectedConfig.billingMinute}
                                        onChange={(e) => updateConfig('billingMinute', parseInt(e.target.value))}
                                        placeholder="MM"
                                        className="w-20"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Zona horaria</Label>
                                <Select
                                    value={selectedConfig.timezone}
                                    onValueChange={(value) => updateConfig('timezone', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="America/Lima">Lima (UTC-5)</SelectItem>
                                        <SelectItem value="America/La_Paz">La Paz (UTC-4)</SelectItem>
                                        <SelectItem value="America/Bogota">Bogotá (UTC-5)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="weekends"
                                checked={selectedConfig.includeWeekends}
                                onCheckedChange={(checked) => updateConfig('includeWeekends', checked)}
                            />
                            <Label htmlFor="weekends">Incluir fines de semana</Label>
                        </div>
                    </div>

                    <Separator />

                    {/* Configuración de reintentos */}
                    <div className="space-y-4">
                        <h4 className="font-medium">Manejo de errores</h4>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="retry"
                                    checked={selectedConfig.retryOnFailure}
                                    onCheckedChange={(checked) => updateConfig('retryOnFailure', checked)}
                                />
                                <Label htmlFor="retry">Reintentar en caso de fallo</Label>
                            </div>

                            {selectedConfig.retryOnFailure && (
                                <div className="space-y-2">
                                    <Label>Máximo de reintentos</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={selectedConfig.maxRetries}
                                        onChange={(e) => updateConfig('maxRetries', parseInt(e.target.value))}
                                        className="w-32"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Notificaciones */}
                    <div className="space-y-4">
                        <h4 className="font-medium">Notificaciones</h4>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="notify-success"
                                    checked={selectedConfig.notifyOnSuccess}
                                    onCheckedChange={(checked) => updateConfig('notifyOnSuccess', checked)}
                                />
                                <Label htmlFor="notify-success">Notificar ejecuciones exitosas</Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="notify-error"
                                    checked={selectedConfig.notifyOnError}
                                    onCheckedChange={(checked) => updateConfig('notifyOnError', checked)}
                                />
                                <Label htmlFor="notify-error">Notificar errores</Label>
                            </div>

                            <div className="space-y-2">
                                <Label>Emails de notificación</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="email"
                                        value={emailInput}
                                        onChange={(e) => setEmailInput(e.target.value)}
                                        placeholder="correo@ejemplo.com"
                                        onKeyPress={(e) => e.key === 'Enter' && addEmail()}
                                    />
                                    <Button onClick={addEmail} size="sm">
                                        Agregar
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {selectedConfig.notifyEmails.map((email) => (
                                        <Badge
                                            key={email}
                                            variant="secondary"
                                            className="cursor-pointer"
                                            onClick={() => removeEmail(email)}
                                        >
                                            {email} ×
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Estado actual */}
                    {selectedConfig.id && (
                        <div className="space-y-4">
                            <h4 className="font-medium flex items-center gap-2">
                                <History className="h-4 w-4" />
                                Estado actual
                            </h4>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Última ejecución</p>
                                    <p className="font-medium">
                                        {selectedConfig.lastRun
                                            ? format(new Date(selectedConfig.lastRun), 'dd/MM/yyyy HH:mm', { locale: es })
                                            : 'Nunca'
                                        }
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Estado</p>
                                    <Badge variant={
                                        selectedConfig.lastRunStatus === 'SUCCESS' ? 'default' :
                                            selectedConfig.lastRunStatus === 'FAILED' ? 'destructive' :
                                                'secondary'
                                    }>
                                        {selectedConfig.lastRunStatus || 'Sin ejecutar'}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Próxima ejecución</p>
                                    <p className="font-medium">
                                        {selectedConfig.nextRun
                                            ? format(new Date(selectedConfig.nextRun), 'dd/MM/yyyy HH:mm', { locale: es })
                                            : 'No programada'
                                        }
                                    </p>
                                </div>
                            </div>
                            <div className="bg-muted p-3 rounded-md">
                                <p className="text-sm">
                                    <AlertCircle className="inline h-4 w-4 mr-1" />
                                    Total de facturas generadas: <strong>{selectedConfig.totalInvoices}</strong>
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSave} disabled={loading}>
                            {loading ? (
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            Guardar configuración
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}