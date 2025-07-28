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
    XCircle
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

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

interface UserStats {
    sensors: UserSensor[]
    currentConsumption: number
    lastReading: {
        amount: number
        readingDate: string
        consumption: number
    } | null
    invoices: Invoice[]
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
                                            {dashboardData.stats.monthlyConsumption.toLocaleString()} m³
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                                    <p className="text-sm text-gray-400 mt-2">
                                        Contacta al administrador para asignar sensores
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Droplets className="h-5 w-5 text-cyan-600" />
                                Mi Consumo
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium">Consumo Actual</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {dashboardData.currentConsumption.toLocaleString()} m³
                                        </p>
                                    </div>
                                    <Droplets className="h-8 w-8 text-cyan-500" />
                                </div>
                                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium">Última Lectura</p>
                                        {dashboardData.lastReading ? (
                                            <>
                                                <p className="text-sm text-gray-600">
                                                    {format(new Date(dashboardData.lastReading.readingDate), "dd/MM/yyyy HH:mm", { locale: es })}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Lectura: {dashboardData.lastReading.amount} m³
                                                </p>
                                            </>
                                        ) : (
                                            <p className="text-sm text-gray-600">Sin datos</p>
                                        )}
                                    </div>
                                    <Clock className="h-8 w-8 text-gray-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-purple-600" />
                                Últimas Facturas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {dashboardData.invoices.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-2 text-sm font-medium text-gray-700">Número</th>
                                                <th className="text-left py-2 text-sm font-medium text-gray-700">Período</th>
                                                <th className="text-left py-2 text-sm font-medium text-gray-700">Monto</th>
                                                <th className="text-left py-2 text-sm font-medium text-gray-700">Estado</th>
                                                <th className="text-left py-2 text-sm font-medium text-gray-700">Vencimiento</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dashboardData.invoices.map((invoice) => (
                                                <tr key={invoice.id} className="border-b hover:bg-gray-50">
                                                    <td className="py-3 text-sm">{invoice.invoiceNumber}</td>
                                                    <td className="py-3 text-sm">
                                                        {format(new Date(invoice.periodStart), "MMM yyyy", { locale: es })}
                                                    </td>
                                                    <td className="py-3 text-sm font-medium">
                                                        S/. {invoice.totalAmount.toFixed(2)}
                                                    </td>
                                                    <td className="py-3">
                                                        <span className={`text-xs px-2 py-1 rounded ${invoice.status === 'PAID'
                                                            ? 'bg-green-100 text-green-700'
                                                            : invoice.status === 'OVERDUE'
                                                                ? 'bg-red-100 text-red-700'
                                                                : 'bg-yellow-100 text-yellow-700'
                                                            }`}>
                                                            {invoice.status === 'PAID' ? 'Pagado' :
                                                                invoice.status === 'OVERDUE' ? 'Vencido' : 'Pendiente'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-sm">
                                                        {format(new Date(invoice.dueDate), "dd/MM/yyyy", { locale: es })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">No hay facturas disponibles</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            ) : null}
        </div>
    )
}