// src/app/(protected)/dashboard/InvoiceSection.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Eye, CreditCard, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { PaymentModal } from "@/components/payment/PaymentModal"
import { ViewInvoiceDialog } from "@/components/billing/view-invoice-dialog"
import { toast } from "sonner"

interface WaterConsumption {
    id: number
    amount: number
    previousAmount: number | null
    consumption: number | null
    readingDate: string
}

interface Payment {
    id: string
    amount: number
    paymentDate: string
    method: string
    status: string
    reference?: string | null
    receiptUrl?: string | null
}

interface Invoice {
    id: number
    invoiceNumber: string
    totalAmount: number
    status: string
    dueDate: string
    periodStart: string
    periodEnd: string
    amountDue?: number
    issuedAt?: string
}

interface InvoiceSectionProps {
    invoices: Invoice[]
    userInfo?: {
        name: string | null
        dni: string
    }
}

// Type for the complete invoice expected by ViewInvoiceDialog
type FullInvoice = {
    id: number
    invoiceNumber: string
    periodStart: string
    periodEnd: string
    consumptionAmount: number
    waterCharge: number
    sewerageCharge: number
    fixedCharge: number
    additionalCharges: number
    discounts: number
    taxes: number
    totalAmount: number
    amountDue: number
    status: string
    issuedAt: string
    sentAt: string | null
    dueDate: string
    paidAt: string | null
    notes: string | null
    user: {
        id?: string
        name: string | null
        dni: string
    }
    sensor: {
        numero_medidor: string
        name: string
        direccion: string
    }
    tarifa: {
        name: string
        tariffCategory: {
            displayName: string
        }
    }
    consumptions?: WaterConsumption[]
    payments?: Payment[]
}

export function InvoiceSection({ invoices, userInfo }: InvoiceSectionProps) {
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
    const [selectedFullInvoice, setSelectedFullInvoice] = useState<FullInvoice | null>(null)
    const [paymentModalOpen, setPaymentModalOpen] = useState(false)
    const [viewModalOpen, setViewModalOpen] = useState(false)
    const [loadingInvoice, setLoadingInvoice] = useState<number | null>(null)

    const handlePayClick = async (e: React.MouseEvent, invoice: Invoice) => {
        e.stopPropagation()
        if (invoice.status !== 'PAID') {
            setLoadingInvoice(invoice.id)
            try {
                // Obtener detalles completos de la factura
                const response = await fetch(`/api/invoices/${invoice.id}`)
                if (!response.ok) {
                    throw new Error("Error al cargar detalles de la factura")
                }
                const fullInvoiceData = await response.json()

                setSelectedInvoice(fullInvoiceData)
                setPaymentModalOpen(true)
            } catch (error) {
                console.error("Error fetching invoice details:", error)
                toast.error("Error al cargar los detalles de la factura")
            } finally {
                setLoadingInvoice(null)
            }
        }
    }

    const handleViewClick = async (e: React.MouseEvent, invoice: Invoice) => {
        e.stopPropagation()
        setLoadingInvoice(invoice.id)

        try {
            // Llamar a la API para obtener los detalles completos
            const response = await fetch(`/api/invoices/${invoice.id}`)
            if (!response.ok) {
                throw new Error("Error al cargar detalles de la factura")
            }

            const fullInvoiceData = await response.json()
            setSelectedFullInvoice(fullInvoiceData)
            setViewModalOpen(true)
        } catch (error) {
            console.error("Error fetching invoice details:", error)
            toast.error("Error al cargar los detalles de la factura")
        } finally {
            setLoadingInvoice(null)
        }
    }

    const handlePaymentSuccess = () => {
        window.location.reload()
    }

    return (
        <>
            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-purple-600" />
                        Últimas Facturas
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {invoices.length > 0 ? (
                        <div className="space-y-2">
                            {invoices.map((invoice) => (
                                <div
                                    key={invoice.id}
                                    className="p-3 bg-gray-50 rounded-lg transition-colors hover:bg-gray-100 group"
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">
                                                {invoice.invoiceNumber}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {format(new Date(invoice.periodStart), "MMM yyyy", { locale: es })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className="font-medium text-sm">
                                                    S/. {invoice.totalAmount.toFixed(2)}
                                                </p>
                                                <span className={`text-xs px-2 py-1 rounded inline-block ${invoice.status === 'PAID'
                                                        ? 'bg-green-100 text-green-700'
                                                        : invoice.status === 'OVERDUE'
                                                            ? 'bg-red-100 text-red-700'
                                                            : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {invoice.status === 'PAID' ? 'Pagado' :
                                                        invoice.status === 'OVERDUE' ? 'Vencido' : 'Pendiente'}
                                                </span>
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={(e) => handleViewClick(e, invoice)}
                                                    className="p-1.5 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
                                                    disabled={loadingInvoice === invoice.id}
                                                    title="Ver detalles"
                                                >
                                                    {loadingInvoice === invoice.id ? (
                                                        <Loader2 className="h-4 w-4 text-gray-600 animate-spin" />
                                                    ) : (
                                                        <Eye className="h-4 w-4 text-gray-600" />
                                                    )}
                                                </button>
                                                {invoice.status !== 'PAID' && (
                                                    <button
                                                        onClick={(e) => handlePayClick(e, invoice)}
                                                        className="p-1.5 rounded hover:bg-blue-100 transition-colors disabled:opacity-50"
                                                        disabled={loadingInvoice === invoice.id}
                                                        title="Pagar factura"
                                                    >
                                                        {loadingInvoice === invoice.id ? (
                                                            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                                                        ) : (
                                                            <CreditCard className="h-4 w-4 text-blue-600" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No hay facturas disponibles</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <PaymentModal
                open={paymentModalOpen}
                onOpenChange={setPaymentModalOpen}
                invoice={selectedInvoice}
                onPaymentSuccess={handlePaymentSuccess}
            />

            {selectedFullInvoice && (
                <ViewInvoiceDialog
                    open={viewModalOpen}
                    onOpenChange={setViewModalOpen}
                    invoice={selectedFullInvoice}
                />
            )}
        </>
    )
}