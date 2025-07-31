// src/app/api/settings/billing/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { z } from "zod"
import { getBillingScheduler } from '@/lib/billing-scheduler'

const billingConfigSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    description: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
    billingDay: z.number().min(1).max(31),
    billingHour: z.number().min(0).max(23),
    billingMinute: z.number().min(0).max(59).default(0),
    timezone: z.string().default("America/Lima"),
    billingCycle: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).default('MONTHLY'),
    periodDuration: z.number().min(1).default(30),
    includeWeekends: z.boolean().default(true),
    retryOnFailure: z.boolean().default(true),
    maxRetries: z.number().min(1).max(10).default(3),
    tariffCategories: z.array(z.number()).default([]),
    sensorStatuses: z.array(z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'FAULTY'])).default(['ACTIVE']),
    notifyOnSuccess: z.boolean().default(true),
    notifyOnError: z.boolean().default(true),
    notifyEmails: z.array(z.string().email()).default([]),
})

export async function GET() {
    try {
        const user = await getUser()
        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Verificar permisos
        const canRead = await hasPermission(user.userId, 'settings', 'read', 'billing')
        if (!canRead) {
            return NextResponse.json({ error: 'Sin permisos para ver configuración' }, { status: 403 })
        }

        const configs = await prisma.billingConfig.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(configs)
    } catch (error) {
        console.error("Error fetching billing configs:", error)
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

        // Verificar permisos
        const canCreate = await hasPermission(user.userId, 'settings', 'create', 'billing')
        if (!canCreate) {
            return NextResponse.json({ error: 'Sin permisos para crear configuración' }, { status: 403 })
        }

        const body = await request.json()
        const data = billingConfigSchema.parse(body)

        // Calcular próxima ejecución
        const nextRun = calculateNextRun(data)

        const config = await prisma.billingConfig.create({
            data: {
                ...data,
                nextRun,
                totalInvoices: 0,
            }
        })

        // Registrar en auditoría
        await prisma.auditLog.create({
            data: {
                userId: user.userId,
                action: 'CREATE',
                entity: 'BillingConfig',
                entityId: config.id,
                newValues: { name: config.name, isActive: config.isActive },
            }
        })

        // Recargar scheduler si está activo
        const scheduler = getBillingScheduler()
        if (scheduler && config.isActive) {
            await scheduler.reload(config.id)
        }

        return NextResponse.json(config, { status: 201 })
    } catch (error) {
        console.error("Error creating billing config:", error)
        
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Datos inválidos", details: error.format() },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: "Error al crear configuración" },
            { status: 500 }
        )
    }
}

function calculateNextRun(config: z.infer<typeof billingConfigSchema>): Date {
    const now = new Date()
    const next = new Date()
    
    // Establecer hora y minutos
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
            next.setMonth(0) // Enero
            next.setDate(config.billingDay)
            if (next <= now) {
                next.setFullYear(next.getFullYear() + 1)
            }
            break
    }
    
    // Si cae en fin de semana y no está permitido
    if (!config.includeWeekends) {
        const dayOfWeek = next.getDay()
        if (dayOfWeek === 0) { // Domingo
            next.setDate(next.getDate() + 1)
        } else if (dayOfWeek === 6) { // Sábado
            next.setDate(next.getDate() + 2)
        }
    }
    
    return next
}