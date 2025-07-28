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
import { MoreHorizontal, Pencil, UserX, UserCheck } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { EditUserDialog } from "./edit-user-dialog"
import { toast } from "sonner"

interface User {
    id: string
    name: string | null
    email: string | null
    dni: string
    isActive: boolean
    isSuperAdmin: boolean
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
        return <div>Cargando usuarios...</div>
    }

    return (
        <>
            <div className="rounded-md border">
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