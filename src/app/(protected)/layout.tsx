// src/app/(protected)/layout.tsx
"use client"

import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarSeparator,
    MenubarShortcut,
    MenubarTrigger,
} from "@/components/ui/menubar"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LogOut, Loader2, Menu, Settings, User, Bell, HelpCircle, Command, AlertCircle, Droplet, Battery } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import * as Icons from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface UserInfo {
    isSuperAdmin?: boolean
    name?: string
    email?: string
}

interface Module {
    id: number
    name: string
    displayName: string
    icon?: string
}

// Tipos para el sistema de alarmas
enum AlarmType {
    DAILY_CONSUMPTION = 'DAILY_CONSUMPTION',
    WEEKLY_CONSUMPTION = 'WEEKLY_CONSUMPTION',
    MONTHLY_CONSUMPTION = 'MONTHLY_CONSUMPTION',
    LOW_BATTERY = 'LOW_BATTERY',
    NO_COMMUNICATION = 'NO_COMMUNICATION',
    ABNORMAL_FLOW = 'ABNORMAL_FLOW',
    LEAK_DETECTED = 'LEAK_DETECTED',
    PRESSURE_ISSUE = 'PRESSURE_ISSUE',
    CUSTOM = 'CUSTOM'
}

enum AlarmSeverity {
    INFO = 'INFO',
    WARNING = 'WARNING',
    CRITICAL = 'CRITICAL',
    EMERGENCY = 'EMERGENCY'
}

interface Alarm {
    id: string
    userId: string
    user: {
        name?: string
        dni: string
    }
    sensorId?: number
    sensor?: {
        numero_medidor: string
    }
    alarmType: AlarmType
    severity: AlarmSeverity
    title: string
    description: string
    timestamp: string
    value?: number
    threshold?: number
    acknowledged: boolean
    acknowledgedAt?: string
    acknowledgedBy?: string
    resolved: boolean
    resolvedAt?: string
    resolvedBy?: string
    notified: boolean
    notificationIds: string[]
    metadata?: Record<string, unknown>
}

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    const [user, setUser] = useState<UserInfo | null>(null)
    const [modules, setModules] = useState<Module[]>([])
    const [loading, setLoading] = useState(true)
    const [alarms, setAlarms] = useState<Alarm[]>([])
    const [notifications, setNotifications] = useState(0)

    // Función para obtener alarmas activas
    const fetchActiveAlarms = async () => {
        try {
            const response = await fetch("/api/alarms")
            if (response.ok) {
                const data: Alarm[] = await response.json()
                // Filtrar solo alarmas activas (no resueltas)
                const activeAlarms = data.filter((alarm: Alarm) => !alarm.resolved)
                setAlarms(activeAlarms.slice(0, 5)) // Mostrar solo las 5 más recientes
                setNotifications(activeAlarms.length)
            }
        } catch (error) {
            console.error("Error fetching alarms:", error)
        }
    }

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch("/api/auth/me", {
                    credentials: "include"
                })

                if (!res.ok) {
                    window.location.href = "/login"
                    return
                }

                const data = await res.json()
                setUser(data.user)
                setModules(data.modules || [])
            } catch (error) {
                window.location.href = "/login"
            } finally {
                setLoading(false)
            }
        }

        checkAuth()
    }, [])

    useEffect(() => {
        fetchActiveAlarms()
        // Actualizar cada minuto
        const interval = setInterval(fetchActiveAlarms, 60000)
        return () => clearInterval(interval)
    }, [])

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" })
        window.location.href = "/login"
    }

    const getIcon = (iconName?: string) => {
        if (!iconName) return null

        const iconProps = "h-5 w-5"
        const iconMap: { [key: string]: React.JSX.Element } = {
            // Módulos principales
            'Home': <Icons.Home className={iconProps} />,
            'Users': <Icons.Users className={iconProps} />,
            'Cpu': <Icons.Cpu className={iconProps} />,
            'Gauge': <Icons.Gauge className={iconProps} />,
            'Activity': <Icons.Activity className={iconProps} />,

            // Gestión financiera
            'DollarSign': <Icons.DollarSign className={iconProps} />,
            'Receipt': <Icons.Receipt className={iconProps} />,
            'CreditCard': <Icons.CreditCard className={iconProps} />,
            'FileText': <Icons.FileText className={iconProps} />,
            'Calculator': <Icons.Calculator className={iconProps} />,

            // Alarmas y monitoreo
            'Bell': <Icons.Bell className={iconProps} />,
            'AlertTriangle': <Icons.AlertTriangle className={iconProps} />,
            'Shield': <Icons.Shield className={iconProps} />,

            // Reportes y análisis
            'BarChart3': <Icons.BarChart3 className={iconProps} />,
            'LineChart': <Icons.LineChart className={iconProps} />,
            'PieChart': <Icons.PieChart className={iconProps} />,
            'TrendingUp': <Icons.TrendingUp className={iconProps} />,

            // Dispositivos y sensores
            'Droplets': <Icons.Droplets className={iconProps} />,
            'Droplet': <Icons.Droplet className={iconProps} />,
            'Zap': <Icons.Zap className={iconProps} />,
            'Wifi': <Icons.Wifi className={iconProps} />,
            'Radio': <Icons.Radio className={iconProps} />,

            // Mantenimiento
            'Wrench': <Icons.Wrench className={iconProps} />,
            'Tool': <Icons.ToolCase className={iconProps} />,

            // Ubicación
            'MapPin': <Icons.MapPin className={iconProps} />,
            'Map': <Icons.Map className={iconProps} />,

            // Configuración y admin
            'Settings': <Icons.Settings className={iconProps} />,
            'Lock': <Icons.Lock className={iconProps} />,
            'Key': <Icons.Key className={iconProps} />,
            'UserCog': <Icons.UserCog className={iconProps} />,
        }

        return iconMap[iconName] || null
    }

    const getInitials = (name?: string, email?: string) => {
        if (name) {
            return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        }
        return email ? email[0].toUpperCase() : 'U'
    }

    // Función para obtener icono según tipo de alarma
    const getAlarmIcon = (type: AlarmType) => {
        switch (type) {
            case AlarmType.DAILY_CONSUMPTION:
            case AlarmType.WEEKLY_CONSUMPTION:
            case AlarmType.MONTHLY_CONSUMPTION:
                return <Droplet className="h-4 w-4 text-blue-500" />
            case AlarmType.LOW_BATTERY:
                return <Battery className="h-4 w-4 text-orange-500" />
            default:
                return <AlertCircle className="h-4 w-4 text-red-500" />
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
                    <p className="mt-4 text-gray-600">Cargando...</p>
                </div>
            </div>
        )
    }

    const SidebarContent = () => (
        <>
            <div className="p-6 border-b">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                        <Icons.Droplets className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">EMAPAT</h2>
                        <p className="text-xs text-muted-foreground">Sistema de Gestión</p>
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1 px-4 py-6">
                <div className="space-y-1">
                    {modules.map((module) => {
                        const isActive = pathname.startsWith(`/${module.name}`)
                        return (
                            <Link
                                key={module.id}
                                href={`/${module.name}`}
                                className={cn(
                                    "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-lg"
                                        : "hover:bg-accent text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {getIcon(module.icon)}
                                <span className="font-medium">{module.displayName}</span>
                                {isActive && (
                                    <Icons.ChevronRight className="h-4 w-4 ml-auto" />
                                )}
                            </Link>
                        )
                    })}
                </div>
            </ScrollArea>
        </>
    )

    return (
        <div className="min-h-screen flex bg-background">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-72 border-r bg-card flex-col">
                <SidebarContent />
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Top Bar */}
                <header className="border-b bg-card">
                    <div className="flex h-16 items-center px-4 gap-4">
                        {/* Mobile Menu */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="lg:hidden">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-72 p-0">
                                <SidebarContent />
                            </SheetContent>
                        </Sheet>

                        {/* Menubar */}
                        <Menubar className="hidden lg:flex">
                            <MenubarMenu>
                                <MenubarTrigger>Archivo</MenubarTrigger>
                                <MenubarContent>
                                    <MenubarItem>
                                        Nueva Factura <MenubarShortcut>⌘N</MenubarShortcut>
                                    </MenubarItem>
                                    <MenubarItem>Nuevo Usuario</MenubarItem>
                                    <MenubarSeparator />
                                    <MenubarItem>Exportar Datos</MenubarItem>
                                    <MenubarItem>Imprimir</MenubarItem>
                                </MenubarContent>
                            </MenubarMenu>
                            <MenubarMenu>
                                <MenubarTrigger>Ver</MenubarTrigger>
                                <MenubarContent>
                                    <MenubarItem>Panel Completo</MenubarItem>
                                    <MenubarItem>Vista Compacta</MenubarItem>
                                    <MenubarSeparator />
                                    <MenubarItem>Actualizar <MenubarShortcut>F5</MenubarShortcut></MenubarItem>
                                </MenubarContent>
                            </MenubarMenu>
                            <MenubarMenu>
                                <MenubarTrigger>Herramientas</MenubarTrigger>
                                <MenubarContent>
                                    <MenubarItem>
                                        <Icons.BarChart3 className="mr-2 h-4 w-4" />
                                        Reportes
                                    </MenubarItem>
                                    <MenubarItem>
                                        <Icons.Download className="mr-2 h-4 w-4" />
                                        Respaldos
                                    </MenubarItem>
                                    <MenubarSeparator />
                                    <MenubarItem>
                                        <Icons.Settings className="mr-2 h-4 w-4" />
                                        Configuración
                                    </MenubarItem>
                                </MenubarContent>
                            </MenubarMenu>
                        </Menubar>

                        {/* Search */}
                        <div className="flex-1 flex items-center">
                            <div className="relative w-full max-w-sm">
                                <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="search"
                                    placeholder="Buscar..."
                                    className="w-full pl-10 pr-4 py-2 text-sm bg-muted/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                                    <span className="text-xs">⌘</span>K
                                </kbd>
                            </div>
                        </div>

                        {/* Right Side Actions */}
                        <div className="flex items-center gap-2">
                            {/* Notifications */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="relative">
                                        <Bell className="h-5 w-5" />
                                        {notifications > 0 && (
                                            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500">
                                                {notifications > 9 ? '9+' : notifications}
                                            </Badge>
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-80">
                                    <DropdownMenuLabel className="flex items-center justify-between">
                                        <span>Notificaciones</span>
                                        {notifications > 0 && (
                                            <Badge variant="secondary" className="ml-2">
                                                {notifications} activas
                                            </Badge>
                                        )}
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />

                                    {alarms.length === 0 ? (
                                        <div className="p-4 text-center text-sm text-muted-foreground">
                                            No hay alarmas activas
                                        </div>
                                    ) : (
                                        alarms.map((alarm) => (
                                            <DropdownMenuItem key={alarm.id} className="p-3 cursor-pointer">
                                                <div className="flex gap-3 w-full">
                                                    {getAlarmIcon(alarm.alarmType)}
                                                    <div className="flex-1">
                                                        <p className="font-medium text-sm">{alarm.title}</p>
                                                        <p className="text-xs text-muted-foreground line-clamp-1">
                                                            {alarm.sensor?.numero_medidor} - {alarm.user.name || alarm.user.dni}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {format(new Date(alarm.timestamp), "dd MMM HH:mm", { locale: es })}
                                                        </p>
                                                    </div>
                                                    {alarm.severity === AlarmSeverity.CRITICAL && (
                                                        <Badge variant="destructive" className="h-5 text-xs">
                                                            Crítica
                                                        </Badge>
                                                    )}
                                                </div>
                                            </DropdownMenuItem>
                                        ))
                                    )}

                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-center text-primary cursor-pointer"
                                        onClick={() => router.push('/alarms')}
                                    >
                                        Ver todas las alarmas
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Help */}
                            <Button variant="ghost" size="icon">
                                <HelpCircle className="h-5 w-5" />
                            </Button>

                            {/* User Menu */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                                                {getInitials(user?.name, user?.email)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium">{user?.name || user?.email}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {user?.isSuperAdmin ? "Super Administrador" : "Usuario"}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/profile" className="cursor-pointer">
                                            <User className="mr-2 h-4 w-4" />
                                            Mi Perfil
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Settings className="mr-2 h-4 w-4" />
                                        Configuración
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Cerrar Sesión
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto bg-muted/30">
                    {children}
                </main>
            </div>
        </div>
    )
}