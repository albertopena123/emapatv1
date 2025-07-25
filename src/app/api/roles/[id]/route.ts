// src/app/api/roles/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateRoleSchema = z.object({
  displayName: z.string().optional(),
  description: z.string().optional(),
  priority: z.number().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data = updateRoleSchema.parse(body)
    const roleId = parseInt(params.id)

    const role = await prisma.role.findUnique({
      where: { id: roleId }
    })

    if (!role) {
      return NextResponse.json(
        { error: "Rol no encontrado" },
        { status: 404 }
      )
    }

    if (role.isSystem) {
      return NextResponse.json(
        { error: "No se pueden modificar roles del sistema" },
        { status: 403 }
      )
    }

    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data
    })

    return NextResponse.json(updatedRole)
  } catch (error) {
    console.error("Error updating role:", error)
    return NextResponse.json(
      { error: "Error al actualizar rol" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roleId = parseInt(params.id)

    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: { users: true }
        }
      }
    })

    if (!role) {
      return NextResponse.json(
        { error: "Rol no encontrado" },
        { status: 404 }
      )
    }

    if (role.isSystem) {
      return NextResponse.json(
        { error: "No se pueden eliminar roles del sistema" },
        { status: 403 }
      )
    }

    if (role._count.users > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar un rol con usuarios asignados" },
        { status: 400 }
      )
    }

    await prisma.role.delete({
      where: { id: roleId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting role:", error)
    return NextResponse.json(
      { error: "Error al eliminar rol" },
      { status: 500 }
    )
  }
}