// src/lib/permissions.ts
import { prisma } from '@/lib/prisma'

export interface UserPermissions {
  modules: string[]
  permissions: {
    module: string
    action: string
    resource: string
  }[]
  isSuperAdmin: boolean
}

/**
 * Obtiene todos los permisos de un usuario
 */
export async function getUserPermissions(userId: string): Promise<UserPermissions | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            modules: {
              where: { canAccess: true },
              include: {
                module: true
              }
            },
            permissions: {
              include: {
                permission: {
                  include: {
                    module: true
                  }
                }
              }
            }
          }
        },
        modules: {
          where: { canAccess: true },
          include: {
            module: true
          }
        },
        permissions: {
          where: { isGranted: true },
          include: {
            permission: {
              include: {
                module: true
              }
            }
          }
        }
      }
    })

    if (!user) return null

    // Recopilar módulos accesibles
    const modules = new Set<string>()
    
    // Módulos del rol - filtrar módulos activos
    user.role?.modules.forEach(rm => {
      if (rm.module.isActive) {
        modules.add(rm.module.name)
      }
    })
    
    // Módulos directos del usuario - filtrar módulos activos
    user.modules.forEach(um => {
      if (um.module.isActive) {
        modules.add(um.module.name)
      }
    })

    // Recopilar permisos
    const permissions = new Map<string, { module: string; action: string; resource: string }>()
    
    // Permisos del rol
    user.role?.permissions.forEach(rp => {
      const key = `${rp.permission.moduleId}-${rp.permission.action}-${rp.permission.resource}`
      permissions.set(key, {
        module: rp.permission.module.name,
        action: rp.permission.action,
        resource: rp.permission.resource
      })
    })
    
    // Permisos directos del usuario (sobrescriben los del rol)
    user.permissions.forEach(up => {
      const key = `${up.permission.moduleId}-${up.permission.action}-${up.permission.resource}`
      if (up.isGranted) {
        permissions.set(key, {
          module: up.permission.module.name,
          action: up.permission.action,
          resource: up.permission.resource
        })
      } else {
        // Si isGranted es false, se deniega el permiso
        permissions.delete(key)
      }
    })

    return {
      modules: Array.from(modules),
      permissions: Array.from(permissions.values()),
      isSuperAdmin: user.isSuperAdmin
    }
  } catch (error) {
    console.error('Error obteniendo permisos:', error)
    return null
  }
}

/**
 * Verifica si un usuario tiene acceso a un módulo
 */
export async function hasModuleAccess(userId: string, moduleName: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId)
  if (!permissions) return false
  
  return permissions.isSuperAdmin || permissions.modules.includes(moduleName)
}

/**
 * Verifica si un usuario tiene un permiso específico
 */
export async function hasPermission(
  userId: string,
  module: string,
  action: string,
  resource: string
): Promise<boolean> {
  const permissions = await getUserPermissions(userId)
  if (!permissions) return false
  
  if (permissions.isSuperAdmin) return true
  
  return permissions.permissions.some(p => 
    p.module === module && 
    p.action === action && 
    p.resource === resource
  )
}

/**
 * Verifica múltiples permisos (OR)
 */
export async function hasAnyPermission(
  userId: string,
  requiredPermissions: Array<{ module: string; action: string; resource: string }>
): Promise<boolean> {
  const permissions = await getUserPermissions(userId)
  if (!permissions) return false
  
  if (permissions.isSuperAdmin) return true
  
  return requiredPermissions.some(required =>
    permissions.permissions.some(p =>
      p.module === required.module &&
      p.action === required.action &&
      p.resource === required.resource
    )
  )
}

/**
 * Verifica múltiples permisos (AND)
 */
export async function hasAllPermissions(
  userId: string,
  requiredPermissions: Array<{ module: string; action: string; resource: string }>
): Promise<boolean> {
  const permissions = await getUserPermissions(userId)
  if (!permissions) return false
  
  if (permissions.isSuperAdmin) return true
  
  return requiredPermissions.every(required =>
    permissions.permissions.some(p =>
      p.module === required.module &&
      p.action === required.action &&
      p.resource === required.resource
    )
  )
}