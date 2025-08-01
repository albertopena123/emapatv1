// src/app/(protected)/profile/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
    Loader2,
    Camera,
    User,
    Lock,
    Save,
    Mail,
    Calendar,
    MapPin,
    Home,
    Shield,
    Info,
    Clock,
    Eye,
    EyeOff,
    Check,
    X
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface UserProfile {
    id: string
    name?: string
    email?: string
    dni: string
    image?: string
    fechaNacimiento?: string
    sexo?: string
    ubigeoNac?: string
    direccion?: string
    role?: {
        displayName: string
    }
    createdAt: string
    lastLogin?: string
    isSuperAdmin?: boolean
}

export default function ProfilePage() {
    const [user, setUser] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploadingImage, setUploadingImage] = useState(false)

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        fechaNacimiento: "",
        sexo: "",
        ubigeoNac: "",
        direccion: "",
    })

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    })

    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    })

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/auth/profile")
            if (!res.ok) throw new Error("Error al cargar perfil")

            const data = await res.json()
            setUser(data)
            setFormData({
                name: data.name || "",
                email: data.email || "",
                fechaNacimiento: data.fechaNacimiento ? format(new Date(data.fechaNacimiento), "yyyy-MM-dd") : "",
                sexo: data.sexo || "",
                ubigeoNac: data.ubigeoNac || "",
                direccion: data.direccion || "",
            })
        } catch (error) {
            toast.error("No se pudo cargar el perfil")
        } finally {
            setLoading(false)
        }
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            toast.error("La imagen no debe superar los 5MB")
            return
        }

        setUploadingImage(true)
        const formData = new FormData()
        formData.append("image", file)

        try {
            const res = await fetch("/api/auth/upload-avatar", {
                method: "POST",
                body: formData,
            })

            if (!res.ok) throw new Error("Error al subir imagen")

            const data = await res.json()
            setUser(prev => prev ? { ...prev, image: data.imageUrl } : null)

            toast.success("Imagen actualizada correctamente")
        } catch (error) {
            toast.error("No se pudo subir la imagen")
        } finally {
            setUploadingImage(false)
        }
    }

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const res = await fetch("/api/auth/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            if (!res.ok) throw new Error("Error al actualizar perfil")

            const updatedUser = await res.json()
            setUser(updatedUser)

            toast.success("Perfil actualizado correctamente")
        } catch (error) {
            toast.error("No se pudo actualizar el perfil")
        } finally {
            setSaving(false)
        }
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("Las contraseñas no coinciden")
            return
        }

        if (passwordData.newPassword.length < 6) {
            toast.error("La contraseña debe tener al menos 6 caracteres")
            return
        }

        setSaving(true)

        try {
            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                }),
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || "Error al cambiar contraseña")
            }

            toast.success("Contraseña actualizada correctamente")

            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            })
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "No se pudo cambiar la contraseña")
        } finally {
            setSaving(false)
        }
    }

    const getInitials = (name?: string, email?: string) => {
        if (name) {
            return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        }
        return email ? email[0].toUpperCase() : 'U'
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 py-8 px-4">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight">Mi Perfil</h1>
                    <p className="text-muted-foreground text-lg">
                        Administra tu información personal y configuración de seguridad
                    </p>
                </div>

                {/* Profile Card */}
                <Card className="overflow-hidden border-0 shadow-lg">
                    <div className="h-32 bg-gradient-to-r from-primary/10 via-primary/5 to-background" />
                    <CardContent className="relative px-6 pb-6">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 -mt-16">
                            <div className="relative">
                                <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                                    <AvatarImage src={user?.image || ""} />
                                    <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                                        {getInitials(user?.name, user?.email)}
                                    </AvatarFallback>
                                </Avatar>
                                <label
                                    htmlFor="avatar-upload"
                                    className="absolute bottom-2 right-2 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-all duration-200 shadow-lg"
                                >
                                    {uploadingImage ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <Camera className="h-5 w-5" />
                                    )}
                                </label>
                                <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                    disabled={uploadingImage}
                                />
                            </div>

                            <div className="flex-1 text-center sm:text-left space-y-4">
                                <div>
                                    <h2 className="text-2xl font-bold">{user?.name || "Usuario"}</h2>
                                    <p className="text-muted-foreground">{user?.email || user?.dni}</p>
                                </div>
                                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                                    {user?.role && (
                                        <Badge variant="secondary" className="gap-1">
                                            <Shield className="h-3 w-3" />
                                            {user.role.displayName}
                                        </Badge>
                                    )}
                                    {user?.isSuperAdmin && (
                                        <Badge variant="destructive" className="gap-1">
                                            <Shield className="h-3 w-3" />
                                            Super Admin
                                        </Badge>
                                    )}
                                    <Badge variant="outline" className="gap-1">
                                        <Info className="h-3 w-3" />
                                        DNI: {user?.dni}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs */}
                <Tabs defaultValue="general" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto p-1 bg-muted/50">
                        <TabsTrigger value="general" className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-3">
                            <User className="h-4 w-4 mr-2" />
                            Información General
                        </TabsTrigger>
                        <TabsTrigger value="security" className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-3">
                            <Lock className="h-4 w-4 mr-2" />
                            Seguridad
                        </TabsTrigger>
                        <TabsTrigger value="activity" className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-3">
                            <Clock className="h-4 w-4 mr-2" />
                            Actividad
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="general">
                        <Card className="border-0 shadow-lg">
                            <CardHeader>
                                <CardTitle>Información Personal</CardTitle>
                                <CardDescription>
                                    Actualiza tu información personal. Los cambios se guardarán automáticamente.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleUpdateProfile} className="space-y-6">
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                Nombre completo
                                            </Label>
                                            <Input
                                                id="name"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="Juan Pérez"
                                                className="h-11"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                Correo electrónico
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="juan@example.com"
                                                className="h-11"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="fechaNacimiento" className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                Fecha de nacimiento
                                            </Label>
                                            <Input
                                                id="fechaNacimiento"
                                                type="date"
                                                value={formData.fechaNacimiento}
                                                onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                                                className="h-11"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="sexo" className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                Sexo
                                            </Label>
                                            <Select
                                                value={formData.sexo}
                                                onValueChange={(value) => setFormData({ ...formData, sexo: value })}
                                            >
                                                <SelectTrigger className="h-11">
                                                    <SelectValue placeholder="Seleccionar" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="M">Masculino</SelectItem>
                                                    <SelectItem value="F">Femenino</SelectItem>
                                                    <SelectItem value="O">Otro</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="ubigeoNac" className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                Lugar de nacimiento
                                            </Label>
                                            <Input
                                                id="ubigeoNac"
                                                value={formData.ubigeoNac}
                                                onChange={(e) => setFormData({ ...formData, ubigeoNac: e.target.value })}
                                                placeholder="Lima, Perú"
                                                className="h-11"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="direccion" className="flex items-center gap-2">
                                                <Home className="h-4 w-4 text-muted-foreground" />
                                                Dirección actual
                                            </Label>
                                            <Input
                                                id="direccion"
                                                value={formData.direccion}
                                                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                                placeholder="Av. Principal 123"
                                                className="h-11"
                                            />
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={saving} size="lg" className="min-w-[150px]">
                                            {saving ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Guardando...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="mr-2 h-4 w-4" />
                                                    Guardar cambios
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security">
                        <div className="flex justify-center">
                            <Card className="border-0 shadow-lg w-full max-w-lg">
                                <CardHeader>
                                    <CardTitle>Cambiar Contraseña</CardTitle>
                                    <CardDescription>
                                        Asegúrate de usar una contraseña segura que no uses en otros sitios.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleChangePassword} className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="currentPassword">Contraseña actual</Label>
                                            <div className="relative">
                                                <Input
                                                    id="currentPassword"
                                                    type={showPasswords.current ? "text" : "password"}
                                                    value={passwordData.currentPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                    className="h-11 pr-10"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    {showPasswords.current ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="newPassword">Nueva contraseña</Label>
                                            <div className="relative">
                                                <Input
                                                    id="newPassword"
                                                    type={showPasswords.new ? "text" : "password"}
                                                    value={passwordData.newPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                    className="h-11 pr-10"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    {showPasswords.new ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                            {passwordData.newPassword && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    {passwordData.newPassword.length >= 6 ? (
                                                        <div className="flex items-center gap-1 text-green-600">
                                                            <Check className="h-3 w-3" />
                                                            <span>Longitud válida</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1 text-amber-600">
                                                            <X className="h-3 w-3" />
                                                            <span>Mínimo 6 caracteres</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                                            <div className="relative">
                                                <Input
                                                    id="confirmPassword"
                                                    type={showPasswords.confirm ? "text" : "password"}
                                                    value={passwordData.confirmPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                    className={`h-11 pr-10 ${passwordData.confirmPassword && passwordData.newPassword
                                                            ? passwordData.confirmPassword === passwordData.newPassword
                                                                ? "border-green-500 focus:ring-green-500"
                                                                : "border-red-500 focus:ring-red-500"
                                                            : ""
                                                        }`}
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    {showPasswords.confirm ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                            {passwordData.confirmPassword && passwordData.newPassword && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    {passwordData.confirmPassword === passwordData.newPassword ? (
                                                        <div className="flex items-center gap-1 text-green-600">
                                                            <Check className="h-3 w-3" />
                                                            <span>Las contraseñas coinciden</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1 text-red-600">
                                                            <X className="h-3 w-3" />
                                                            <span>Las contraseñas no coinciden</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <Separator />

                                        <div className="space-y-4">
                                            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                                                <h4 className="text-sm font-medium">Recomendaciones de seguridad:</h4>
                                                <ul className="text-sm text-muted-foreground space-y-1">
                                                    <li className="flex items-center gap-2">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                                                        Usa al menos 8 caracteres
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                                                        Incluye números y símbolos
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                                                        No uses información personal
                                                    </li>
                                                </ul>
                                            </div>

                                            <Button
                                                type="submit"
                                                disabled={saving || passwordData.newPassword !== passwordData.confirmPassword || passwordData.newPassword.length < 6}
                                                size="lg"
                                                className="w-full"
                                            >
                                                {saving ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Actualizando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Lock className="mr-2 h-4 w-4" />
                                                        Cambiar contraseña
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="activity">
                        <Card className="border-0 shadow-lg">
                            <CardHeader>
                                <CardTitle>Información de la Cuenta</CardTitle>
                                <CardDescription>
                                    Detalles sobre tu cuenta y actividad reciente.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <Card className="border bg-muted/50">
                                            <CardContent className="pt-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-primary/10 rounded-lg">
                                                        <Calendar className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Cuenta creada</p>
                                                        <p className="text-lg font-semibold">
                                                            {user?.createdAt ? format(new Date(user.createdAt), "dd 'de' MMMM, yyyy", { locale: es }) : "-"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="border bg-muted/50">
                                            <CardContent className="pt-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-primary/10 rounded-lg">
                                                        <Clock className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Último acceso</p>
                                                        <p className="text-lg font-semibold">
                                                            {user?.lastLogin ? format(new Date(user.lastLogin), "dd/MM/yyyy HH:mm") : "Primer acceso"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <Separator />

                                    <div className="space-y-4">
                                        <h3 className="font-semibold">Identificador único</h3>
                                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                                            <code className="text-sm font-mono flex-1">{user?.id}</code>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(user?.id || "")
                                                    toast.success("ID copiado al portapapeles")
                                                }}
                                            >
                                                Copiar
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}