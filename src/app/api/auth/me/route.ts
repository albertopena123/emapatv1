// src/app/api/auth/me/route.ts
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { prisma } from "@/lib/prisma"

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-this"
)

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie")
    console.log("Cookie header:", cookieHeader)
    
    if (!cookieHeader) {
      return NextResponse.json({ error: "No cookies" }, { status: 401 })
    }
    
    const token = cookieHeader
      .split("; ")
      .find(row => row.startsWith("auth-token="))
      ?.split("=")[1]
    
    console.log("Token encontrado:", token ? "Sí" : "No")

    if (!token) {
      return NextResponse.json({ error: "No auth token" }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, secret)
    
    // Obtener módulos del usuario
    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
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
      },
      modules: allModules
    })
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 })
  }
}