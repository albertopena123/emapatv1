// src/app/api/invoices/[id]/pay/route.ts
// Versión simplificada sin Stripe real para empezar

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { jwtVerify } from "jose"

const secret = new TextEncoder().encode(
    process.env.JWT_SECRET || "your-secret-key-change-this"
)

async function getUser() {
    const headersList = await headers()
    const cookieHeader = headersList.get("cookie")

    if (!cookieHeader) return null

    const token = cookieHeader.split("; ")
        .find((row: string) => row.startsWith("auth-token="))
        ?.split("=")[1]

    if (!token) return null

    try {
        const { payload } = await jwtVerify(token, secret)
        return payload as { userId: string }
    } catch {
        return null
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }  // ← Cambio aquí: Promise<>
) {
    try {
        const user = await getUser()
        if (!user) {
            return NextResponse.json(
                { error: "No autorizado" },
                { status: 401 }
            )
        }

        const { id } = await params  // ← Cambio aquí: await params
        const invoiceId = parseInt(id)
        const body = await request.json()
        const { paymentIntentId, amount, method = "CARD", cardLast4 } = body

        // Verificar que la factura existe y pertenece al usuario
        const invoice = await prisma.invoice.findFirst({
            where: {
                id: invoiceId,
                userId: user.userId,
                status: { not: "PAID" }
            }
        })

        if (!invoice) {
            return NextResponse.json(
                { error: "Factura no encontrada o ya pagada" },
                { status: 404 }
            )
        }

        // Verificar que el monto coincide
        if (Math.abs(invoice.totalAmount - amount) > 0.01) {
            return NextResponse.json(
                { error: "El monto no coincide con la factura" },
                { status: 400 }
            )
        }

        // Actualizar la factura y crear el registro de pago
        const result = await prisma.$transaction(async (tx) => {
            // Actualizar factura
            const updatedInvoice = await tx.invoice.update({
                where: { id: invoiceId },
                data: {
                    status: "PAID",
                    paidAt: new Date(),
                    amountDue: 0
                }
            })

            // Crear registro de pago
            const payment = await tx.payment.create({
                data: {
                    invoiceId: invoiceId,
                    amount: amount,
                    paymentDate: new Date(),
                    method: method,
                    status: "COMPLETED",
                    transactionId: paymentIntentId,
                    reference: `PAGO-${invoiceId}-${Date.now()}`,
                    processorData: {
                        provider: "demo",
                        paymentIntentId: paymentIntentId,
                        cardLast4: cardLast4 || "****",
                        testMode: true
                    },
                    notes: "Pago procesado en modo de prueba"
                }
            })

            return { invoice: updatedInvoice, payment }
        })

        // Log de auditoría
        await prisma.auditLog.create({
            data: {
                userId: user.userId,
                action: "PAYMENT_COMPLETED",
                entity: "invoice",
                entityId: invoiceId.toString(),
                newValues: {
                    status: "PAID",
                    paymentId: result.payment.id,
                    amount: amount
                },
                metadata: {
                    paymentMethod: method,
                    transactionId: paymentIntentId
                }
            }
        }).catch(console.error) // No fallar si el log no se guarda

        return NextResponse.json({
            success: true,
            invoice: result.invoice,
            payment: result.payment,
            message: "Pago procesado correctamente"
        })
    } catch (error) {
        console.error("Error processing payment:", error)
        return NextResponse.json(
            { error: "Error al procesar el pago" },
            { status: 500 }
        )
    }
}