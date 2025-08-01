// src/app/api/auth/change-password/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"
import * as argon2 from "argon2"
import { z } from "zod"

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6),
})

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const data = changePasswordSchema.parse(body)

    // Obtener usuario con contraseña actual
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { password: true }
    })

    if (!user?.password) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    // Verificar contraseña actual
    const validPassword = await argon2.verify(user.password, data.currentPassword)
    if (!validPassword) {
      return NextResponse.json(
        { error: "Contraseña actual incorrecta" },
        { status: 400 }
      )
    }

    // Hash nueva contraseña
    const hashedPassword = await argon2.hash(data.newPassword, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
      hashLength: 32,
    })

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: currentUser.userId },
      data: { password: hashedPassword }
    })

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        userId: currentUser.userId,
        action: 'UPDATE',
        entity: 'User',
        entityId: currentUser.userId,
        metadata: { action: 'password_change' }
      }
    })

    return NextResponse.json({ message: "Contraseña actualizada correctamente" })
  } catch (error) {
    console.error("Error changing password:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.format() },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Error al cambiar contraseña" },
      { status: 500 }
    )
  }
}