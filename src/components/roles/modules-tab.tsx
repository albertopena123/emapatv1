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
import { Save, Shield } from "lucide-react"
import * as Icons from "lucide-react"

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
        try {
            const response = await fetch(`/api/roles/${selectedRoleId}/modules`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    modules: Array.from(roleModules)
                })
            })

            if (response.ok) {
                alert("Módulos actualizados correctamente")
            }
        } finally {
            setSaving(false)
        }
    }

    const getIcon = (iconName?: string) => {
        if (!iconName) return null

        switch (iconName) {
            case 'Home': return <Icons.Home className="h-5 w-5" />
            case 'Users': return <Icons.Users className="h-5 w-5" />
            case 'Shield': return <Icons.Shield className="h-5 w-5" />
            case 'Cpu': return <Icons.Cpu className="h-5 w-5" />
            case 'DollarSign': return <Icons.DollarSign className="h-5 w-5" />
            case 'FileText': return <Icons.FileText className="h-5 w-5" />
            case 'Settings': return <Icons.Settings className="h-5 w-5" />
            default: return null
        }
    }

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Asignar Módulos a Roles</h2>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loading ? (
                        <div className="col-span-full text-center py-8">Cargando módulos...</div>
                    ) : (
                        modules.map((module) => (
                            <Card key={module.id}>
                                <CardContent className="p-6">
                                    <div className="flex items-center space-x-3">
                                        <Checkbox
                                            id={`module-${module.id}`}
                                            checked={roleModules.has(module.id)}
                                            onCheckedChange={(checked) =>
                                                handleModuleChange(module.id, checked as boolean)
                                            }
                                        />
                                        <label
                                            htmlFor={`module-${module.id}`}
                                            className="flex items-center gap-3 cursor-pointer flex-1"
                                        >
                                            {getIcon(module.icon)}
                                            <span className="font-medium">{module.displayName}</span>
                                        </label>
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