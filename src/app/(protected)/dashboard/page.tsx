// src/app/(protected)/dashboard/page.tsx
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { jwtVerify } from "jose"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Users,
    Cpu,
    FileText,
    DollarSign,
    TrendingUp,
    Droplets,
    Activity,
    AlertCircle,
    ArrowUp,
    ArrowDown,
    Clock,
    CheckCircle,
    XCircle,
    Battery,
    BatteryLow
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import ConsumptionChartWrapper from '@/components/dashboard/ConsumptionChartWrapper'
import ConsumptionSummaryWrapper from '@/components/dashboard/ConsumptionSummaryWrapper'
import { InvoiceSection } from "./InvoiceSection"

const secret = new TextEncoder().encode(
    process.env.JWT_SECRET || "your-secret-key-change-this"
)

interface UserPayload {
    userId: string
    email?: string
    dni?: string
    name?: string
    isSuperAdmin?: boolean
    roleId?: number
}

// Interfaces para los datos del dashboard
interface SensorActivity {
    id: number
    name: string
    numero_medidor: string
    status: string
    updatedAt: string
}

interface Alarm {
    id: string
    title: string
    description: string
    severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'EMERGENCY'
    timestamp: string
    sensor?: {
        name: string
        direccion: string
    }
}

interface AdminStats {
    stats: {
        totalUsers: number
        userGrowth: string
        activeSensors: number
        totalSensors: number
        sensorOperational: string
        monthlyConsumption: number
        consumptionChange: string
        monthlyRevenue: number
    }
    recentActivity: SensorActivity[]
    activeAlarms: Alarm[]
}

interface UserSensor {
    id: number
    name: string
    numero_medidor: string
    status: string
    direccion: string
    lastCommunication: string | null
}

interface Invoice {
    id: number
    invoiceNumber: string
    totalAmount: number
    status: string
    dueDate: string
    periodStart: string
    periodEnd: string
}

interface ConsumptionData {
    id: number
    amount: number
    consumption: number | null
    readingDate: string
    timestamp: string
}

interface BatteryStatus {
    deviceEui: string
    voltage: number
    percentage: number | null
    timestamp: string
    sensor: {
        name: string
        numero_medidor: string
    }
}

interface UserStats {
    sensors: UserSensor[]
    currentConsumption: number
    lastReading: {
        amount: number
        readingDate: string
        consumption: number | null
    } | null
    invoices: Invoice[]
    consumptionHistory: ConsumptionData[]
    batteryStatus: BatteryStatus[]
}

// Type guard para verificar si es AdminStats
function isAdminStats(data: AdminStats | UserStats): data is AdminStats {
    return 'stats' in data && 'recentActivity' in data && 'activeAlarms' in data
}

async function getUser(): Promise<UserPayload | null> {
    const headersList = await headers()
    const cookieHeader = headersList.get("cookie")

    if (!cookieHeader) return null

    const token = cookieHeader.split("; ")
        .find((row: string) => row.startsWith("auth-token="))
        ?.split("=")[1]

    if (!token) return null

    try {
        const { payload } = await jwtVerify(token, secret)
        return payload as unknown as UserPayload
    } catch {
        return null
    }
}

async function getDashboardData(): Promise<AdminStats | UserStats> {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001'
    const headersList = await headers()
    const cookieHeader = headersList.get("cookie") || ""

    const response = await fetch(`${baseUrl}/api/dashboard/stats`, {
        headers: {
            cookie: cookieHeader
        },
        cache: 'no-store'
    })

    if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
    }

    return response.json()
}

export default async function DashboardPage() {
    const user = await getUser()

    if (!user) {
        redirect("/login")
    }

    const dashboardData = await getDashboardData()
    const isAdmin = user.isSuperAdmin === true

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-2">
                    Bienvenido de vuelta, {user.name || user.email}
                </p>
            </div>

            {/* User Info Card */}
            <Card className="mb-8 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">
                                {user.name || user.email}
                            </h2>
                            <div className="space-y-1">
                                <p className="flex items-center gap-2 text-blue-100">
                                    <span className="font-medium">DNI:</span> {user.dni}
                                </p>
                                <p className="flex items-center gap-2 text-blue-100">
                                    <span className="font-medium">Rol:</span>
                                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                                        {user.isSuperAdmin ? "Super Administrador" : "Usuario"}
                                    </span>
                                </p>
                            </div>
                        </div>
                        <div className="hidden lg:block">
                            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                                <Users className="h-12 w-12 text-white/80" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Contenido específico por rol */}
            {isAdmin && isAdminStats(dashboardData) ? (
                <>
                    {/* Admin Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">
                                            Usuarios Totales
                                        </p>
                                        <p className="text-3xl font-bold text-gray-900 mt-2">
                                            {dashboardData.stats.totalUsers.toLocaleString()}
                                        </p>
                                        <p className="text-sm text-green-600 flex items-center mt-2">
                                            <ArrowUp className="h-4 w-4 mr-1" />
                                            {dashboardData.stats.userGrowth}% activos
                                        </p>
                                    </div>
                                    <div className="p-3 bg-blue-100 rounded-lg">
                                        <Users className="h-8 w-8 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">
                                            Sensores Activos
                                        </p>
                                        <p className="text-3xl font-bold text-gray-900 mt-2">
                                            {dashboardData.stats.activeSensors}
                                        </p>
                                        <p className="text-sm text-green-600 flex items-center mt-2">
                                            <Activity className="h-4 w-4 mr-1" />
                                            {dashboardData.stats.sensorOperational}% operativos
                                        </p>
                                    </div>
                                    <div className="p-3 bg-green-100 rounded-lg">
                                        <Cpu className="h-8 w-8 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">
                                            Consumo Mensual
                                        </p>
                                        <p className="text-3xl font-bold text-gray-900 mt-2">
                                            {(dashboardData.stats.monthlyConsumption / 1000).toLocaleString()} m³
                                        </p>
                                        <p className={`text-sm flex items-center mt-2 ${parseFloat(dashboardData.stats.consumptionChange) > 0
                                            ? 'text-red-600'
                                            : 'text-green-600'
                                            }`}>
                                            {parseFloat(dashboardData.stats.consumptionChange) > 0 ? (
                                                <ArrowUp className="h-4 w-4 mr-1" />
                                            ) : (
                                                <ArrowDown className="h-4 w-4 mr-1" />
                                            )}
                                            {Math.abs(parseFloat(dashboardData.stats.consumptionChange))}%
                                        </p>
                                    </div>
                                    <div className="p-3 bg-cyan-100 rounded-lg">
                                        <Droplets className="h-8 w-8 text-cyan-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">
                                            Ingresos del Mes
                                        </p>
                                        <p className="text-3xl font-bold text-gray-900 mt-2">
                                            S/. {dashboardData.stats.monthlyRevenue.toLocaleString()}
                                        </p>
                                        <p className="text-sm text-green-600 flex items-center mt-2">
                                            <TrendingUp className="h-4 w-4 mr-1" />
                                            Facturado
                                        </p>
                                    </div>
                                    <div className="p-3 bg-purple-100 rounded-lg">
                                        <DollarSign className="h-8 w-8 text-purple-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Additional Admin Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="border-0 shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-blue-600" />
                                    Actividad Reciente
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {dashboardData.recentActivity.length > 0 ? (
                                        dashboardData.recentActivity.map((activity) => (
                                            <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${activity.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-400'
                                                        }`}></div>
                                                    <div>
                                                        <p className="font-medium text-sm">{activity.name}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {format(new Date(activity.updatedAt), "dd/MM HH:mm", { locale: es })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded ${activity.status === 'ACTIVE'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {activity.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-gray-500 py-4">
                                            No hay actividad reciente
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-orange-600" />
                                    Alertas del Sistema
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {dashboardData.activeAlarms.length > 0 ? (
                                        dashboardData.activeAlarms.map((alarm) => (
                                            <div key={alarm.id} className={`p-4 rounded-lg border ${alarm.severity === 'CRITICAL'
                                                ? 'bg-red-50 border-red-200'
                                                : alarm.severity === 'WARNING'
                                                    ? 'bg-orange-50 border-orange-200'
                                                    : 'bg-yellow-50 border-yellow-200'
                                                }`}>
                                                <p className={`font-medium ${alarm.severity === 'CRITICAL'
                                                    ? 'text-red-800'
                                                    : alarm.severity === 'WARNING'
                                                        ? 'text-orange-800'
                                                        : 'text-yellow-800'
                                                    }`}>
                                                    {alarm.title}
                                                </p>
                                                <p className={`text-sm mt-1 ${alarm.severity === 'CRITICAL'
                                                    ? 'text-red-600'
                                                    : alarm.severity === 'WARNING'
                                                        ? 'text-orange-600'
                                                        : 'text-yellow-600'
                                                    }`}>
                                                    {alarm.description}
                                                </p>
                                                {alarm.sensor && (
                                                    <p className="text-xs text-gray-500 mt-2">
                                                        {alarm.sensor.name} - {alarm.sensor.direccion}
                                                    </p>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8">
                                            <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-2" />
                                            <p className="text-gray-500">No hay alertas activas</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            ) : !isAdminStats(dashboardData) ? (
                // User Content
                <div className="space-y-6">
                    {/* Gráfico de Consumo */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Droplets className="h-5 w-5 text-cyan-600" />
                                Historial de Consumo (Últimos 30 días)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {dashboardData.consumptionHistory.length > 0 ? (
                                <ConsumptionChartWrapper data={dashboardData.consumptionHistory} />
                            ) : (
                                <div className="text-center py-8">
                                    <Droplets className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">No hay datos de consumo disponibles</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Grid de Sensores y Estado de Batería */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Sensores */}
                        <Card className="border-0 shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Cpu className="h-5 w-5 text-blue-600" />
                                    Mis Sensores
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {dashboardData.sensors.length > 0 ? (
                                    <div className="space-y-3">
                                        {dashboardData.sensors.map((sensor) => (
                                            <div key={sensor.id} className="p-4 bg-gray-50 rounded-lg">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-medium">{sensor.name}</p>
                                                        <p className="text-sm text-gray-600">{sensor.direccion}</p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Medidor: {sensor.numero_medidor}
                                                        </p>
                                                    </div>
                                                    <span className={`text-xs px-2 py-1 rounded ${sensor.status === 'ACTIVE'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {sensor.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Cpu className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500">No hay sensores asignados</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Estado de Batería */}
                        <Card className="border-0 shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Battery className="h-5 w-5 text-green-600" />
                                    Estado de Baterías
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {dashboardData.batteryStatus.length > 0 ? (
                                    <div className="space-y-3">
                                        {dashboardData.batteryStatus.map((battery) => {
                                            const percentage = battery.percentage || Math.min(100, Math.max(0, (battery.voltage / 3.6) * 100))
                                            const isLow = percentage < 20

                                            return (
                                                <div key={battery.deviceEui} className="p-4 bg-gray-50 rounded-lg">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className="font-medium">{battery.sensor.name}</p>
                                                            <p className="text-sm text-gray-600">
                                                                Voltaje: {battery.voltage.toFixed(2)}V
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                Última lectura: {format(new Date(battery.timestamp), "dd/MM HH:mm", { locale: es })}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {isLow ? (
                                                                <BatteryLow className="h-6 w-6 text-red-500" />
                                                            ) : (
                                                                <Battery className="h-6 w-6 text-green-500" />
                                                            )}
                                                            <span className={`text-lg font-bold ${isLow ? 'text-red-600' : 'text-green-600'
                                                                }`}>
                                                                {percentage.toFixed(0)}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full transition-all ${isLow ? 'bg-red-500' : 'bg-green-500'
                                                                }`}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Battery className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500">No hay datos de batería disponibles</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Resumen de Consumo y Facturas */}
                    <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">


                        {/* SECCIÓN DE FACTURAS CON MODAL DE PAGO */}
                        <InvoiceSection
                            invoices={dashboardData.invoices}
                            userInfo={{
                                name: user.name || null,
                                dni: user.dni || ""
                            }}
                        />
                    </div>
                </div>
            ) : null}
        </div>
    )
}