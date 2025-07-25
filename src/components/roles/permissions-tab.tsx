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
import { Save, Shield } from "lucide-react"

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
        try {
            const response = await fetch(`/api/roles/${selectedRoleId}/permissions`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    permissions: Array.from(rolePermissions)
                })
            })

            if (response.ok) {
                alert("Permisos actualizados correctamente")
            }
        } catch (error) {
            console.error("Error saving permissions:", error)
            alert("Error al guardar permisos")
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

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Asignar Permisos a Roles</h2>
                <div className="flex gap-4 items-end">
                    <div className="w-96">
                        <label className="block text-sm font-medium mb-2">
                            Selecciona un rol
                        </label>
                        <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un rol..." />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((role) => (
                                    <SelectItem key={role.id} value={role.id.toString()}>
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4" />
                                            {role.displayName}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {selectedRoleId && (
                        <Button onClick={handleSave} disabled={saving}>
                            <Save className="h-4 w-4 mr-2" />
                            {saving ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                    )}
                </div>
            </div>

            {selectedRoleId && (
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-8">Cargando permisos...</div>
                    ) : (
                        modules.map((module) => (
                            <Card key={module.id}>
                                <CardHeader>
                                    <CardTitle className="text-lg">{module.displayName}</CardTitle>
                                    <CardDescription>
                                        Permisos para el módulo {module.name}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                >
                                                    {getActionLabel(permission.action)}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}