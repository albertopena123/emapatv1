// src/components/users/users-table.tsx
"use client"

import { useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { MoreHorizontal, Pencil, UserX, UserCheck } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { EditUserDialog } from "./edit-user-dialog"
import { toast } from "sonner"

// src/components/users/users-table.tsx
interface User {
    id: string
    name: string | null
    email: string | null
    dni: string
    isActive: boolean
    isSuperAdmin: boolean
    fechaNacimiento: string | null
    sexo: string | null
    ubigeoNac: string | null
    direccion: string | null
    role: {
        id: number
        displayName: string
    } | null
    createdAt: string
    lastLogin: string | null
}

interface UsersTableProps {
    users: User[]
    loading: boolean
    onUserUpdated: () => void
}

export function UsersTable({ users, loading, onUserUpdated }: UsersTableProps) {
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [editDialogOpen, setEditDialogOpen] = useState(false)

    const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
        const loadingToast = toast.loading(
            currentStatus ? "Desactivando usuario..." : "Activando usuario..."
        )

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    isActive: !currentStatus
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Error al actualizar estado")
            }

            toast.dismiss(loadingToast)
            toast.success(
                currentStatus ? "Usuario desactivado" : "Usuario activado",
                {
                    description: currentStatus
                        ? "El usuario ya no puede iniciar sesión"
                        : "El usuario ahora puede iniciar sesión",
                    icon: currentStatus ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />,
                    duration: 5000,
                }
            )

            onUserUpdated()
        } catch (error) {
            toast.dismiss(loadingToast)
            toast.error(
                error instanceof Error ? error.message : "Error al cambiar estado",
                {
                    description: "Por favor, intenta nuevamente.",
                    duration: 5000,
                }
            )
            console.error("Error toggling user status:", error)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground">Cargando usuarios...</p>
            </div>
        )
    }

    return (
        <>
            {/* Vista móvil - Cards */}
            <div className="block lg:hidden space-y-4">
                {users.map((user) => (
                    <Card key={user.id}>
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div className="space-y-1">
                                    <h3 className="font-medium text-base">
                                        {user.name || "Sin nombre"}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        DNI: {user.dni}
                                    </p>
                                    {user.email && (
                                        <p className="text-sm text-muted-foreground break-all">
                                            {user.email}
                                        </p>
                                    )}
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <span className="sr-only">Abrir menú</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => {
                                                setSelectedUser(user)
                                                setEditDialogOpen(true)
                                            }}
                                        >
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => handleToggleStatus(user.id, user.isActive)}
                                        >
                                            {user.isActive ? (
                                                <>
                                                    <UserX className="mr-2 h-4 w-4" />
                                                    Desactivar
                                                </>
                                            ) : (
                                                <>
                                                    <UserCheck className="mr-2 h-4 w-4" />
                                                    Activar
                                                </>
                                            )}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="flex flex-wrap gap-2 items-center">
                                <Badge variant={user.isActive ? "default" : "secondary"}>
                                    {user.isActive ? "Activo" : "Inactivo"}
                                </Badge>
                                {user.isSuperAdmin && (
                                    <Badge variant="secondary">
                                        Super Admin
                                    </Badge>
                                )}
                                {user.role && (
                                    <Badge variant="outline">
                                        {user.role.displayName}
                                    </Badge>
                                )}
                            </div>

                            <div className="mt-3 text-xs text-muted-foreground">
                                Último ingreso: {user.lastLogin
                                    ? format(new Date(user.lastLogin), "dd/MM/yyyy HH:mm", { locale: es })
                                    : "Nunca"}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Vista desktop - Tabla */}
            <div className="hidden lg:block rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>DNI</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Último ingreso</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">
                                    {user.name || "Sin nombre"}
                                    {user.isSuperAdmin && (
                                        <Badge variant="secondary" className="ml-2">
                                            Super Admin
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell>{user.dni}</TableCell>
                                <TableCell>{user.email || "-"}</TableCell>
                                <TableCell>{user.role?.displayName || "-"}</TableCell>
                                <TableCell>
                                    <Badge variant={user.isActive ? "default" : "secondary"}>
                                        {user.isActive ? "Activo" : "Inactivo"}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {user.lastLogin
                                        ? format(new Date(user.lastLogin), "dd/MM/yyyy HH:mm", { locale: es })
                                        : "Nunca"}
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Abrir menú</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    setSelectedUser(user)
                                                    setEditDialogOpen(true)
                                                }}
                                            >
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleToggleStatus(user.id, user.isActive)}
                                            >
                                                {user.isActive ? (
                                                    <>
                                                        <UserX className="mr-2 h-4 w-4" />
                                                        Desactivar
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserCheck className="mr-2 h-4 w-4" />
                                                        Activar
                                                    </>
                                                )}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {users.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-muted-foreground">No se encontraron usuarios</p>
                </div>
            )}

            <EditUserDialog
                user={selectedUser}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                onUserUpdated={() => {
                    onUserUpdated()
                    setEditDialogOpen(false)
                    setSelectedUser(null)
                }}
            />
        </>
    )
}