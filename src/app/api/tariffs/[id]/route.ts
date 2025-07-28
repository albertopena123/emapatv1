// src/app/api/tariffs/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// PUT - Actualizar tarifa
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()
    const {
      name,
      description,
      tariffCategoryId,
      minConsumption,
      maxConsumption,
      waterCharge,
      sewerageCharge,
      fixedCharge,
      assignedVolume,
      isActive
    } = body

    // Verificar que la tarifa existe
    const existingTariff = await prisma.tariff.findUnique({
      where: { id }
    })

    if (!existingTariff) {
      return NextResponse.json(
        { error: "Tarifa no encontrada" },
        { status: 404 }
      )
    }

    // Validar que la categoría existe
    const category = await prisma.tariffCategory.findUnique({
      where: { id: tariffCategoryId }
    })

    if (!category) {
      return NextResponse.json(
        { error: "La categoría seleccionada no existe" },
        { status: 400 }
      )
    }

    // Validar rangos de consumo
    if (maxConsumption !== null && maxConsumption <= minConsumption) {
      return NextResponse.json(
        { error: "El consumo máximo debe ser mayor al mínimo" },
        { status: 400 }
      )
    }

    const updatedTariff = await prisma.tariff.update({
      where: { id },
      data: {
        name,
        description,
        tariffCategoryId,
        minConsumption: parseFloat(minConsumption),
        maxConsumption: maxConsumption ? parseFloat(maxConsumption) : null,
        waterCharge: parseFloat(waterCharge),
        sewerageCharge: parseFloat(sewerageCharge),
        fixedCharge: parseFloat(fixedCharge),
        assignedVolume: parseInt(assignedVolume),
        isActive: isActive ?? true,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        description: true,
        minConsumption: true,
        maxConsumption: true,
        waterCharge: true,
        sewerageCharge: true,
        fixedCharge: true,
        assignedVolume: true,
        isActive: true,
        validFrom: true,
        validUntil: true,
        tariffCategory: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        },
        _count: {
          select: {
            waterConsumptions: true,
            invoices: true
          }
        }
      }
    })

    return NextResponse.json(updatedTariff)
  } catch (error) {
    console.error("Error updating tariff:", error)
    return NextResponse.json(
      { error: "Error al actualizar tarifa" },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar tarifa
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    // Verificar que la tarifa existe
    const existingTariff = await prisma.tariff.findUnique({
      where: { id },
      select: {
        id: true,
        tariffCategoryId: true,
        _count: {
          select: {
            waterConsumptions: true,
            invoices: true
          }
        }
      }
    })

    if (!existingTariff) {
      return NextResponse.json(
        { error: "Tarifa no encontrada" },
        { status: 404 }
      )
    }

    // Verificar si tiene registros relacionados
    if (existingTariff._count.waterConsumptions > 0 || existingTariff._count.invoices > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar una tarifa que tiene consumos o facturas asociadas" },
        { status: 400 }
      )
    }

    // Verificar si hay sensores usando esta tarifa
    const sensorsUsingTariff = await prisma.sensor.count({
      where: { tariffCategoryId: existingTariff.tariffCategoryId }
    })

    if (sensorsUsingTariff > 0) {
      // En lugar de eliminar, marcar como inactiva
      const updatedTariff = await prisma.tariff.update({
        where: { id },
        data: { isActive: false },
        select: {
          id: true,
          name: true,
          isActive: true,
          tariffCategory: {
            select: {
              id: true,
              name: true,
              displayName: true
            }
          }
        }
      })

      return NextResponse.json({
        message: "Tarifa marcada como inactiva debido a sensores asociados",
        tariff: updatedTariff
      })
    }

    // Eliminar completamente si no hay dependencias
    await prisma.tariff.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Tarifa eliminada exitosamente" })
  } catch (error) {
    console.error("Error deleting tariff:", error)
    return NextResponse.json(
      { error: "Error al eliminar tarifa" },
      { status: 500 }
    )
  }
}

// GET - Obtener tarifa específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    const tariff = await prisma.tariff.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        minConsumption: true,
        maxConsumption: true,
        waterCharge: true,
        sewerageCharge: true,
        fixedCharge: true,
        assignedVolume: true,
        isActive: true,
        validFrom: true,
        validUntil: true,
        tariffCategory: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        },
        _count: {
          select: {
            waterConsumptions: true,
            invoices: true
          }
        }
      }
    })

    if (!tariff) {
      return NextResponse.json(
        { error: "Tarifa no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(tariff)
  } catch (error) {
    console.error("Error fetching tariff:", error)
    return NextResponse.json(
      { error: "Error al obtener tarifa" },
      { status: 500 }
    )
  }
}