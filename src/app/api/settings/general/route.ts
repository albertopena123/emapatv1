// src/app/api/settings/general/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { z } from "zod"
import { Prisma } from '@prisma/client'

const generalSettingsSchema = z.object({
    companyName: z.string().min(1),
    systemEmail: z.string().email(),
    timezone: z.string(),
    dateFormat: z.string(),
    currency: z.string(),
})

type GeneralSettings = z.infer<typeof generalSettingsSchema>

export async function GET() {
    try {
        const user = await getUser()
        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const canRead = await hasPermission(user.userId, 'settings', 'read', 'general')
        if (!canRead) {
            return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
        }

        // Obtener configuraciones del sistema
        const settings = await prisma.systemConfig.findMany({
            where: {
                category: 'general'
            }
        })

        // Convertir a objeto
        const settingsObj = settings.reduce((acc, setting) => {
            acc[setting.key] = setting.value
            return acc
        }, {} as Record<string, Prisma.JsonValue>)

        return NextResponse.json(settingsObj)
    } catch (error) {
        console.error("Error fetching general settings:", error)
        return NextResponse.json(
            { error: "Error al obtener configuraciones" },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUser()
        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const canUpdate = await hasPermission(user.userId, 'settings', 'update', 'general')
        if (!canUpdate) {
            return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
        }

        const body = await request.json()
        const data = generalSettingsSchema.parse(body)

        // Guardar cada configuración
        const promises = Object.entries(data).map(([key, value]) =>
            prisma.systemConfig.upsert({
                where: {
                    category_key: {
                        category: 'general',
                        key
                    }
                },
                update: {
                    value: value as Prisma.InputJsonValue,
                    updatedAt: new Date()
                },
                create: {
                    id: `general_${key}`,
                    category: 'general',
                    key,
                    value: value as Prisma.InputJsonValue,
                    description: getSettingDescription(key),
                    isPublic: false
                }
            })
        )

        await Promise.all(promises)

        // Registrar en auditoría
        await prisma.auditLog.create({
            data: {
                userId: user.userId,
                action: 'UPDATE',
                entity: 'SystemConfig',
                entityId: 'general',
                newValues: data,
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error updating general settings:", error)
        
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Datos inválidos", details: error.format() },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: "Error al actualizar configuraciones" },
            { status: 500 }
        )
    }
}

function getSettingDescription(key: string): string {
    const descriptions: Record<string, string> = {
        companyName: "Nombre de la empresa",
        systemEmail: "Email del sistema para notificaciones",
        timezone: "Zona horaria del sistema",
        dateFormat: "Formato de fecha predeterminado",
        currency: "Moneda del sistema"
    }
    return descriptions[key] || ""
}