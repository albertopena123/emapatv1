// src/app/api/modules/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const modules = await prisma.module.findMany({
      where: {
        isActive: true
      },
      include: {
        permissions: true
      },
      orderBy: {
        orderIndex: "asc"
      }
    })

    return NextResponse.json(modules)
  } catch (error) {
    console.error("Error fetching modules:", error)
    return NextResponse.json(
      { error: "Error al obtener módulos" },
      { status: 500 }
    )
  }
}