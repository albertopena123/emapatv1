// src/app/api/payments/create-intent/route.ts
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { headers } from "next/headers"
import { jwtVerify } from "jose"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy", {
    apiVersion: "2025-06-30.basil"
})

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

export async function POST(request: NextRequest) {
    try {
        const user = await getUser()
        if (!user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const body = await request.json()
        const { invoiceId, amount } = body

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Stripe usa centavos
            currency: "pen",
            metadata: {
                invoiceId: invoiceId.toString(),
                userId: user.userId
            },
            description: `Factura de agua #${invoiceId}`
        })

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret
        })
    } catch (error) {
        console.error("Error creating payment intent:", error)
        return NextResponse.json(
            { error: "Error al crear intento de pago" },
            { status: 500 }
        )
    }
}