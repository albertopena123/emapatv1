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
import { MoreHorizontal, Pencil, UserX, UserCheck, Loader2, Key, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { EditUserDialog } from "./edit-user-dialog"
import { ResetPasswordDialog } from "./reset-password-dialog"
import { toast } from "sonner"
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
    permissions?: {
        canEdit: boolean
        canDelete: boolean
    }
}

export function UsersTable({ users, loading, onUserUpdated, permissions }: UsersTableProps) {
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null)
    const [deletingUser, setDeletingUser] = useState<User | null>(null)
    const [processingId, setProcessingId] = useState<string | null>(null)

    const hasActions = permissions?.canEdit || permissions?.canDelete

    const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
        if (!permissions?.canEdit) return

        setProcessingId(userId)
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
        } finally {
            setProcessingId(null)
        }
    }

    const handleDelete = async () => {
        if (!deletingUser) return

        try {
            const response = await fetch(`/api/users/${deletingUser.id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                toast.success('Usuario eliminado exitosamente')
                onUserUpdated()
            } else {
                const error = await response.json()
                toast.error(error.error || 'Error al eliminar usuario')
            }
        } catch (error) {
            toast.error('Error al eliminar usuario')
        } finally {
            setDeletingUser(null)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
                                {hasActions && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                disabled={processingId === user.id}
                                            >
                                                <span className="sr-only">Abrir menú</span>
                                                {processingId === user.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <MoreHorizontal className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            {permissions?.canEdit && (
                                                <>
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
                                                        onClick={() => setResetPasswordUser(user)}
                                                    >
                                                        <Key className="mr-2 h-4 w-4" />
                                                        Restablecer contraseña
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
                                                </>
                                            )}
                                            {permissions?.canDelete && (
                                                <>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => setDeletingUser(user)}
                                                        className="text-red-600"
                                                        disabled={user.isSuperAdmin}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Eliminar
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
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
                            {hasActions && (
                                <TableHead className="text-right">Acciones</TableHead>
                            )}
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
                                {hasActions && (
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0"
                                                    disabled={processingId === user.id}
                                                >
                                                    <span className="sr-only">Abrir menú</span>
                                                    {processingId === user.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                {permissions?.canEdit && (
                                                    <>
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
                                                            onClick={() => setResetPasswordUser(user)}
                                                        >
                                                            <Key className="mr-2 h-4 w-4" />
                                                            Restablecer contraseña
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
                                                    </>
                                                )}
                                                {permissions?.canDelete && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => setDeletingUser(user)}
                                                            className="text-red-600"
                                                            disabled={user.isSuperAdmin}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Eliminar
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                )}
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

            {permissions?.canEdit && (
                <>
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

                    {resetPasswordUser && (
                        <ResetPasswordDialog
                            user={resetPasswordUser}
                            open={!!resetPasswordUser}
                            onOpenChange={(open) => !open && setResetPasswordUser(null)}
                            onPasswordReset={() => {
                                setResetPasswordUser(null)
                            }}
                        />
                    )}
                </>
            )}

            {/* Dialog de confirmación de eliminación */}
            <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente la cuenta del usuario
                            <span className="font-semibold"> {deletingUser?.name || deletingUser?.dni}</span> y
                            todos sus datos asociados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}