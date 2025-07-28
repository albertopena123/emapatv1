// src/app/api/maintenance/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { Prisma } from "@prisma/client"

const createMaintenanceSchema = z.object({
  sensorId: z.number(),
  type: z.enum(['PREVENTIVE', 'CORRECTIVE', 'CALIBRATION', 'INSTALLATION', 'UNINSTALLATION']),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('SCHEDULED'),
  scheduledDate: z.string().transform(str => new Date(str)),
  startDate: z.string().transform(str => new Date(str)).optional().nullable(),
  endDate: z.string().transform(str => new Date(str)).optional().nullable(),
  technician: z.string().optional().nullable(),
  description: z.string().min(10),
  findings: z.string().optional().nullable(),
  actionsTaken: z.string().optional().nullable(),
  partsReplaced: z.array(z.string()).default([]),
  cost: z.number().positive().optional().nullable(),
  nextMaintenance: z.string().transform(str => new Date(str)).optional().nullable(),
  attachments: z.array(z.string()).default([]),
  createdBy: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional()
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sensorId = searchParams.get('sensorId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: Prisma.MaintenanceLogWhereInput = {}
    
    if (sensorId) where.sensorId = parseInt(sensorId)
    if (status) where.status = status as Prisma.EnumMaintenanceStatusFilter
    if (type) where.type = type as Prisma.EnumMaintenanceTypeFilter

    const [maintenances, total] = await Promise.all([
      prisma.maintenanceLog.findMany({
        where,
        include: {
          sensor: {
            select: {
              id: true,
              name: true,
              numero_medidor: true,
              user: {
                select: {
                  name: true,
                  dni: true
                }
              }
            }
          }
        },
        orderBy: {
          scheduledDate: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.maintenanceLog.count({ where })
    ])

    return NextResponse.json({
      maintenances,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching maintenance logs:", error)
    return NextResponse.json(
      { error: "Error al obtener registros de mantenimiento" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createMaintenanceSchema.parse(body)

    // Verificar que el sensor existe
    const sensor = await prisma.sensor.findUnique({
      where: { id: data.sensorId }
    })

    if (!sensor) {
      return NextResponse.json(
        { error: "Sensor no encontrado" },
        { status: 404 }
      )
    }

    // Crear registro de mantenimiento
    const maintenance = await prisma.maintenanceLog.create({
      data: {
        sensorId: data.sensorId,
        type: data.type,
        status: data.status,
        scheduledDate: data.scheduledDate,
        startDate: data.startDate,
        endDate: data.endDate,
        technician: data.technician,
        description: data.description,
        findings: data.findings,
        actionsTaken: data.actionsTaken,
        partsReplaced: data.partsReplaced,
        cost: data.cost,
        nextMaintenance: data.nextMaintenance,
        attachments: data.attachments,
        createdBy: data.createdBy,
        metadata: data.metadata || {}
      },
      include: {
        sensor: {
          select: {
            id: true,
            name: true,
            numero_medidor: true
          }
        }
      }
    })

    return NextResponse.json(maintenance, { status: 201 })
  } catch (error) {
    console.error("Error creating maintenance log:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.format() },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Error al crear registro de mantenimiento" },
      { status: 500 }
    )
  }
}