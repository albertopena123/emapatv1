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
    ArrowDown
} from "lucide-react"

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

export default async function DashboardPage() {
    const user = await getUser()

    if (!user) {
        redirect("/login")
    }

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
            {user.isSuperAdmin ? (
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
                                            1,234
                                        </p>
                                        <p className="text-sm text-green-600 flex items-center mt-2">
                                            <ArrowUp className="h-4 w-4 mr-1" />
                                            12% este mes
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
                                            89
                                        </p>
                                        <p className="text-sm text-green-600 flex items-center mt-2">
                                            <Activity className="h-4 w-4 mr-1" />
                                            98% operativos
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
                                            45,678 m³
                                        </p>
                                        <p className="text-sm text-red-600 flex items-center mt-2">
                                            <ArrowDown className="h-4 w-4 mr-1" />
                                            5% menos
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
                                            S/. 125,430
                                        </p>
                                        <p className="text-sm text-green-600 flex items-center mt-2">
                                            <TrendingUp className="h-4 w-4 mr-1" />
                                            8% más
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
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <div>
                                                    <p className="font-medium text-sm">Sensor #{i}23 actualizado</p>
                                                    <p className="text-xs text-gray-500">Hace {i * 5} minutos</p>
                                                </div>
                                            </div>
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                                Activo
                                            </span>
                                        </div>
                                    ))}
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
                                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                        <p className="font-medium text-orange-800">Consumo elevado detectado</p>
                                        <p className="text-sm text-orange-600 mt-1">Zona Norte - Verificar posibles fugas</p>
                                    </div>
                                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <p className="font-medium text-yellow-800">Mantenimiento programado</p>
                                        <p className="text-sm text-yellow-600 mt-1">3 sensores requieren calibración</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            ) : (
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
                            <div className="text-center py-8">
                                <Cpu className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No hay sensores asignados</p>
                                <p className="text-sm text-gray-400 mt-2">
                                    Contacta al administrador para asignar sensores
                                </p>
                            </div>
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
                                        <p className="text-2xl font-bold text-gray-900">0 m³</p>
                                    </div>
                                    <Droplets className="h-8 w-8 text-cyan-500" />
                                </div>
                                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium">Última Lectura</p>
                                        <p className="text-sm text-gray-600">Sin datos</p>
                                    </div>
                                    <FileText className="h-8 w-8 text-gray-400" />
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
                            <div className="text-center py-8">
                                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No hay facturas disponibles</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}