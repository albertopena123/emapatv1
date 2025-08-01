// src/app/api/auth/me/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser, UserPayload } from "@/lib/auth"

export async function GET() {
  try {
    const currentUser = await getUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener módulos del usuario
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      include: {
        role: {
          include: {
            modules: {
              where: { canAccess: true },
              include: { module: true }
            }
          }
        },
        modules: {
          where: { canAccess: true },
          include: { module: true }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Combinar módulos del rol y específicos del usuario
    const roleModules = user.role?.modules.map(rm => rm.module) || []
    const userModules = user.modules.map(um => um.module)
    
    // Eliminar duplicados y ordenar
    const allModules = [...roleModules, ...userModules]
      .filter((module, index, self) => 
        index === self.findIndex(m => m.id === module.id) && module.isActive
      )
      .sort((a, b) => a.orderIndex - b.orderIndex)

    return NextResponse.json({
      user: {
        userId: user.id,
        email: user.email,
        dni: user.dni,
        name: user.name,
        isSuperAdmin: user.isSuperAdmin,
        image: user.image,
      },
      modules: allModules
    })
  } catch (error) {
    console.error("Error en /api/auth/me:", error)
    return NextResponse.json({ error: "Error al obtener información del usuario" }, { status: 500 })
  }
}