// src/app/api/roles/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createRoleSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  description: z.string().optional(),
  priority: z.number().default(0),
})

export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        priority: true,
        isSystem: true,
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: {
        priority: "desc"
      }
    })

    return NextResponse.json(roles)
  } catch (error) {
    console.error("Error fetching roles:", error)
    return NextResponse.json(
      { error: "Error al obtener roles" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createRoleSchema.parse(body)

    const existingRole = await prisma.role.findUnique({
      where: { name: data.name }
    })

    if (existingRole) {
      return NextResponse.json(
        { error: "El nombre del rol ya existe" },
        { status: 400 }
      )
    }

    const role = await prisma.role.create({
      data: {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        priority: data.priority,
        isSystem: false,
      }
    })

    return NextResponse.json(role, { status: 201 })
  } catch (error) {
    console.error("Error creating role:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.format() },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Error al crear rol" },
      { status: 500 }
    )
  }
}