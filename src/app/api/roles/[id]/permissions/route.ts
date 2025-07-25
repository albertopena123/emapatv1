// src/app/api/roles/[id]/permissions/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roleId = parseInt(params.id)

    const permissions = await prisma.permission.findMany({
      where: {
        roles: {
          some: {
            roleId: roleId
          }
        }
      },
      select: {
        id: true,
        moduleId: true,
        action: true,
        resource: true,
        description: true
      }
    })

    return NextResponse.json(permissions)
  } catch (error) {
    console.error("Error fetching role permissions:", error)
    return NextResponse.json(
      { error: "Error al obtener permisos del rol" },
      { status: 500 }
    )
  }
}

const updatePermissionsSchema = z.object({
  permissions: z.array(z.number())
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { permissions } = updatePermissionsSchema.parse(body)
    const roleId = parseInt(params.id)

    // Verificar que el rol existe
    const role = await prisma.role.findUnique({
      where: { id: roleId }
    })

    if (!role) {
      return NextResponse.json(
        { error: "Rol no encontrado" },
        { status: 404 }
      )
    }

    // Eliminar permisos existentes
    await prisma.rolePermission.deleteMany({
      where: { roleId }
    })

    // Crear nuevos permisos
    if (permissions.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissions.map(permissionId => ({
          roleId,
          permissionId
        }))
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating role permissions:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.format() },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Error al actualizar permisos" },
      { status: 500 }
    )
  }
}