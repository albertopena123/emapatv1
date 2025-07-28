// src/app/(protected)/settings/page.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Save, RefreshCw, Mail, Shield, Database, Bell } from "lucide-react"

export default function SettingsPage() {
    const [loading, setLoading] = useState(false)
    const [settings, setSettings] = useState({
        // Sistema
        companyName: "EMAPAT",
        systemEmail: "sistema@emapat.com",
        timezone: "America/La_Paz",
        dateFormat: "DD/MM/YYYY",
        currency: "BOB",

        // Alarmas
        dailyConsumptionLimit: 3,
        weeklyConsumptionLimit: 8000,
        batteryLowThreshold: 2.5,
        noCommunicationHours: 24,

        // Notificaciones
        emailEnabled: true,
        smsEnabled: false,
        whatsappEnabled: false,
        pushEnabled: true,
        quietHoursStart: "22:00",
        quietHoursEnd: "07:00",

        // Respaldos
        autoBackupEnabled: true,
        backupFrequency: "daily",
        backupTime: "03:00",
        backupRetentionDays: 30,

        // API
        apiRateLimit: 1000,
        apiTimeout: 30,
        webhookUrl: "",
        apiKey: "****-****-****-****"
    })

    const handleSave = async () => {
        setLoading(true)
        try {
            // Simular guardado
            await new Promise(resolve => setTimeout(resolve, 1000))
            toast.success("Configuración guardada correctamente")
        } catch (error) {
            toast.error("No se pudo guardar la configuración")
        } finally {
            setLoading(false)
        }
    }

    const updateSetting = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }))
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Configuración</h1>
                <p className="text-muted-foreground">Gestiona la configuración del sistema</p>
            </div>

            <Tabs defaultValue="general" className="space-y-4">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="alarms">Alarmas</TabsTrigger>
                    <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
                    <TabsTrigger value="backup">Respaldos</TabsTrigger>
                    <TabsTrigger value="api">API</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuración General</CardTitle>
                            <CardDescription>Información básica del sistema</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nombre de la empresa</Label>
                                    <Input
                                        value={settings.companyName}
                                        onChange={(e) => updateSetting('companyName', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email del sistema</Label>
                                    <Input
                                        type="email"
                                        value={settings.systemEmail}
                                        onChange={(e) => updateSetting('systemEmail', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Zona horaria</Label>
                                    <Select value={settings.timezone} onValueChange={(value) => updateSetting('timezone', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="America/La_Paz">La Paz (UTC-4)</SelectItem>
                                            <SelectItem value="America/Lima">Lima (UTC-5)</SelectItem>
                                            <SelectItem value="America/Bogota">Bogotá (UTC-5)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Formato de fecha</Label>
                                    <Select value={settings.dateFormat} onValueChange={(value) => updateSetting('dateFormat', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                                            <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                                            <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="alarms" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Límites de Alarmas</CardTitle>
                            <CardDescription>Configura los umbrales predeterminados para las alarmas</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Límite diario de consumo (m³)</Label>
                                    <Input
                                        type="number"
                                        value={settings.dailyConsumptionLimit}
                                        onChange={(e) => updateSetting('dailyConsumptionLimit', Number(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Límite semanal de consumo (litros)</Label>
                                    <Input
                                        type="number"
                                        value={settings.weeklyConsumptionLimit}
                                        onChange={(e) => updateSetting('weeklyConsumptionLimit', Number(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Umbral de batería baja (V)</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={settings.batteryLowThreshold}
                                        onChange={(e) => updateSetting('batteryLowThreshold', Number(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Horas sin comunicación</Label>
                                    <Input
                                        type="number"
                                        value={settings.noCommunicationHours}
                                        onChange={(e) => updateSetting('noCommunicationHours', Number(e.target.value))}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Canales de Notificación</CardTitle>
                            <CardDescription>Configura cómo se envían las notificaciones</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Email</Label>
                                        <p className="text-sm text-muted-foreground">Enviar notificaciones por correo</p>
                                    </div>
                                    <Switch
                                        checked={settings.emailEnabled}
                                        onCheckedChange={(checked) => updateSetting('emailEnabled', checked)}
                                    />
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>SMS</Label>
                                        <p className="text-sm text-muted-foreground">Enviar alertas críticas por SMS</p>
                                    </div>
                                    <Switch
                                        checked={settings.smsEnabled}
                                        onCheckedChange={(checked) => updateSetting('smsEnabled', checked)}
                                    />
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Push</Label>
                                        <p className="text-sm text-muted-foreground">Notificaciones en la aplicación</p>
                                    </div>
                                    <Switch
                                        checked={settings.pushEnabled}
                                        onCheckedChange={(checked) => updateSetting('pushEnabled', checked)}
                                    />
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <h4 className="font-medium">Horario de silencio</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Hora de inicio</Label>
                                        <Input
                                            type="time"
                                            value={settings.quietHoursStart}
                                            onChange={(e) => updateSetting('quietHoursStart', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Hora de fin</Label>
                                        <Input
                                            type="time"
                                            value={settings.quietHoursEnd}
                                            onChange={(e) => updateSetting('quietHoursEnd', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="backup" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Respaldos Automáticos</CardTitle>
                            <CardDescription>Configura los respaldos del sistema</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Respaldos automáticos</Label>
                                    <p className="text-sm text-muted-foreground">Realizar respaldos programados</p>
                                </div>
                                <Switch
                                    checked={settings.autoBackupEnabled}
                                    onCheckedChange={(checked) => updateSetting('autoBackupEnabled', checked)}
                                />
                            </div>

                            {settings.autoBackupEnabled && (
                                <>
                                    <Separator />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Frecuencia</Label>
                                            <Select value={settings.backupFrequency} onValueChange={(value) => updateSetting('backupFrequency', value)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="daily">Diario</SelectItem>
                                                    <SelectItem value="weekly">Semanal</SelectItem>
                                                    <SelectItem value="monthly">Mensual</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Hora de respaldo</Label>
                                            <Input
                                                type="time"
                                                value={settings.backupTime}
                                                onChange={(e) => updateSetting('backupTime', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Retención (días)</Label>
                                            <Input
                                                type="number"
                                                value={settings.backupRetentionDays}
                                                onChange={(e) => updateSetting('backupRetentionDays', Number(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            <Separator />

                            <Button variant="outline" className="w-full">
                                <Database className="mr-2 h-4 w-4" />
                                Crear respaldo manual
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="api" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuración de API</CardTitle>
                            <CardDescription>Gestiona las integraciones del sistema</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Límite de peticiones por hora</Label>
                                    <Input
                                        type="number"
                                        value={settings.apiRateLimit}
                                        onChange={(e) => updateSetting('apiRateLimit', Number(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Timeout (segundos)</Label>
                                    <Input
                                        type="number"
                                        value={settings.apiTimeout}
                                        onChange={(e) => updateSetting('apiTimeout', Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <Label>Webhook URL</Label>
                                <Input
                                    placeholder="https://ejemplo.com/webhook"
                                    value={settings.webhookUrl}
                                    onChange={(e) => updateSetting('webhookUrl', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>API Key</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="password"
                                        value={settings.apiKey}
                                        disabled
                                    />
                                    <Button variant="outline">
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={loading}>
                    {loading ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    Guardar cambios
                </Button>
            </div>
        </div>
    )
}