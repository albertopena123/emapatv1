// src/app/(protected)/settings/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Save, RefreshCw } from "lucide-react"
import { BillingConfigForm } from "@/components/settings/billing-config-form"

export default function SettingsPage() {
    const [loading, setLoading] = useState(false)
    const [generalSettings, setGeneralSettings] = useState({
        companyName: "EMAPAT",
        systemEmail: "sistema@emapat.com",
        timezone: "America/La_Paz",
        dateFormat: "DD/MM/YYYY",
        currency: "BOB",
    })

    const handleSaveGeneral = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/settings/general', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(generalSettings),
            })

            if (!response.ok) throw new Error('Error al guardar')

            toast.success("Configuración general guardada")
        } catch (error) {
            toast.error("Error al guardar la configuración")
        } finally {
            setLoading(false)
        }
    }

    const updateGeneralSetting = <K extends keyof typeof generalSettings>(
        key: K,
        value: typeof generalSettings[K]
    ) => {
        setGeneralSettings(prev => ({ ...prev, [key]: value }))
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Configuración</h1>
                <p className="text-muted-foreground">Gestiona la configuración del sistema</p>
            </div>

            <Tabs defaultValue="general" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="billing">Facturación</TabsTrigger>
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
                                        value={generalSettings.companyName}
                                        onChange={(e) => updateGeneralSetting('companyName', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email del sistema</Label>
                                    <Input
                                        type="email"
                                        value={generalSettings.systemEmail}
                                        onChange={(e) => updateGeneralSetting('systemEmail', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Zona horaria</Label>
                                    <Select
                                        value={generalSettings.timezone}
                                        onValueChange={(value) => updateGeneralSetting('timezone', value)}
                                    >
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
                                    <Select
                                        value={generalSettings.dateFormat}
                                        onValueChange={(value) => updateGeneralSetting('dateFormat', value)}
                                    >
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
                                <div className="space-y-2">
                                    <Label>Moneda</Label>
                                    <Select
                                        value={generalSettings.currency}
                                        onValueChange={(value) => updateGeneralSetting('currency', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="BOB">Bolivianos (BOB)</SelectItem>
                                            <SelectItem value="USD">Dólares (USD)</SelectItem>
                                            <SelectItem value="PEN">Soles (PEN)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button onClick={handleSaveGeneral} disabled={loading}>
                                    {loading ? (
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                    )}
                                    Guardar cambios
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="billing" className="space-y-4">
                    <BillingConfigForm />
                </TabsContent>
            </Tabs>
        </div>
    )
}