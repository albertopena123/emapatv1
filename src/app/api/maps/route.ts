// src/app/api/maps/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createMapSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    description: z.string().optional(),
})

export async function GET() {
    try {
        const maps = await prisma.map.findMany({
            include: {
                _count: {
                    select: {
                        locations: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        })

        return NextResponse.json(maps)
    } catch (error) {
        console.error("Error fetching maps:", error)
        return NextResponse.json(
            { error: "Error al obtener mapas" },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const data = createMapSchema.parse(body)

        // Verificar si ya existe un mapa con el mismo nombre
        const existingMap = await prisma.map.findFirst({
            where: { 
                name: {
                    equals: data.name,
                    mode: 'insensitive' // Búsqueda case-insensitive
                }
            }
        })

        if (existingMap) {
            return NextResponse.json(
                { error: "Ya existe un mapa con ese nombre" },
                { status: 400 }
            )
        }

        const map = await prisma.map.create({
            data: {
                name: data.name,
                description: data.description,
                // tenantId se puede agregar más tarde para multi-tenancy
            },
            include: {
                _count: {
                    select: {
                        locations: true
                    }
                }
            }
        })

        return NextResponse.json(map, { status: 201 })
    } catch (error) {
        console.error("Error creating map:", error)
        
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Datos inválidos", details: error.format() },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: "Error al crear mapa" },
            { status: 500 }
        )
    }
}