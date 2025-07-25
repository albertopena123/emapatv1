// src/components/roles/roles-tab.tsx
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Shield, Users } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CreateRoleDialog } from "./create-role-dialog"
import { EditRoleDialog } from "./edit-role-dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash } from "lucide-react"

interface Role {
    id: number
    name: string
    displayName: string
    description: string | null
    isSystem: boolean
    priority: number
    _count: {
        users: number
    }
}

export function RolesTab() {
    const [roles, setRoles] = useState<Role[]>([])
    const [loading, setLoading] = useState(true)
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [selectedRole, setSelectedRole] = useState<Role | null>(null)

    const fetchRoles = async () => {
        try {
            const response = await fetch("/api/roles")
            if (response.ok) {
                const data = await response.json()
                setRoles(data)
            }
        } catch (error) {
            console.error("Error fetching roles:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRoles()
    }, [])

    const handleDelete = async (roleId: number) => {
        if (!confirm("¿Estás seguro de eliminar este rol?")) return

        try {
            const response = await fetch(`/api/roles/${roleId}`, {
                method: "DELETE"
            })

            if (response.ok) {
                fetchRoles()
            }
        } catch (error) {
            console.error("Error deleting role:", error)
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Gestión de Roles</h2>
                <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Rol
                </Button>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Rol</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead>Usuarios</TableHead>
                            <TableHead>Prioridad</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    Cargando...
                                </TableCell>
                            </TableRow>
                        ) : roles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    No hay roles disponibles
                                </TableCell>
                            </TableRow>
                        ) : (
                            roles.map((role) => (
                                <TableRow key={role.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-gray-400" />
                                            <div>
                                                <div className="font-medium">{role.displayName}</div>
                                                <div className="text-sm text-gray-500">{role.name}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{role.description || "-"}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Users className="h-4 w-4 text-gray-400" />
                                            {role._count.users}
                                        </div>
                                    </TableCell>
                                    <TableCell>{role.priority}</TableCell>
                                    <TableCell>
                                        <Badge variant={role.isSystem ? "secondary" : "default"}>
                                            {role.isSystem ? "Sistema" : "Personalizado"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setSelectedRole(role)
                                                        setEditDialogOpen(true)
                                                    }}
                                                >
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                                {!role.isSystem && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(role.id)}
                                                        className="text-red-600"
                                                    >
                                                        <Trash className="mr-2 h-4 w-4" />
                                                        Eliminar
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <CreateRoleDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onRoleCreated={() => {
                    fetchRoles()
                    setCreateDialogOpen(false)
                }}
            />

            <EditRoleDialog
                role={selectedRole}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                onRoleUpdated={() => {
                    fetchRoles()
                    setEditDialogOpen(false)
                    setSelectedRole(null)
                }}
            />
        </div>
    )
}