// src/components/billing/view-invoice-dialog.tsx
"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    FileText,
    Download,
    Send,
    CheckCircle,
    Clock,
    AlertCircle,
    CreditCard,
    LucideIcon,
    X
} from "lucide-react"

import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Invoice {
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
}

interface ViewInvoiceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    invoice: Invoice
}

export function ViewInvoiceDialog({ open, onOpenChange, invoice }: ViewInvoiceDialogProps) {
    const getStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            DRAFT: "bg-gray-100 text-gray-800",
            PENDING: "bg-yellow-100 text-yellow-800",
            SENT: "bg-blue-100 text-blue-800",
            PAID: "bg-green-100 text-green-800",
            PARTIALLY_PAID: "bg-orange-100 text-orange-800",
            OVERDUE: "bg-red-100 text-red-800",
            CANCELLED: "bg-gray-100 text-gray-800"
        }
        const labels: Record<string, string> = {
            DRAFT: "Borrador",
            PENDING: "Pendiente",
            SENT: "Enviada",
            PAID: "Pagada",
            PARTIALLY_PAID: "Pago Parcial",
            OVERDUE: "Vencida",
            CANCELLED: "Cancelada"
        }
        const icons: Record<string, LucideIcon> = {
            DRAFT: FileText,
            PENDING: Clock,
            SENT: Send,
            PAID: CheckCircle,
            PARTIALLY_PAID: CreditCard,
            OVERDUE: AlertCircle,
            CANCELLED: X
        }
        const IconComponent = icons[status]
        return (
            <Badge className={`${variants[status]} flex items-center gap-1`}>
                <IconComponent className="h-3 w-3" />
                {labels[status]}
            </Badge>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] overflow-hidden p-0 z-[10000]">
                <div className="flex flex-col">
                    {/* Header */}
                    <div className="p-4 sm:p-6 border-b bg-white">
                        <DialogHeader>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-blue-500" />
                                        Factura {invoice.invoiceNumber}
                                    </DialogTitle>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Emitida el {format(new Date(invoice.issuedAt), "dd/MM/yyyy", { locale: es })}
                                    </p>
                                </div>
                                {getStatusBadge(invoice.status)}
                            </div>
                        </DialogHeader>
                    </div>

                    {/* Contenido */}
                    <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
                        {/* Información del cliente */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3">Información del Cliente</h3>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="text-gray-500">Nombre:</span>
                                        <div className="font-medium">{invoice.user.name || "Sin nombre"}</div>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">DNI:</span>
                                        <div className="font-medium">{invoice.user.dni}</div>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Dirección:</span>
                                        <div className="font-medium">{invoice.sensor.direccion}</div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3">Información del Servicio</h3>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="text-gray-500">Medidor:</span>
                                        <div className="font-medium">{invoice.sensor.numero_medidor}</div>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Tarifa:</span>
                                        <div className="font-medium">{invoice.tarifa.name}</div>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Categoría:</span>
                                        <div className="font-medium">{invoice.tarifa.tariffCategory.displayName}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Período de facturación */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-3">Período de Facturación</h3>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span>Desde: <strong>{format(new Date(invoice.periodStart), "dd/MM/yyyy", { locale: es })}</strong></span>
                                    <span>Hasta: <strong>{format(new Date(invoice.periodEnd), "dd/MM/yyyy", { locale: es })}</strong></span>
                                </div>
                                <div className="mt-2 text-center">
                                    <span className="text-lg font-bold text-blue-600">
                                        {invoice.consumptionAmount.toFixed(2)} m³ consumidos
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Detalle de cargos */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-3">Detalle de Cargos</h3>
                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-gray-50 px-4 py-2 border-b">
                                    <div className="grid grid-cols-2 gap-4 text-sm font-medium">
                                        <span>Concepto</span>
                                        <span className="text-right">Importe</span>
                                    </div>
                                </div>
                                <div className="divide-y">
                                    <div className="px-4 py-3 grid grid-cols-2 gap-4 text-sm">
                                        <span>Consumo de agua</span>
                                        <span className="text-right">S/ {invoice.waterCharge.toFixed(2)}</span>
                                    </div>
                                    <div className="px-4 py-3 grid grid-cols-2 gap-4 text-sm">
                                        <span>Alcantarillado</span>
                                        <span className="text-right">S/ {invoice.sewerageCharge.toFixed(2)}</span>
                                    </div>
                                    <div className="px-4 py-3 grid grid-cols-2 gap-4 text-sm">
                                        <span>Cargo fijo</span>
                                        <span className="text-right">S/ {invoice.fixedCharge.toFixed(2)}</span>
                                    </div>
                                    {invoice.additionalCharges > 0 && (
                                        <div className="px-4 py-3 grid grid-cols-2 gap-4 text-sm">
                                            <span>Cargos adicionales</span>
                                            <span className="text-right">S/ {invoice.additionalCharges.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {invoice.discounts > 0 && (
                                        <div className="px-4 py-3 grid grid-cols-2 gap-4 text-sm text-green-600">
                                            <span>Descuentos</span>
                                            <span className="text-right">-S/ {invoice.discounts.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {invoice.taxes > 0 && (
                                        <div className="px-4 py-3 grid grid-cols-2 gap-4 text-sm">
                                            <span>Impuestos</span>
                                            <span className="text-right">S/ {invoice.taxes.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="bg-blue-50 px-4 py-3 border-t-2 border-blue-200">
                                    <div className="grid grid-cols-2 gap-4 text-base font-bold">
                                        <span>Total a Pagar</span>
                                        <span className="text-right text-blue-600">S/ {invoice.totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Fechas importantes */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-3">Fechas Importantes</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                    <div className="text-gray-500">Emitida</div>
                                    <div className="font-medium">{format(new Date(invoice.issuedAt), "dd/MM/yyyy", { locale: es })}</div>
                                </div>
                                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                    <div className="text-gray-500">Vencimiento</div>
                                    <div className="font-medium">{format(new Date(invoice.dueDate), "dd/MM/yyyy", { locale: es })}</div>
                                </div>
                                {invoice.paidAt && (
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <div className="text-gray-500">Pagada</div>
                                        <div className="font-medium">{format(new Date(invoice.paidAt), "dd/MM/yyyy", { locale: es })}</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Notas */}
                        {invoice.notes && (
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3">Notas</h3>
                                <div className="bg-gray-50 rounded-lg p-4 text-sm">
                                    {invoice.notes}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer con acciones */}
                    <div className="p-4 sm:p-6 border-t bg-white">
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                            <Button variant="outline" className="flex-1 sm:flex-none">
                                <Download className="mr-2 h-4 w-4" />
                                Descargar PDF
                            </Button>
                            <Button variant="outline" className="flex-1 sm:flex-none">
                                <Send className="mr-2 h-4 w-4" />
                                Enviar
                            </Button>
                            <Button
                                onClick={() => onOpenChange(false)}
                                className="flex-1 sm:flex-none"
                            >
                                Cerrar
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}