// src/app/(protected)/maintenance/page.tsx
"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { MaintenanceForm } from "@/components/maintenance/maintenance-form"
import { MaintenanceTable } from "@/components/maintenance/maintenance-table"
import {
    Wrench,
    Calendar,
    AlertTriangle,
    CheckCircle,
    Clock,
    XCircle,
    Plus,
    BarChart3
} from "lucide-react"

export default function MaintenancePage() {
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1)
    }

    // Estas estadísticas deberían venir de una API real
    const stats = {
        total: 156,
        scheduled: 23,
        inProgress: 8,
        completed: 118,
        cancelled: 7
    }

    return (
        <div className="container mx-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Mantenimiento</h1>
                    <p className="text-sm lg:text-base text-gray-600">Gestión de mantenimientos de sensores</p>
                </div>

                <MaintenanceForm
                    onSuccess={handleRefresh}
                    trigger={
                        <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                            <Plus className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Nuevo Mantenimiento</span>
                            <span className="sm:hidden">Nuevo</span>
                        </Button>
                    }
                />
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
                <Card className="p-3 lg:p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs lg:text-sm font-medium text-gray-600">Total</p>
                            <p className="text-lg lg:text-2xl font-bold">{stats.total}</p>
                        </div>
                        <Wrench className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
                    </div>
                </Card>

                <Card className="p-3 lg:p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs lg:text-sm font-medium text-gray-600">Programados</p>
                            <p className="text-lg lg:text-2xl font-bold text-blue-600">{stats.scheduled}</p>
                        </div>
                        <Calendar className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
                    </div>
                    <Badge className="mt-1 lg:mt-2 bg-blue-100 text-blue-800 text-xs">
                        Próximos
                    </Badge>
                </Card>

                <Card className="p-3 lg:p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs lg:text-sm font-medium text-gray-600">En Progreso</p>
                            <p className="text-lg lg:text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
                        </div>
                        <Clock className="h-6 w-6 lg:h-8 lg:w-8 text-yellow-600" />
                    </div>
                    <Badge className="mt-1 lg:mt-2 bg-yellow-100 text-yellow-800 text-xs">
                        Activos
                    </Badge>
                </Card>

                <Card className="p-3 lg:p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs lg:text-sm font-medium text-gray-600">Completados</p>
                            <p className="text-lg lg:text-2xl font-bold text-green-600">{stats.completed}</p>
                        </div>
                        <CheckCircle className="h-6 w-6 lg:h-8 lg:w-8 text-green-600" />
                    </div>
                    <Badge className="mt-1 lg:mt-2 bg-green-100 text-green-800 text-xs">
                        Finalizados
                    </Badge>
                </Card>

                <Card className="p-3 lg:p-4 col-span-2 sm:col-span-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs lg:text-sm font-medium text-gray-600">Cancelados</p>
                            <p className="text-lg lg:text-2xl font-bold text-red-600">{stats.cancelled}</p>
                        </div>
                        <XCircle className="h-6 w-6 lg:h-8 lg:w-8 text-red-600" />
                    </div>
                    <Badge className="mt-1 lg:mt-2 bg-red-100 text-red-800 text-xs">
                        Cancelados
                    </Badge>
                </Card>
            </div>

            {/* Contenido Principal */}
            <Tabs defaultValue="list" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-auto">
                    <TabsTrigger value="list" className="flex items-center gap-2 py-2 px-3 lg:px-4">
                        <Wrench className="h-4 w-4" />
                        <span className="hidden sm:inline">Lista de Mantenimientos</span>
                        <span className="sm:hidden">Lista</span>
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="flex items-center gap-2 py-2 px-3 lg:px-4">
                        <BarChart3 className="h-4 w-4" />
                        <span className="hidden sm:inline">Análisis</span>
                        <span className="sm:hidden">Análisis</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="space-y-4 mt-4 lg:mt-6">
                    <Card className="p-3 lg:p-6">
                        <MaintenanceTable refreshTrigger={refreshTrigger} />
                    </Card>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4 mt-4 lg:mt-6">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
                        <Card className="p-4 lg:p-6">
                            <h3 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4">Tipos de Mantenimiento</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Preventivo</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 lg:w-24 bg-gray-200 rounded-full h-2">
                                            <div className="bg-green-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                                        </div>
                                        <span className="text-sm font-medium">65%</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Correctivo</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 lg:w-24 bg-gray-200 rounded-full h-2">
                                            <div className="bg-red-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                                        </div>
                                        <span className="text-sm font-medium">25%</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Calibración</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 lg:w-24 bg-gray-200 rounded-full h-2">
                                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '10%' }}></div>
                                        </div>
                                        <span className="text-sm font-medium">10%</span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4 lg:p-6">
                            <h3 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4">Tendencia Mensual</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Enero</span>
                                    <span className="text-sm font-medium">12 mantenimientos</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Febrero</span>
                                    <span className="text-sm font-medium">18 mantenimientos</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Marzo</span>
                                    <span className="text-sm font-medium">15 mantenimientos</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Abril</span>
                                    <span className="text-sm font-medium text-blue-600">23 mantenimientos</span>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4 lg:p-6">
                            <h3 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4">Costos por Tipo</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Preventivo</span>
                                    <span className="text-sm font-medium">S/ 2,450.00</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Correctivo</span>
                                    <span className="text-sm font-medium">S/ 4,780.00</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Calibración</span>
                                    <span className="text-sm font-medium">S/ 890.00</span>
                                </div>
                                <hr className="my-2" />
                                <div className="flex items-center justify-between font-semibold">
                                    <span className="text-sm">Total</span>
                                    <span className="text-sm">S/ 8,120.00</span>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4 lg:p-6">
                            <h3 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4">Próximos Mantenimientos</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">Calibración Sensor #001</p>
                                        <p className="text-xs text-gray-600">Programado para mañana</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                                    <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">Mantenimiento Preventivo #045</p>
                                        <p className="text-xs text-gray-600">Programado para el viernes</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                                    <Wrench className="h-5 w-5 text-green-600 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">Instalación Sensor #078</p>
                                        <p className="text-xs text-gray-600">Programado para la próxima semana</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}