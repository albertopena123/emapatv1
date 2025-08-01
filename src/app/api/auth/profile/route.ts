// src/app/api/auth/profile/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser, UserPayload } from "@/lib/auth"
import { z } from "zod"

const updateProfileSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  fechaNacimiento: z.string().optional().nullable(),
  sexo: z.enum(["M", "F", "O"]).optional().nullable(),
  ubigeoNac: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
})

export async function GET() {
  try {
    const currentUser = await getUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: {
        id: true,
        name: true,
        email: true,
        dni: true,
        image: true,
        isActive: true,
        isSuperAdmin: true,
        createdAt: true,
        lastLogin: true,
        fechaNacimiento: true,
        sexo: true,
        ubigeoNac: true,
        direccion: true,
        role: {
          select: {
            id: true,
            name: true,
            displayName: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json(
      { error: "Error al obtener perfil" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const data = updateProfileSchema.parse(body)

    // Verificar si el email ya existe (si se está cambiando)
    if (data.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: data.email,
          NOT: { id: currentUser.userId }
        }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: "El email ya está registrado" },
          { status: 400 }
        )
      }
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.userId },
      data: {
        name: data.name,
        email: data.email,
        fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : null,
        sexo: data.sexo || null,
        ubigeoNac: data.ubigeoNac || null,
        direccion: data.direccion || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        dni: true,
        image: true,
        fechaNacimiento: true,
        sexo: true,
        ubigeoNac: true,
        direccion: true,
        isActive: true,
        isSuperAdmin: true,
        createdAt: true,
        lastLogin: true,
        role: {
          select: {
            id: true,
            name: true,
            displayName: true,
          }
        }
      }
    })

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        userId: currentUser.userId,
        action: 'UPDATE',
        entity: 'User',
        entityId: currentUser.userId,
        oldValues: body,
        newValues: updatedUser,
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating profile:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.format() },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Error al actualizar perfil" },
      { status: 500 }
    )
  }
}