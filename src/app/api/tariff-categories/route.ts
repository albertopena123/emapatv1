// src/app/api/tariff-categories/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const categories = await prisma.tariffCategory.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        _count: {
          select: {
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
    console.error("Error fetching tariff categories:", error)
    return NextResponse.json(
      { error: "Error al obtener categorías tarifarias" },
      { status: 500 }
    )
  }
}