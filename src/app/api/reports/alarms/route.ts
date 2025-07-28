// app/api/reports/alarms/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma, AlarmType, AlarmSeverity } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    // Construir objeto where con tipo seguro
    const where: Prisma.AlarmHistoryWhereInput = {}
    
    // Filtros de fecha
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    if (startDate || endDate) {
      where.timestamp = {}
      if (startDate) {
        where.timestamp.gte = new Date(startDate)
      }
      if (endDate) {
        // Agregar 23:59:59 para incluir todo el día
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.timestamp.lte = end
      }
    }
    
    // Filtro por tipo de alarma
    const alarmType = searchParams.get('alarmType')
    if (alarmType && alarmType !== 'all') {
      where.alarmType = alarmType as AlarmType
    }
    
    // Filtro por severidad
    const severity = searchParams.get('severity')
    if (severity && severity !== 'all') {
      where.severity = severity as AlarmSeverity
    }
    
    // Filtro por estado resuelto
    const resolved = searchParams.get('resolved')
    if (resolved && resolved !== 'all') {
      where.resolved = resolved === 'true'
    }
    
    // Filtro por sensor ID
    const sensorId = searchParams.get('sensorId')
    if (sensorId) {
      where.sensorId = parseInt(sensorId, 10)
    }
    
    // Ejecutar consultas en paralelo para mejor rendimiento
    const [alarms, totalCount, activeCount] = await Promise.all([
      // Obtener alarmas con paginación opcional
      prisma.alarmHistory.findMany({
        where,
        include: {
          sensor: {
            select: {
              id: true,
              numero_medidor: true,
              direccion: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 1000 // Limitar a 1000 registros para evitar problemas de memoria
      }),
      
      // Contar total
      prisma.alarmHistory.count({ where }),
      
      // Contar activas
      prisma.alarmHistory.count({ 
        where: { 
          ...where, 
          resolved: false 
        } 
      })
    ])
    
    // Calcular estadísticas por severidad
    const severityCounts = await prisma.alarmHistory.groupBy({
      by: ['severity'],
      where,
      _count: {
        severity: true
      }
    })
    
    // Formatear resumen
    const bySeverity = severityCounts.reduce((acc, item) => {
      acc[item.severity] = item._count.severity
      return acc
    }, {} as Record<string, number>)
    
    const summary = {
      total: totalCount,
      active: activeCount,
      resolved: totalCount - activeCount,
      bySeverity
    }
    
    return NextResponse.json({
      data: alarms,
      summary,
      meta: {
        returnedCount: alarms.length,
        totalCount
      }
    })
    
  } catch (error) {
    console.error('Error fetching alarms report:', error)
    
    // Manejo específico de errores de Prisma
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { 
          error: 'Database error',
          code: error.code,
          message: 'Error al consultar las alarmas'
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Exportar metadata para alarmas (opcional)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { alarmId, resolved } = body
    
    // Actualizar estado de alarma
    const updatedAlarm = await prisma.alarmHistory.update({
      where: { id: alarmId },
      data: { 
        resolved,
        resolvedAt: resolved ? new Date() : null
      }
    })
    
    return NextResponse.json({ success: true, alarm: updatedAlarm })
    
  } catch (error) {
    console.error('Error updating alarm:', error)
    return NextResponse.json(
      { error: 'Error updating alarm' },
      { status: 500 }
    )
  }
}