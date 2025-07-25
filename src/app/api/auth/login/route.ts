// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import * as argon2 from "argon2"
import { SignJWT } from "jose"
import { prisma } from "@/lib/prisma"

const loginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
})

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-this"
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { identifier, password } = loginSchema.parse(body)

    // Buscar usuario por DNI o email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { dni: identifier },
          { email: identifier }
        ],
        isActive: true
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            },
            modules: {
              include: {
                module: true
              }
            }
          }
        },
        permissions: {
          include: {
            permission: true
          }
        },
        modules: {
          include: {
            module: true
          }
        }
      }
    })

    console.log("Usuario encontrado:", user ? `${user.email || user.dni}` : "No")
    
    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      )
    }

    // Verificar contraseña con Argon2
    const isValidPassword = await argon2.verify(user.password, password)
    
    console.log("Verificación de contraseña:", isValidPassword ? "OK" : "FALLO")
    
    if (!isValidPassword) {
      // Incrementar intentos fallidos
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          loginAttempts: { increment: 1 }
        }
      })

      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      )
    }

    // Actualizar último login y resetear intentos
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        loginAttempts: 0
      }
    })

    // Crear JWT con información mínima
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      dni: user.dni,
      name: user.name,
      isSuperAdmin: user.isSuperAdmin,
      roleId: user.roleId
      // Quitar permisos y módulos del token
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(secret)

    console.log("Token creado:", token.substring(0, 20) + "...")

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "LOGIN",
        entity: "users",
        entityId: user.id,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        userAgent: request.headers.get("user-agent"),
      }
    })

    // Crear response primero
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isSuperAdmin: user.isSuperAdmin,
        role: user.role?.displayName
      }
    })

    // Establecer cookie en el response
    response.cookies.set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
      path: "/"
      // Quitar domain: "localhost"
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}