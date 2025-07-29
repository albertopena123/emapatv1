// src/components/auth/permission-guard.tsx
"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface PermissionGuardProps {
    module?: string
    action?: string
    resource?: string
    requireAll?: boolean
    permissions?: Array<{
        module: string
        action: string
        resource: string
    }>
    fallback?: React.ReactNode
    children: React.ReactNode
}

export function PermissionGuard({
    module,
    action,
    resource,
    permissions,
    requireAll = false,
    fallback,
    children
}: PermissionGuardProps) {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        checkPermission()
    }, [module, action, resource, permissions])

    const checkPermission = async () => {
        try {
            // Construir los permisos a verificar
            const permissionsToCheck = permissions ||
                (module && action && resource ? [{ module, action, resource }] : [])

            if (permissionsToCheck.length === 0) {
                // Si no hay permisos específicos, solo verificar autenticación
                const res = await fetch('/api/auth/me')
                setHasPermission(res.ok)
                setLoading(false)
                return
            }

            const res = await fetch('/api/auth/check-permissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    permissions: permissionsToCheck,
                    requireAll
                })
            })

            if (!res.ok) {
                setHasPermission(false)
            } else {
                const data = await res.json()
                setHasPermission(data.hasPermission)
            }
        } catch (error) {
            console.error('Error verificando permisos:', error)
            setHasPermission(false)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!hasPermission) {
        if (fallback) {
            return <>{fallback}</>
        }
        return (
            <div className="rounded-lg bg-destructive/10 p-6 text-center">
                <p className="text-sm text-destructive">
                    No tienes permisos para ver este contenido
                </p>
            </div>
        )
    }

    return <>{children}</>
}

// Hook para usar en componentes
export function usePermissions() {
    const [permissions, setPermissions] = useState<{
        modules: string[]
        permissions: Array<{
            module: string
            action: string
            resource: string
        }>
        isSuperAdmin: boolean
    } | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchPermissions()
    }, [])

    const fetchPermissions = async () => {
        try {
            const res = await fetch('/api/auth/permissions')
            if (res.ok) {
                const data = await res.json()
                setPermissions(data)
            }
        } catch (error) {
            console.error('Error fetching permissions:', error)
        } finally {
            setLoading(false)
        }
    }

    const hasModule = (moduleName: string): boolean => {
        if (!permissions) return false
        return permissions.isSuperAdmin || permissions.modules.includes(moduleName)
    }

    const hasPermission = (module: string, action: string, resource: string): boolean => {
        if (!permissions) return false
        if (permissions.isSuperAdmin) return true

        return permissions.permissions.some(p =>
            p.module === module && p.action === action && p.resource === resource
        )
    }

    return {
        permissions,
        loading,
        hasModule,
        hasPermission,
        isSuperAdmin: permissions?.isSuperAdmin || false
    }
}