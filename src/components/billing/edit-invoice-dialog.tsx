// src/components/billing/edit-invoice-dialog.tsx
"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2, Edit, Save } from "lucide-react"
import { toast } from "sonner"

const editInvoiceSchema = z.object({
    dueDate: z.string().min(1, "Selecciona fecha de vencimiento"),
    additionalCharges: z.number().min(0, "Debe ser mayor o igual a 0"),
    discounts: z.number().min(0, "Debe ser mayor o igual a 0"),
    status: z.enum(["DRAFT", "PENDING", "SENT", "PAID", "PARTIALLY_PAID", "OVERDUE", "CANCELLED"]),
    notes: z.string().optional(),
})

interface Invoice {
    id: number
    invoiceNumber: string
    dueDate: string
    additionalCharges: number
    discounts: number
    status: string
    notes: string | null
}

interface EditInvoiceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onInvoiceUpdated: () => void
    invoice: Invoice
}

export function EditInvoiceDialog({ open, onOpenChange, onInvoiceUpdated, invoice }: EditInvoiceDialogProps) {
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof editInvoiceSchema>>({
        resolver: zodResolver(editInvoiceSchema),
        defaultValues: {
            dueDate: "",
            additionalCharges: 0,
            discounts: 0,
            status: "DRAFT",
            notes: "",
        }
    })

    useEffect(() => {
        if (invoice) {
            form.reset({
                dueDate: new Date(invoice.dueDate).toISOString().split('T')[0],
                additionalCharges: invoice.additionalCharges,
                discounts: invoice.discounts,
                status: invoice.status as "DRAFT" | "PENDING" | "SENT" | "PAID" | "PARTIALLY_PAID" | "OVERDUE" | "CANCELLED", notes: invoice.notes || "",
            })
        }
    }, [invoice, form])

    const onSubmit = async (data: z.infer<typeof editInvoiceSchema>) => {
        setLoading(true)
        try {
            const response = await fetch(`/api/invoices/${invoice.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    dueDate: new Date(data.dueDate).toISOString()
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Error al actualizar factura")
            }

            toast.success("Factura actualizada exitosamente")
            onInvoiceUpdated()
            onOpenChange(false)
        } catch (error) {
            console.error("Error updating invoice:", error)
            toast.error(error instanceof Error ? error.message : "Error al actualizar factura")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-md max-h-[95vh] overflow-hidden p-0 z-[10000]">
                <div className="flex flex-col">
                    <div className="p-4 sm:p-6 border-b bg-white">
                        <DialogHeader>
                            <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
                                <Edit className="h-5 w-5 text-blue-500" />
                                Editar Factura
                            </DialogTitle>
                            <DialogDescription className="text-sm sm:text-base">
                                Modifica los datos de la factura {invoice.invoiceNumber}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium">
                                                Estado *
                                            </FormLabel>
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="DRAFT">Borrador</SelectItem>
                                                    <SelectItem value="PENDING">Pendiente</SelectItem>
                                                    <SelectItem value="SENT">Enviada</SelectItem>
                                                    <SelectItem value="PAID">Pagada</SelectItem>
                                                    <SelectItem value="PARTIALLY_PAID">Pago Parcial</SelectItem>
                                                    <SelectItem value="OVERDUE">Vencida</SelectItem>
                                                    <SelectItem value="CANCELLED">Cancelada</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="dueDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium">
                                                Fecha de vencimiento *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
                                                    {...field}
                                                    className="text-sm"
                                                />
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="additionalCharges"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium">
                                                    Cargos adicionales (S/)
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                        className="text-sm"
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-xs" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="discounts"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium">
                                                    Descuentos (S/)
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                        className="text-sm"
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-xs" />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium">
                                                Notas (opcional)
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Observaciones adicionales..."
                                                    rows={3}
                                                    {...field}
                                                    className="text-sm resize-none"
                                                />
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />
                            </form>
                        </Form>
                    </div>

                    <div className="p-4 sm:p-6 border-t bg-white">
                        <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                                className="w-full sm:w-auto order-2 sm:order-1"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                onClick={form.handleSubmit(onSubmit)}
                                className="w-full sm:w-auto order-1 sm:order-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Guardar Cambios
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}