// src/app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"
import { sendPasswordResetEmail } from "@/lib/email"
import { z } from "zod"

const requestSchema = z.object({
  email: z.string().email(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = requestSchema.parse(body)

    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Por seguridad, siempre respondemos éxito aunque no exista el usuario
    if (!user) {
      return NextResponse.json({
        message: "Si el email existe, recibirás instrucciones"
      })
    }

    // Generar token único
    const resetToken = randomBytes(32).toString("hex")
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hora

    // Guardar token en base de datos
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    })

    // Enviar email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`
    
    await sendPasswordResetEmail({
      to: user.email!,
      name: user.name || "Usuario",
      resetUrl,
    })

    return NextResponse.json({
      message: "Email enviado correctamente"
    })
  } catch (error) {
    console.error("Error en forgot password:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    )
  }
}