// src/app/(protected)/users/page.tsx
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Search, Shield } from "lucide-react"
import { Input } from "@/components/ui/input"
import { UsersTable } from "@/components/users/users-table"
import { CreateUserDialog } from "@/components/users/create-user-dialog"
import { usePermissions, PermissionGuard } from "@/components/auth/permission-guard"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ExportButton } from "@/components/users/export-button"

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

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [createDialogOpen, setCreateDialogOpen] = useState(false)

    // Hook de permisos
    const { hasPermission, loading: permissionsLoading } = usePermissions()

    // Verificar permisos específicos
    const canCreateUsers = hasPermission('users', 'create', 'users')
    const canViewUsers = hasPermission('users', 'read', 'users')
    const canEditUsers = hasPermission('users', 'update', 'users')
    const canDeleteUsers = hasPermission('users', 'delete', 'users')
    const canExportUsers = hasPermission('users', 'export', 'users')

    const fetchUsers = async () => {
        try {
            const response = await fetch("/api/users")
            if (response.ok) {
                const data = await response.json()
                setUsers(data)
            }
        } catch (error) {
            console.error("Error fetching users:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        // Solo cargar usuarios si tiene permisos de lectura
        if (!permissionsLoading && canViewUsers) {
            fetchUsers()
        } else if (!permissionsLoading && !canViewUsers) {
            setLoading(false)
        }
    }, [permissionsLoading, canViewUsers])

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.dni.includes(searchTerm)
    )

    // Si no tiene permisos de lectura, mostrar mensaje
    if (!permissionsLoading && !canViewUsers) {
        return (
            <div className="p-8">
                <Alert className="max-w-2xl mx-auto">
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                        No tienes permisos para ver los usuarios del sistema.
                        Contacta a un administrador si necesitas acceso.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-full">
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold">Usuarios</h1>
                <p className="text-sm sm:text-base text-gray-600">Gestiona los usuarios del sistema</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
                <div className="relative w-full sm:w-auto sm:min-w-[300px] lg:min-w-[384px]">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Buscar por nombre, email o DNI..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full"
                    />
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    {/* Botón de crear solo si tiene permisos */}
                    {canCreateUsers && (
                        <Button
                            onClick={() => setCreateDialogOpen(true)}
                            className="flex-1 sm:flex-initial"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Nuevo Usuario
                        </Button>
                    )}

                    {/* Botón de exportar con guard de permisos */}
                    <PermissionGuard
                        module="users"
                        action="export"
                        resource="users"
                        fallback={null}
                    >
                        <ExportButton />
                    </PermissionGuard>
                </div>
            </div>

            {/* Tabla con permisos */}
            <div className="w-full">
                <UsersTable
                    users={filteredUsers}
                    loading={loading || permissionsLoading}
                    onUserUpdated={fetchUsers}
                    // Pasar permisos a la tabla
                    permissions={{
                        canEdit: canEditUsers,
                        canDelete: canDeleteUsers
                    }}
                />
            </div>

            <CreateUserDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onUserCreated={() => {
                    fetchUsers()
                    setCreateDialogOpen(false)
                }}
            />
        </div>
    )
}