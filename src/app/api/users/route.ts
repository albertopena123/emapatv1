// src/app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import * as argon2 from "argon2"
import { z } from "zod"
import { getUser } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'

const createUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  dni: z.string().regex(/^\d{8}$/),
  password: z.string().min(6),
  roleId: z.number().optional(),
  isActive: z.boolean().default(true),
  isSuperAdmin: z.boolean().default(false),
  // Nuevos campos opcionales
  fechaNacimiento: z.string().optional().nullable(),
  sexo: z.enum(["M", "F", "O"]).optional().nullable(),
  ubigeoNac: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
})

export async function GET() {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permiso de lectura
    const canRead = await hasPermission(user.userId, 'users', 'read', 'users')
    if (!canRead) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        dni: true,
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
            displayName: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permiso de creación
    const canCreate = await hasPermission(user.userId, 'users', 'create', 'users')
    if (!canCreate) {
      return NextResponse.json({ error: 'Sin permisos para crear usuarios' }, { status: 403 })
    }

    const body = await request.json()
    const data = createUserSchema.parse(body)

    // Verificar si el DNI ya existe
    const existingUser = await prisma.user.findUnique({
      where: { dni: data.dni }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "El DNI ya está registrado" },
        { status: 400 }
      )
    }

    // Verificar email si se proporciona
    const emailExists = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (emailExists) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await argon2.hash(data.password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
      hashLength: 32,
    })

    // Crear usuario
    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        dni: data.dni,
        password: hashedPassword,
        isActive: data.isActive,
        isSuperAdmin: data.isSuperAdmin,
        roleId: data.roleId,
        emailVerified: new Date(),
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
        fechaNacimiento: true,
        sexo: true,
        ubigeoNac: true,
        direccion: true,
      }
    })

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'CREATE',
        entity: 'User',
        entityId: newUser.id,
        newValues: { name: newUser.name, dni: newUser.dni },
      }
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.format() },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Error al crear usuario" },
      { status: 500 }
    )
  }
}