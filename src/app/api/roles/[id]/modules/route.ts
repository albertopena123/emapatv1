// src/app/api/roles/[id]/modules/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const roleId = parseInt(id)

    const modules = await prisma.module.findMany({
      where: {
        roleModules: {
          some: {
            roleId: roleId,
            canAccess: true
          }
        }
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        icon: true
      }
    })

    return NextResponse.json(modules)
  } catch (error) {
    console.error("Error fetching role modules:", error)
    return NextResponse.json(
      { error: "Error al obtener módulos del rol" },
      { status: 500 }
    )
  }
}

const updateModulesSchema = z.object({
  modules: z.array(z.number())
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { modules } = updateModulesSchema.parse(body)
    const roleId = parseInt(id)

    const role = await prisma.role.findUnique({
      where: { id: roleId }
    })

    if (!role) {
      return NextResponse.json(
        { error: "Rol no encontrado" },
        { status: 404 }
      )
    }

    // Eliminar módulos existentes
    await prisma.roleModule.deleteMany({
      where: { roleId }
    })

    // Crear nuevas asignaciones
    if (modules.length > 0) {
      await prisma.roleModule.createMany({
        data: modules.map(moduleId => ({
          roleId,
          moduleId,
          canAccess: true
        }))
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating role modules:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.format() },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Error al actualizar módulos" },
      { status: 500 }
    )
  }
}