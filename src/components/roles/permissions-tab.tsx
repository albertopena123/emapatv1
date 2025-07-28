// src/components/roles/permissions-tab.tsx
"use client"

import { useEffect, useState } from "react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Save, Shield, Loader2, Key, CheckCircle, Circle } from "lucide-react"
import { toast } from "sonner"

interface Role {
    id: number
    name: string
    displayName: string
}

interface Module {
    id: number
    name: string
    displayName: string
    permissions: Permission[]
}

interface Permission {
    id: number
    moduleId: number
    action: string
    resource: string
    description: string | null
}

export function PermissionsTab() {
    const [roles, setRoles] = useState<Role[]>([])
    const [modules, setModules] = useState<Module[]>([])
    const [selectedRoleId, setSelectedRoleId] = useState<string>("")
    const [rolePermissions, setRolePermissions] = useState<Set<number>>(new Set())
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchRoles()
        fetchModules()
    }, [])

    useEffect(() => {
        if (selectedRoleId) {
            fetchRolePermissions(selectedRoleId)
        }
    }, [selectedRoleId])

    const fetchRoles = async () => {
        try {
            const response = await fetch("/api/roles")
            if (response.ok) {
                const data = await response.json()
                setRoles(data)
            }
        } catch (error) {
            console.error("Error fetching roles:", error)
            toast.error("Error al cargar los roles")
        }
    }

    const fetchModules = async () => {
        try {
            const response = await fetch("/api/modules")
            if (response.ok) {
                const data = await response.json()
                setModules(data)
            }
        } catch (error) {
            console.error("Error fetching modules:", error)
            toast.error("Error al cargar los módulos")
        }
    }

    const fetchRolePermissions = async (roleId: string) => {
        setLoading(true)
        try {
            const response = await fetch(`/api/roles/${roleId}/permissions`)
            if (response.ok) {
                const data: { id: number }[] = await response.json()
                const permissionIds = new Set(data.map(p => p.id))
                setRolePermissions(permissionIds)
            }
        } catch (error) {
            console.error("Error fetching role permissions:", error)
            toast.error("Error al cargar los permisos", {
                description: "Por favor, intenta nuevamente."
            })
        } finally {
            setLoading(false)
        }
    }

    const handlePermissionChange = (permissionId: number, checked: boolean) => {
        const newPermissions = new Set(rolePermissions)
        if (checked) {
            newPermissions.add(permissionId)
        } else {
            newPermissions.delete(permissionId)
        }
        setRolePermissions(newPermissions)
    }

    const handleSave = async () => {
        if (!selectedRoleId) return

        setSaving(true)
        const loadingToast = toast.loading("Actualizando permisos...")

        try {
            const response = await fetch(`/api/roles/${selectedRoleId}/permissions`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    permissions: Array.from(rolePermissions)
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Error al actualizar permisos")
            }

            const selectedRole = roles.find(r => r.id.toString() === selectedRoleId)

            toast.dismiss(loadingToast)
            toast.success("Permisos actualizados correctamente", {
                description: `Los permisos para ${selectedRole?.displayName} han sido actualizados.`,
                icon: <Key className="h-4 w-4" />,
                duration: 5000,
            })
        } catch (error) {
            toast.dismiss(loadingToast)
            toast.error(
                error instanceof Error ? error.message : "Error al actualizar permisos",
                {
                    description: "Por favor, verifica los datos e intenta nuevamente.",
                    duration: 5000,
                }
            )
        } finally {
            setSaving(false)
        }
    }

    const getActionLabel = (action: string) => {
        const labels: { [key: string]: string } = {
            create: "Crear",
            read: "Ver",
            update: "Editar",
            delete: "Eliminar",
            export: "Exportar",
            import: "Importar"
        }
        return labels[action] || action
    }

    const getActionColor = (action: string) => {
        const colors: { [key: string]: string } = {
            create: "text-green-600",
            read: "text-blue-600",
            update: "text-amber-600",
            delete: "text-red-600",
            export: "text-purple-600",
            import: "text-indigo-600"
        }
        return colors[action] || "text-gray-600"
    }

    const getModulePermissionStats = (module: Module) => {
        const total = module.permissions.length
        const granted = module.permissions.filter(p => rolePermissions.has(p.id)).length
        return { total, granted }
    }

    return (
        <div className="space-y-6">
            {/* Header responsivo */}
            <div>
                <h2 className="text-lg sm:text-xl font-semibold mb-4">Asignar Permisos a Roles</h2>

                {/* Selector y botón responsivos */}
                <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
                    <div className="flex-1 sm:max-w-md">
                        <label className="block text-sm font-medium mb-2">
                            Selecciona un rol
                        </label>
                        <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecciona un rol..." />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((role) => (
                                    <SelectItem key={role.id} value={role.id.toString()}>
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4" />
                                            <span className="truncate">{role.displayName}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedRoleId && (
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full sm:w-auto"
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            <span className="text-sm sm:text-base">
                                {saving ? "Guardando..." : "Guardar Cambios"}
                            </span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Contenido de permisos */}
            {selectedRoleId && (
                <div className="space-y-4 sm:space-y-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                                <p className="text-sm text-gray-500">Cargando permisos...</p>
                            </div>
                        </div>
                    ) : modules.length === 0 ? (
                        <div className="text-center py-12">
                            <Key className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-gray-500">No hay módulos con permisos disponibles</p>
                        </div>
                    ) : (
                        modules.map((module) => {
                            const stats = getModulePermissionStats(module)
                            return (
                                <Card key={module.id} className="overflow-hidden">
                                    <CardHeader className="pb-3 sm:pb-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-base sm:text-lg">
                                                    {module.displayName}
                                                </CardTitle>
                                                <CardDescription className="text-sm">
                                                    Permisos para el módulo {module.name}
                                                </CardDescription>
                                            </div>

                                            {/* Estadísticas del módulo */}
                                            <div className="flex items-center gap-2 text-sm">
                                                <div className="flex items-center gap-1">
                                                    {stats.granted === stats.total ? (
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                    ) : stats.granted > 0 ? (
                                                        <div className="h-4 w-4 rounded-full bg-amber-500" />
                                                    ) : (
                                                        <Circle className="h-4 w-4 text-gray-400" />
                                                    )}
                                                    <span className="text-xs sm:text-sm font-medium">
                                                        {stats.granted}/{stats.total}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="pt-0">
                                        {module.permissions.length === 0 ? (
                                            <div className="text-center py-6 text-gray-500 text-sm">
                                                No hay permisos configurados para este módulo
                                            </div>
                                        ) : (
                                            <>
                                                {/* Vista desktop: grid */}
                                                <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                    {module.permissions.map((permission) => (
                                                        <div key={permission.id} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`perm-${permission.id}`}
                                                                checked={rolePermissions.has(permission.id)}
                                                                onCheckedChange={(checked) =>
                                                                    handlePermissionChange(permission.id, checked as boolean)
                                                                }
                                                            />
                                                            <label
                                                                htmlFor={`perm-${permission.id}`}
                                                                className={`text-sm font-medium leading-none cursor-pointer ${getActionColor(permission.action)}`}
                                                            >
                                                                {getActionLabel(permission.action)}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Vista móvil: lista vertical */}
                                                <div className="sm:hidden space-y-3">
                                                    {module.permissions.map((permission) => (
                                                        <div key={permission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                            <label
                                                                htmlFor={`perm-mobile-${permission.id}`}
                                                                className="flex items-center space-x-3 cursor-pointer flex-1"
                                                            >
                                                                <Checkbox
                                                                    id={`perm-mobile-${permission.id}`}
                                                                    checked={rolePermissions.has(permission.id)}
                                                                    onCheckedChange={(checked) =>
                                                                        handlePermissionChange(permission.id, checked as boolean)
                                                                    }
                                                                />
                                                                <div>
                                                                    <div className={`font-medium text-sm ${getActionColor(permission.action)}`}>
                                                                        {getActionLabel(permission.action)}
                                                                    </div>
                                                                    {permission.description && (
                                                                        <div className="text-xs text-gray-500 mt-1">
                                                                            {permission.description}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })
                    )}

                    {/* Resumen en móviles */}
                    {!loading && modules.length > 0 && (
                        <div className="sm:hidden">
                            <Card className="bg-blue-50 border-blue-200">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 text-sm text-blue-800">
                                        <Key className="h-4 w-4" />
                                        <span>
                                            {rolePermissions.size} permisos asignados en total
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            )}

            {/* Instrucciones cuando no hay rol seleccionado */}
            {!selectedRoleId && (
                <div className="text-center py-12">
                    <Key className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 text-sm sm:text-base">
                        Selecciona un rol para ver y gestionar sus permisos
                    </p>
                </div>
            )}
        </div>
    )
}