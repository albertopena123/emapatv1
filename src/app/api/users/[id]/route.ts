// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import * as argon2 from 'argon2'
import { z } from 'zod'

const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional().nullable(),
  roleId: z.number().optional(),
  isActive: z.boolean().optional(),
  isSuperAdmin: z.boolean().optional(),
  password: z.string().min(6).optional(),
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
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permiso de actualización
    const canUpdate = await hasPermission(user.userId, 'users', 'update', 'users')
    if (!canUpdate) {
      return NextResponse.json({ error: 'Sin permisos para editar usuarios' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const data = updateUserSchema.parse(body)

    // Verificar si el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    // Si se cambia el email, verificar que no exista
    if (data.email && data.email !== existingUser.email) {
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

    // Preparar datos para actualizar
    const updateData: Partial<{
      name: string
      email: string | null
      isActive: boolean
      roleId: number
      isSuperAdmin: boolean
      fechaNacimiento: Date | null
      sexo: string | null
      ubigeoNac: string | null
      direccion: string | null
      password: string
    }> = {}
    
    // Solo incluir campos que fueron enviados
    if (data.name !== undefined) updateData.name = data.name
    if (data.email !== undefined) updateData.email = data.email
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.roleId !== undefined) updateData.roleId = data.roleId
    if (data.isSuperAdmin !== undefined) updateData.isSuperAdmin = data.isSuperAdmin
    if (data.fechaNacimiento !== undefined) {
      updateData.fechaNacimiento = data.fechaNacimiento ? new Date(data.fechaNacimiento) : null
    }
    if (data.sexo !== undefined) updateData.sexo = data.sexo
    if (data.ubigeoNac !== undefined) updateData.ubigeoNac = data.ubigeoNac
    if (data.direccion !== undefined) updateData.direccion = data.direccion
    
    // Si hay contraseña, hashearla
    if (data.password) {
      updateData.password = await argon2.hash(data.password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1,
        hashLength: 32,
      })
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
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
            displayName: true
          }
        }
      }
    })

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'UPDATE',
        entity: 'User',
        entityId: id,
        newValues: data,
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.format() },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permiso de eliminación
    const canDelete = await hasPermission(user.userId, 'users', 'delete', 'users')
    if (!canDelete) {
      return NextResponse.json({ error: 'Sin permisos para eliminar usuarios' }, { status: 403 })
    }

    const { id } = await params

    // No permitir eliminar super admin
    const targetUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    if (targetUser.isSuperAdmin) {
      return NextResponse.json(
        { error: 'No se puede eliminar un super administrador' },
        { status: 400 }
      )
    }

    // No permitir auto-eliminación
    if (targetUser.id === user.userId) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia cuenta' },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id }
    })

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'DELETE',
        entity: 'User',
        entityId: id,
        oldValues: { name: targetUser.name, dni: targetUser.dni },
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Error al eliminar usuario' },
      { status: 500 }
    )
  }
}