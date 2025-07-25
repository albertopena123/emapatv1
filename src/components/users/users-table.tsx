// src/components/users/users-table.tsx
"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    MoreHorizontal,
    Edit,
    UserCheck,
    UserX,
    Shield,
    Loader2
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { useState } from "react"
import { EditUserDialog } from "./edit-user-dialog"

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
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)

    const handleToggleStatus = async (userId: string, isActive: boolean) => {
        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !isActive })
            })

            if (response.ok) {
                onUserUpdated()
            }
        } catch (error) {
            console.error("Error updating user:", error)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="rounded-md border bg-white">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>DNI</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Último acceso</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                No se encontraron usuarios
                            </TableCell>
                        </TableRow>
                    ) : (
                        users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div>
                                        <div className="font-medium">{user.name || "Sin nombre"}</div>
                                        <div className="text-sm text-gray-500">{user.email || "Sin email"}</div>
                                    </div>
                                </TableCell>
                                <TableCell>{user.dni}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {user.isSuperAdmin && (
                                            <Shield className="h-4 w-4 text-yellow-600" />
                                        )}
                                        <span>{user.role?.displayName || "Sin rol"}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.isActive ? "default" : "secondary"}>
                                        {user.isActive ? "Activo" : "Inactivo"}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {user.lastLogin ? (
                                        formatDistanceToNow(new Date(user.lastLogin), {
                                            addSuffix: true,
                                            locale: es
                                        })
                                    ) : (
                                        <span className="text-gray-400">Nunca</span>
                                    )}
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
                                                    setSelectedUser(user)
                                                    setEditDialogOpen(true)
                                                }}
                                            >
                                                <Edit className="mr-2 h-4 w-4" />
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
                        ))
                    )}
                </TableBody>
            </Table>

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
        </div>
    )
}