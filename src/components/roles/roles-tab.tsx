// src/components/roles/roles-tab.tsx
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Shield, Users, Loader2, Edit, Trash, MoreHorizontal } from "lucide-react"
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

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
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [selectedRole, setSelectedRole] = useState<Role | null>(null)
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)

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

    const handleDelete = async () => {
        if (!roleToDelete) return

        const loadingToast = toast.loading("Eliminando rol...")

        try {
            const response = await fetch(`/api/roles/${roleToDelete.id}`, {
                method: "DELETE"
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Error al eliminar rol")
            }

            toast.dismiss(loadingToast)
            toast.success("Rol eliminado", {
                description: `${roleToDelete.displayName} ha sido eliminado exitosamente.`,
                icon: <Trash className="h-4 w-4" />,
                duration: 5000,
            })

            fetchRoles()
            setDeleteDialogOpen(false)
            setRoleToDelete(null)
        } catch (error) {
            toast.dismiss(loadingToast)
            toast.error(
                error instanceof Error ? error.message : "Error al eliminar rol",
                {
                    description: "Por favor, intenta nuevamente.",
                    duration: 5000,
                }
            )
            console.error("Error deleting role:", error)
        }
    }

    const openDeleteDialog = (role: Role) => {
        setRoleToDelete(role)
        setDeleteDialogOpen(true)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div>
            {/* Header responsivo */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
                <h2 className="text-lg sm:text-xl font-semibold">Gestión de Roles</h2>
                <Button
                    onClick={() => setCreateDialogOpen(true)}
                    className="w-full sm:w-auto"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Rol
                </Button>
            </div>

            <div className="bg-white">
                {/* Vista de tabla para desktop */}
                <div className="hidden md:block rounded-md border">
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
                            {roles.length === 0 ? (
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
                                                            onClick={() => openDeleteDialog(role)}
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

                {/* Vista de tarjetas para móviles */}
                <div className="md:hidden space-y-4">
                    {roles.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p>No hay roles disponibles</p>
                        </div>
                    ) : (
                        roles.map((role) => (
                            <div key={role.id} className="border rounded-lg p-4 bg-white shadow-sm">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Shield className={`h-4 w-4 ${role.isSystem ? 'text-blue-600' : 'text-gray-400'}`} />
                                            <h3 className="font-medium text-base">
                                                {role.displayName}
                                            </h3>
                                        </div>
                                        <div className="text-sm text-gray-600 mb-2">
                                            <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                                                {role.name}
                                            </code>
                                        </div>
                                        {role.description && (
                                            <p className="text-sm text-gray-600 mb-2">
                                                {role.description}
                                            </p>
                                        )}
                                    </div>
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
                                                    onClick={() => openDeleteDialog(role)}
                                                    className="text-red-600"
                                                >
                                                    <Trash className="mr-2 h-4 w-4" />
                                                    Eliminar
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="space-y-2">
                                    {/* Información del rol */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Badge
                                                variant={role.isSystem ? "secondary" : "default"}
                                                className="text-xs"
                                            >
                                                {role.isSystem ? "Sistema" : "Personalizado"}
                                            </Badge>
                                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                                <Users className="h-3 w-3" />
                                                <span>{role._count.users} usuarios</span>
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Prioridad: {role.priority}
                                        </div>
                                    </div>

                                    {/* Botones de acción rápida en móviles */}
                                    <div className="flex gap-2 pt-2 border-t">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 text-xs"
                                            onClick={() => {
                                                setSelectedRole(role)
                                                setEditDialogOpen(true)
                                            }}
                                        >
                                            <Edit className="h-3 w-3 mr-1" />
                                            Editar
                                        </Button>
                                        {!role.isSystem && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 text-xs text-red-600 hover:text-red-700"
                                                onClick={() => openDeleteDialog(role)}
                                            >
                                                <Trash className="h-3 w-3 mr-1" />
                                                Eliminar
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Indicador visual para roles del sistema */}
                                {role.isSystem && (
                                    <div className="mt-2 pt-2 border-t">
                                        <div className="flex items-center gap-1 text-xs text-blue-600">
                                            <Shield className="h-3 w-3" />
                                            <span>Rol del sistema - No se puede eliminar</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
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

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente el rol
                            <span className="font-semibold"> {roleToDelete?.displayName}</span>
                            {roleToDelete && roleToDelete._count.users > 0 && (
                                <span className="block mt-2 text-red-600">
                                    ⚠️ Este rol tiene {roleToDelete._count.users} usuario(s) asignado(s).
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}