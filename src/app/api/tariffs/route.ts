// src/app/api/tariffs/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Obtener todas las tarifas
export async function GET() {
  try {
    const tariffs = await prisma.tariff.findMany({
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
      },
      orderBy: [
        { tariffCategory: { displayName: "asc" } },
        { minConsumption: "asc" }
      ]
    })

    return NextResponse.json(tariffs)
  } catch (error) {
    console.error("Error fetching tariffs:", error)
    return NextResponse.json(
      { error: "Error al obtener tarifas" },
      { status: 500 }
    )
  }
}

// POST - Crear nueva tarifa
export async function POST(request: NextRequest) {
  try {
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

    const tariff = await prisma.tariff.create({
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
        isActive: isActive ?? true
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

    return NextResponse.json(tariff, { status: 201 })
  } catch (error) {
    console.error("Error creating tariff:", error)
    return NextResponse.json(
      { error: "Error al crear tarifa" },
      { status: 500 }
    )
  }
}