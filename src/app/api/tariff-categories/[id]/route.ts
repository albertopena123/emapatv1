// src/app/api/tariff-categories/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const categoryId = parseInt(id)

    // Verificar que la categoría existe
    const existingCategory = await prisma.tariffCategory.findUnique({
      where: { id: categoryId },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            tariffs: true,
            Sensor: true
          }
        }
      }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      )
    }

    // Verificar si tiene tarifas o sensores asociados
    if (existingCategory._count.tariffs > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar una categoría que tiene tarifas asociadas" },
        { status: 400 }
      )
    }

    if (existingCategory._count.Sensor > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar una categoría que tiene sensores asociados" },
        { status: 400 }
      )
    }

    // Eliminar la categoría
    await prisma.tariffCategory.delete({
      where: { id: categoryId }
    })

    return NextResponse.json({ message: "Categoría eliminada exitosamente" })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json(
      { error: "Error al eliminar categoría" },
      { status: 500 }
    )
  }
}