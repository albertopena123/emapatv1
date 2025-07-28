// src/app/api/invoices/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { InvoiceStatus } from "@prisma/client"

// GET - Obtener factura específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const invoiceId = parseInt(id)

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        invoiceNumber: true,
        periodStart: true,
        periodEnd: true,
        consumptionAmount: true,
        waterCharge: true,
        sewerageCharge: true,
        fixedCharge: true,
        additionalCharges: true,
        discounts: true,
        taxes: true,
        totalAmount: true,
        amountDue: true,
        status: true,
        issuedAt: true,
        sentAt: true,
        dueDate: true,
        paidAt: true,
        notes: true,
        user: {
          select: {
            id: true,
            name: true,
            dni: true
          }
        },
        sensor: {
          select: {
            numero_medidor: true,
            name: true,
            direccion: true
          }
        },
        tarifa: {
          select: {
            name: true,
            tariffCategory: {
              select: {
                displayName: true
              }
            }
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            paymentDate: true,
            method: true,
            status: true
          }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: "Factura no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error("Error fetching invoice:", error)
    return NextResponse.json(
      { error: "Error al obtener factura" },
      { status: 500 }
    )
  }
}

// PUT - Actualizar factura
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const invoiceId = parseInt(id)
    const body = await request.json()
    const { dueDate, additionalCharges, discounts, status, notes } = body

    // Verificar que la factura existe
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { 
        id: true, 
        status: true,
        waterCharge: true,
        sewerageCharge: true,
        fixedCharge: true,
        taxes: true
      }
    })

    if (!existingInvoice) {
      return NextResponse.json(
        { error: "Factura no encontrada" },
        { status: 404 }
      )
    }

    // No permitir editar facturas pagadas (excepto notas)
    if (existingInvoice.status === "PAID" && status !== "PAID") {
      return NextResponse.json(
        { error: "No se puede modificar una factura pagada" },
        { status: 400 }
      )
    }

    // Recalcular total si cambian los importes
    const newTotalAmount = existingInvoice.waterCharge + 
                          existingInvoice.sewerageCharge + 
                          existingInvoice.fixedCharge + 
                          (additionalCharges || 0) - 
                          (discounts || 0) + 
                          existingInvoice.taxes

    const updateData = {
      dueDate: new Date(dueDate),
      additionalCharges: additionalCharges || 0,
      discounts: discounts || 0,
      totalAmount: newTotalAmount,
      notes
    }

    // Si cambia el estado, actualizar campos relacionados
    if (status !== existingInvoice.status) {
      Object.assign(updateData, {
        status: status as InvoiceStatus,
        ...(status === "SENT" && !existingInvoice.status.includes("SENT") && { sentAt: new Date() }),
        ...(status === "PAID" && { paidAt: new Date(), amountDue: 0 }),
        ...(status !== "PAID" && { amountDue: newTotalAmount })
      })
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
      select: {
        id: true,
        invoiceNumber: true,
        totalAmount: true,
        amountDue: true,
        status: true,
        dueDate: true
      }
    })

    return NextResponse.json(updatedInvoice)
  } catch (error) {
    console.error("Error updating invoice:", error)
    return NextResponse.json(
      { error: "Error al actualizar factura" },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar factura
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const invoiceId = parseInt(id)

    // Verificar que la factura existe
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { 
        id: true, 
        status: true,
        _count: {
          select: {
            payments: true
          }
        }
      }
    })

    if (!existingInvoice) {
      return NextResponse.json(
        { error: "Factura no encontrada" },
        { status: 404 }
      )
    }

    // No permitir eliminar facturas con pagos
    if (existingInvoice._count.payments > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar una factura que tiene pagos registrados" },
        { status: 400 }
      )
    }

    // No permitir eliminar facturas pagadas
    if (existingInvoice.status === "PAID") {
      return NextResponse.json(
        { error: "No se puede eliminar una factura pagada" },
        { status: 400 }
      )
    }

    // Desmarcar consumos como no facturados
    await prisma.waterConsumption.updateMany({
      where: { invoiceId: invoiceId },
      data: {
        invoiced: false,
        invoiceId: null
      }
    })

    // Eliminar factura
    await prisma.invoice.delete({
      where: { id: invoiceId }
    })

    return NextResponse.json({ message: "Factura eliminada exitosamente" })
  } catch (error) {
    console.error("Error deleting invoice:", error)
    return NextResponse.json(
      { error: "Error al eliminar factura" },
      { status: 500 }
    )
  }
}