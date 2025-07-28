// src/app/api/tariff-categories/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Obtener todas las categorías
export async function GET() {
  try {
    const categories = await prisma.tariffCategory.findMany({
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        isActive: true,
        _count: {
          select: {
            tariffs: true,
            Sensor: true
          }
        }
      },
      orderBy: {
        displayName: "asc"
      }
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json(
      { error: "Error al obtener categorías" },
      { status: 500 }
    )
  }
}

// POST - Crear nueva categoría
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, displayName, description, isActive } = body

    // Validar que no exista una categoría con el mismo nombre
    const existingCategory = await prisma.tariffCategory.findUnique({
      where: { name }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: "Ya existe una categoría con ese nombre" },
        { status: 400 }
      )
    }

    const category = await prisma.tariffCategory.create({
      data: {
        name,
        displayName,
        description,
        isActive: isActive ?? true
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        isActive: true,
        _count: {
          select: {
            tariffs: true,
            Sensor: true
          }
        }
      }
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error("Error creating category:", error)
    return NextResponse.json(
      { error: "Error al crear categoría" },
      { status: 500 }
    )
  }
}