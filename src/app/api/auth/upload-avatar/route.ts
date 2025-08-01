// src/app/api/auth/upload-avatar/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser, UserPayload } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('image') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No se encontró imagen' }, { status: 400 })
    }

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no válido. Use JPG, PNG o GIF' },
        { status: 400 }
      )
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'El archivo es muy grande. Máximo 5MB' },
        { status: 400 }
      )
    }

    // Convertir a base64 para guardar en la DB
    // En producción, deberías subir a un servicio como S3 o Cloudinary
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.userId },
      data: { image: base64 },
      select: { image: true }
    })

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        userId: currentUser.userId,
        action: 'UPDATE',
        entity: 'User',
        entityId: currentUser.userId,
        metadata: { action: 'avatar_upload' }
      }
    })

    return NextResponse.json({ 
      message: "Imagen actualizada correctamente",
      imageUrl: updatedUser.image 
    })
  } catch (error) {
    console.error("Error uploading avatar:", error)
    return NextResponse.json(
      { error: "Error al subir imagen" },
      { status: 500 }
    )
  }
}