// src/app/api/users/[id]/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import * as argon2 from 'argon2'
import { z } from 'zod'

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres")
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permiso de actualización
    const canUpdate = await hasPermission(user.userId, 'users', 'update', 'users')
    if (!canUpdate) {
      return NextResponse.json({ error: 'Sin permisos para restablecer contraseñas' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { newPassword } = resetPasswordSchema.parse(body)

    // Verificar si el usuario existe
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { 
        id: true, 
        name: true, 
        dni: true,
        isSuperAdmin: true 
      }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    // No permitir cambiar contraseña de super admin a menos que seas super admin
    if (targetUser.isSuperAdmin && !user.isSuperAdmin) {
      return NextResponse.json(
        { error: 'No puedes cambiar la contraseña de un super administrador' },
        { status: 403 }
      )
    }

    // Hash de la nueva contraseña
    const hashedPassword = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
      hashLength: 32,
    })

    // Actualizar contraseña
    await prisma.user.update({
      where: { id },
      data: { 
        password: hashedPassword,
        loginAttempts: 0, // Resetear intentos de login
        lockedUntil: null // Desbloquear cuenta si estaba bloqueada
      }
    })

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'UPDATE',
        entity: 'User',
        entityId: id,
        newValues: { action: 'password_reset' },
        metadata: {
          targetUserName: targetUser.name,
          targetUserDni: targetUser.dni,
          performedBy: user.userId
        }
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Contraseña restablecida exitosamente' 
    })

  } catch (error) {
    console.error('Error resetting password:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.format() },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al restablecer la contraseña' },
      { status: 500 }
    )
  }
}