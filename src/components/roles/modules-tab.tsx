// src/components/roles/modules-tab.tsx
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
import { Card, CardContent } from "@/components/ui/card"
import { Save, Shield, Loader2 } from "lucide-react"
import * as Icons from "lucide-react"
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
    icon?: string
}

export function ModulesTab() {
    const [roles, setRoles] = useState<Role[]>([])
    const [modules, setModules] = useState<Module[]>([])
    const [selectedRoleId, setSelectedRoleId] = useState<string>("")
    const [roleModules, setRoleModules] = useState<Set<number>>(new Set())
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchRoles()
        fetchModules()
    }, [])

    useEffect(() => {
        if (selectedRoleId) {
            fetchRoleModules(selectedRoleId)
        }
    }, [selectedRoleId])

    const fetchRoles = async () => {
        const response = await fetch("/api/roles")
        if (response.ok) {
            const data = await response.json()
            setRoles(data)
        }
    }

    const fetchModules = async () => {
        const response = await fetch("/api/modules")
        if (response.ok) {
            const data = await response.json()
            setModules(data)
        }
    }

    const fetchRoleModules = async (roleId: string) => {
        setLoading(true)
        try {
            const response = await fetch(`/api/roles/${roleId}/modules`)
            if (response.ok) {
                const data: { id: number }[] = await response.json()
                const moduleIds = new Set(data.map(m => m.id))
                setRoleModules(moduleIds)
            }
        } catch (error) {
            toast.error("Error al cargar los módulos", {
                description: "Por favor, intenta nuevamente."
            })
        } finally {
            setLoading(false)
        }
    }

    const handleModuleChange = (moduleId: number, checked: boolean) => {
        const newModules = new Set(roleModules)
        if (checked) {
            newModules.add(moduleId)
        } else {
            newModules.delete(moduleId)
        }
        setRoleModules(newModules)
    }

    const handleSave = async () => {
        if (!selectedRoleId) return

        setSaving(true)
        const loadingToast = toast.loading("Actualizando módulos...")

        try {
            const response = await fetch(`/api/roles/${selectedRoleId}/modules`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    modules: Array.from(roleModules)
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Error al actualizar módulos")
            }

            const selectedRole = roles.find(r => r.id.toString() === selectedRoleId)

            toast.dismiss(loadingToast)
            toast.success("Módulos actualizados correctamente", {
                description: `Los módulos para ${selectedRole?.displayName} han sido actualizados.`,
                icon: <Shield className="h-4 w-4" />,
                duration: 5000,
            })
        } catch (error) {
            toast.dismiss(loadingToast)
            toast.error(
                error instanceof Error ? error.message : "Error al actualizar módulos",
                {
                    description: "Por favor, verifica los datos e intenta nuevamente.",
                    duration: 5000,
                }
            )
        } finally {
            setSaving(false)
        }
    }

    const getIcon = (iconName?: string) => {
        if (!iconName) return null

        switch (iconName) {
            case 'Home': return <Icons.Home className="h-4 w-4 sm:h-5 sm:w-5" />
            case 'Users': return <Icons.Users className="h-4 w-4 sm:h-5 sm:w-5" />
            case 'MapPin': return <Icons.MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
            case 'Calculator': return <Icons.Calculator className="h-4 w-4 sm:h-5 sm:w-5" />
            case 'Shield': return <Icons.Shield className="h-4 w-4 sm:h-5 sm:w-5" />
            case 'Cpu': return <Icons.Cpu className="h-4 w-4 sm:h-5 sm:w-5" />
            case 'Map': return <Icons.Map className="h-4 w-4 sm:h-5 sm:w-5" />
            case 'Droplet': return <Icons.Droplet className="h-4 w-4 sm:h-5 sm:w-5" />
            case 'DollarSign': return <Icons.DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
            case 'Bell': return <Icons.Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            case 'Wrench': return <Icons.Wrench className="h-4 w-4 sm:h-5 sm:w-5" />
            case 'FileText': return <Icons.FileText className="h-4 w-4 sm:h-5 sm:w-5" />
            case 'Settings': return <Icons.Settings className="h-4 w-4 sm:h-5 sm:w-5" />
            case 'Gauge': return <Icons.Gauge className="h-4 w-4 sm:h-5 sm:w-5" />
            case 'Receipt': return <Icons.Receipt className="h-4 w-4 sm:h-5 sm:w-5" />
            default: return null
        }
    }

    return (
        <div className="space-y-6">
            {/* Header responsivo */}
            <div>
                <h2 className="text-lg sm:text-xl font-semibold mb-4">Asignar Módulos a Roles</h2>

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

            {/* Contenido de módulos */}
            {selectedRoleId && (
                <div>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                                <p className="text-sm text-gray-500">Cargando módulos...</p>
                            </div>
                        </div>
                    ) : modules.length === 0 ? (
                        <div className="text-center py-12">
                            <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-gray-500">No hay módulos disponibles</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                            {modules.map((module) => (
                                <Card
                                    key={module.id}
                                    className="hover:shadow-md transition-shadow duration-200"
                                >
                                    <CardContent className="p-4 sm:p-6">
                                        <div className="flex items-center space-x-3">
                                            <Checkbox
                                                id={`module-${module.id}`}
                                                checked={roleModules.has(module.id)}
                                                onCheckedChange={(checked) =>
                                                    handleModuleChange(module.id, checked as boolean)
                                                }
                                                className="flex-shrink-0"
                                            />
                                            <label
                                                htmlFor={`module-${module.id}`}
                                                className="flex items-center gap-2 sm:gap-3 cursor-pointer flex-1 min-w-0"
                                            >
                                                <div className="flex-shrink-0 text-gray-600">
                                                    {getIcon(module.icon)}
                                                </div>
                                                <span className="font-medium text-sm sm:text-base truncate">
                                                    {module.displayName}
                                                </span>
                                            </label>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Información adicional en móviles */}
                    {!loading && modules.length > 0 && (
                        <div className="mt-6 sm:hidden">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 text-sm text-blue-800">
                                    <Shield className="h-4 w-4" />
                                    <span>
                                        {roleModules.size} de {modules.length} módulos seleccionados
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Instrucciones cuando no hay rol seleccionado */}
            {!selectedRoleId && (
                <div className="text-center py-12">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 text-sm sm:text-base">
                        Selecciona un rol para ver y gestionar sus módulos
                    </p>
                </div>
            )}
        </div>
    )
}