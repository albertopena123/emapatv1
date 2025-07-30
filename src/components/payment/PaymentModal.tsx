// src/components/payment/PaymentModal.tsx
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card } from "@/components/ui/card"
import { loadStripe } from "@stripe/stripe-js"
import {
    Elements,
    CardNumberElement,
    CardExpiryElement,
    CardCvcElement,
    useStripe,
    useElements
} from "@stripe/react-stripe-js"
import { Loader2, CreditCard, CheckCircle, AlertCircle, Lock } from "lucide-react"
import { toast } from "sonner"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface Invoice {
    id: number
    invoiceNumber: string
    totalAmount: number
    status: string
    user?: {
        name: string | null
        dni: string
    }
}

interface PaymentModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    invoice: Invoice | null
    onPaymentSuccess: () => void
}

// Estilos para los elementos de Stripe
const ELEMENT_OPTIONS = {
    style: {
        base: {
            fontSize: '16px',
            color: '#000',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            '::placeholder': {
                color: '#6b7280',
            },
        },
        invalid: {
            color: '#ef4444',
            iconColor: '#ef4444'
        }
    }
}

function PaymentForm({ invoice, onSuccess, onCancel }: {
    invoice: Invoice
    onSuccess: () => void
    onCancel: () => void
}) {
    const stripe = useStripe()
    const elements = useElements()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [succeeded, setSucceeded] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!stripe || !elements) return

        setLoading(true)
        setError("")

        try {
            // Crear payment intent
            const response = await fetch("/api/payments/create-intent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    invoiceId: invoice.id,
                    amount: invoice.totalAmount
                }),
            })

            if (!response.ok) throw new Error("Error al crear el intento de pago")

            const { clientSecret } = await response.json()

            // Confirmar el pago
            const cardElement = elements.getElement(CardNumberElement)
            if (!cardElement) throw new Error("Error con el elemento de tarjeta")

            const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
                clientSecret,
                {
                    payment_method: {
                        card: cardElement,
                        billing_details: {
                            name: invoice.user?.name || "Cliente",
                        },
                    },
                }
            )

            if (stripeError) {
                setError(stripeError.message || "Error al procesar el pago")
            } else if (paymentIntent?.status === "succeeded") {
                // Actualizar factura
                const updateResponse = await fetch(`/api/invoices/${invoice.id}/pay`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        paymentIntentId: paymentIntent.id,
                        amount: invoice.totalAmount
                    }),
                })

                if (updateResponse.ok) {
                    setSucceeded(true)
                    toast.success("¡Pago realizado con éxito!")
                    setTimeout(onSuccess, 2000)
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al procesar el pago")
        } finally {
            setLoading(false)
        }
    }

    if (succeeded) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-16 w-16 text-green-500 mb-4 animate-pulse" />
                <h3 className="text-xl font-semibold mb-2">¡Pago Exitoso!</h3>
                <p className="text-gray-600 text-center">
                    La factura {invoice.invoiceNumber} ha sido pagada.
                </p>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información de la factura */}
            <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-sm text-blue-600">Factura</p>
                        <p className="font-semibold">{invoice.invoiceNumber}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-blue-600">Total a pagar</p>
                        <p className="text-2xl font-bold text-blue-800">
                            S/. {invoice.totalAmount.toFixed(2)}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Campos de tarjeta */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Número de tarjeta
                    </label>
                    <div className="p-3 border rounded-md bg-white">
                        <CardNumberElement options={ELEMENT_OPTIONS} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Fecha de expiración
                        </label>
                        <div className="p-3 border rounded-md bg-white">
                            <CardExpiryElement options={ELEMENT_OPTIONS} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            CVC
                        </label>
                        <div className="p-3 border rounded-md bg-white">
                            <CardCvcElement options={ELEMENT_OPTIONS} />
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Información de prueba */}
            <Alert>
                <AlertDescription className="text-xs">
                    <strong>Tarjetas de prueba:</strong><br />
                    ✅ 4242 4242 4242 4242 (Éxito)<br />
                    ❌ 4000 0000 0000 0002 (Rechazada)
                </AlertDescription>
            </Alert>

            {/* Botones */}
            <div className="flex gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={loading}
                    className="flex-1"
                >
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    disabled={!stripe || loading}
                    className="flex-1"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Procesando...
                        </>
                    ) : (
                        <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Pagar
                        </>
                    )}
                </Button>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <Lock className="h-3 w-3" />
                <span>Pago seguro procesado por Stripe</span>
            </div>
        </form>
    )
}

export function PaymentModal({ open, onOpenChange, invoice, onPaymentSuccess }: PaymentModalProps) {
    if (!invoice) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>Realizar Pago</DialogTitle>
                </DialogHeader>

                <Elements stripe={stripePromise}>
                    <PaymentForm
                        invoice={invoice}
                        onSuccess={() => {
                            onPaymentSuccess()
                            onOpenChange(false)
                        }}
                        onCancel={() => onOpenChange(false)}
                    />
                </Elements>
            </DialogContent>
        </Dialog>
    )
}