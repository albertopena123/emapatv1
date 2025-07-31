// src/app/api/settings/billing/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { z } from "zod"
import { getBillingScheduler } from '@/lib/billing-scheduler'

const billingConfigUpdateSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    description: z.string().optional().nullable(),
    isActive: z.boolean(),
    billingDay: z.number().min(1).max(31),
    billingHour: z.number().min(0).max(23),
    billingMinute: z.number().min(0).max(59),
    timezone: z.string(),
    billingCycle: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
    periodDuration: z.number().min(1),
    includeWeekends: z.boolean(),
    retryOnFailure: z.boolean(),
    maxRetries: z.number().min(1).max(10),
    tariffCategories: z.array(z.number()),
    sensorStatuses: z.array(z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'FAULTY'])),
    notifyOnSuccess: z.boolean(),
    notifyOnError: z.boolean(),
    notifyEmails: z.array(z.string().email()),
})

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = await getUser()
        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const canRead = await hasPermission(user.userId, 'settings', 'read', 'billing')
        if (!canRead) {
            return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
        }

        const config = await prisma.billingConfig.findUnique({
            where: { id },
            include: {
                executions: {
                    take: 10,
                    orderBy: { startedAt: 'desc' }
                }
            }
        })

        if (!config) {
            return NextResponse.json({ error: 'Configuración no encontrada' }, { status: 404 })
        }

        return NextResponse.json(config)
    } catch (error) {
        console.error("Error fetching billing config:", error)
        return NextResponse.json(
            { error: "Error al obtener configuración" },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = await getUser()
        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const canUpdate = await hasPermission(user.userId, 'settings', 'update', 'billing')
        if (!canUpdate) {
            return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
        }

        const body = await request.json()
        const data = billingConfigUpdateSchema.parse(body)

        // Obtener configuración actual
        const currentConfig = await prisma.billingConfig.findUnique({
            where: { id }
        })

        if (!currentConfig) {
            return NextResponse.json({ error: 'Configuración no encontrada' }, { status: 404 })
        }

        // Recalcular próxima ejecución si cambió la programación
        const nextRun = calculateNextRun(data)

        const updatedConfig = await prisma.billingConfig.update({
            where: { id },
            data: {
                ...data,
                nextRun,
                updatedAt: new Date(),
            }
        })

        // Registrar en auditoría
        await prisma.auditLog.create({
            data: {
                userId: user.userId,
                action: 'UPDATE',
                entity: 'BillingConfig',
                entityId: id,
                oldValues: currentConfig,
                newValues: updatedConfig,
            }
        })

        // Recargar scheduler
        const scheduler = getBillingScheduler()
        if (scheduler) {
            await scheduler.reload(id)
        }

        return NextResponse.json(updatedConfig)
    } catch (error) {
        console.error("Error updating billing config:", error)
        
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Datos inválidos", details: error.format() },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: "Error al actualizar configuración" },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = await getUser()
        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const canDelete = await hasPermission(user.userId, 'settings', 'delete', 'billing')
        if (!canDelete) {
            return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
        }

        await prisma.billingConfig.delete({
            where: { id }
        })

        // Registrar en auditoría
        await prisma.auditLog.create({
            data: {
                userId: user.userId,
                action: 'DELETE',
                entity: 'BillingConfig',
                entityId: id,
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting billing config:", error)
        return NextResponse.json(
            { error: "Error al eliminar configuración" },
            { status: 500 }
        )
    }
}

function calculateNextRun(config: z.infer<typeof billingConfigUpdateSchema>): Date {
    const now = new Date()
    const next = new Date()
    
    next.setHours(config.billingHour, config.billingMinute, 0, 0)
    
    switch (config.billingCycle) {
        case 'DAILY':
            if (next <= now) {
                next.setDate(next.getDate() + 1)
            }
            break
            
        case 'WEEKLY':
            next.setDate(next.getDate() + ((7 - next.getDay()) % 7))
            if (next <= now) {
                next.setDate(next.getDate() + 7)
            }
            break
            
        case 'MONTHLY':
            next.setDate(config.billingDay)
            if (next <= now) {
                next.setMonth(next.getMonth() + 1)
            }
            break
            
        case 'QUARTERLY':
            const currentQuarter = Math.floor(now.getMonth() / 3)
            const nextQuarterMonth = (currentQuarter + 1) * 3
            next.setMonth(nextQuarterMonth)
            next.setDate(config.billingDay)
            if (next <= now) {
                next.setMonth(next.getMonth() + 3)
            }
            break
            
        case 'YEARLY':
            next.setMonth(0)
            next.setDate(config.billingDay)
            if (next <= now) {
                next.setFullYear(next.getFullYear() + 1)
            }
            break
    }
    
    if (!config.includeWeekends) {
        const dayOfWeek = next.getDay()
        if (dayOfWeek === 0) {
            next.setDate(next.getDate() + 1)
        } else if (dayOfWeek === 6) {
            next.setDate(next.getDate() + 2)
        }
    }
    
    return next
}