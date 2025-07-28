// src/app/(protected)/users/page.tsx
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { UsersTable } from "@/components/users/users-table"
import { CreateUserDialog } from "@/components/users/create-user-dialog"

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

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [createDialogOpen, setCreateDialogOpen] = useState(false)

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
        fetchUsers()
    }, [])

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.dni.includes(searchTerm)
    )

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
                <Button
                    onClick={() => setCreateDialogOpen(true)}
                    className="w-full sm:w-auto"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Usuario
                </Button>
            </div>

            {/* Contenedor simplificado para la tabla responsiva */}
            <div className="w-full">
                <UsersTable
                    users={filteredUsers}
                    loading={loading}
                    onUserUpdated={fetchUsers}
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