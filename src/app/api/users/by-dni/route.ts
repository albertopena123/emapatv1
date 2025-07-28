// src/app/api/users/by-dni/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const dni = searchParams.get('dni')

        if (!dni) {
            return NextResponse.json(
                { error: "DNI es requerido" },
                { status: 400 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { dni },
            include: {
                sensors: {
                    select: {
                        id: true,
                        name: true,
                        numero_medidor: true,
                        direccion: true,
                        status: true
                    }
                }
            }
        })

        if (!user) {
            return NextResponse.json(
                { error: "Usuario no encontrado" },
                { status: 404 }
            )
        }

        return NextResponse.json({
            userId: user.id,
            name: user.name,
            email: user.email,
            sensors: user.sensors
        })

    } catch (error) {
        console.error("Error fetching user by DNI:", error)
        return NextResponse.json(
            { error: "Error al buscar usuario" },
            { status: 500 }
        )
    }
}