// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional().nullable(),
  isActive: z.boolean().optional(),
  roleId: z.number().optional(),
  isSuperAdmin: z.boolean().optional(),
  // Nuevos campos opcionales
  fechaNacimiento: z.string().optional().nullable(),
  sexo: z.enum(["M", "F", "O"]).optional().nullable(),
  ubigeoNac: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = updateUserSchema.parse(body)

    // Verificar si el usuario existe
    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    // Si se cambia el email, verificar que no exista
    if (data.email && data.email !== user.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: "El email ya está en uso" },
          { status: 400 }
        )
      }
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.roleId !== undefined && { roleId: data.roleId }),
        ...(data.isSuperAdmin !== undefined && { isSuperAdmin: data.isSuperAdmin }),
        ...(data.fechaNacimiento !== undefined && { 
          fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : null 
        }),
        ...(data.sexo !== undefined && { sexo: data.sexo }),
        ...(data.ubigeoNac !== undefined && { ubigeoNac: data.ubigeoNac }),
        ...(data.direccion !== undefined && { direccion: data.direccion }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        dni: true,
        isActive: true,
        isSuperAdmin: true,
        fechaNacimiento: true,
        sexo: true,
        ubigeoNac: true,
        direccion: true,
        role: {
          select: {
            id: true,
            displayName: true,
          }
        }
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.format() },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Error al actualizar usuario" },
      { status: 500 }
    )
  }
}