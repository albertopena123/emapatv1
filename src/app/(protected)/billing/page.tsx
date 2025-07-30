// src/app/(protected)/billing/page.tsx
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
    Plus,
    DollarSign,
    Search,
    Edit,
    Eye,
    Send,
    CreditCard,
    AlertCircle,
    CheckCircle,
    Clock,
    FileText,
    Download,
    Loader2
} from "lucide-react"
import { CreateInvoiceDialog } from "@/components/billing/create-invoice-dialog"
import { EditInvoiceDialog } from "@/components/billing/edit-invoice-dialog"
import { ViewInvoiceDialog } from "@/components/billing/view-invoice-dialog"
import { toast } from "sonner"
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
        id: string
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
    _count: {
        payments: number
    }
}

export default function BillingPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedStatus, setSelectedStatus] = useState<string>("all")
    const [selectedPeriod, setSelectedPeriod] = useState<string>("all")
    const [searchTerm, setSearchTerm] = useState("")
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [editInvoice, setEditInvoice] = useState<Invoice | null>(null)
    const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const response = await fetch("/api/invoices")
            if (response.ok) {
                const data = await response.json()
                setInvoices(data)
            }
        } catch (error) {
            console.error("Error fetching invoices:", error)
            toast.error("Error al cargar facturas")
        } finally {
            setLoading(false)
        }
    }

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
        const icons: Record<string, React.ComponentType<{ className?: string }>> = {
            DRAFT: FileText,
            PENDING: Clock,
            SENT: Send,
            PAID: CheckCircle,
            PARTIALLY_PAID: CreditCard,
            OVERDUE: AlertCircle,
            CANCELLED: FileText
        }
        const IconComponent = icons[status]
        return (
            <Badge className={`${variants[status] || variants.DRAFT} flex items-center gap-1`}>
                <IconComponent className="h-3 w-3" />
                {labels[status] || status}
            </Badge>
        )
    }

    const filteredInvoices = invoices.filter(invoice => {
        const matchesStatus = selectedStatus === "all" || invoice.status === selectedStatus
        const matchesSearch = searchTerm === "" ||
            invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            invoice.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            invoice.user.dni.includes(searchTerm) ||
            invoice.sensor.numero_medidor.includes(searchTerm)

        let matchesPeriod = true
        if (selectedPeriod !== "all") {
            const now = new Date()
            const invoiceDate = new Date(invoice.issuedAt)
            const daysDiff = Math.floor((now.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24))

            switch (selectedPeriod) {
                case "30d":
                    matchesPeriod = daysDiff <= 30
                    break
                case "3m":
                    matchesPeriod = daysDiff <= 90
                    break
                case "6m":
                    matchesPeriod = daysDiff <= 180
                    break
                case "1y":
                    matchesPeriod = daysDiff <= 365
                    break
            }
        }

        return matchesStatus && matchesSearch && matchesPeriod
    })

    // Estadísticas
    const totalInvoices = invoices.length
    const paidInvoices = invoices.filter(i => i.status === "PAID").length
    const pendingInvoices = invoices.filter(i => ["PENDING", "SENT"].includes(i.status)).length
    const overdueInvoices = invoices.filter(i => i.status === "OVERDUE").length
    const totalAmount = invoices.reduce((sum, i) => sum + i.totalAmount, 0)
    const paidAmount = invoices.filter(i => i.status === "PAID").reduce((sum, i) => sum + i.totalAmount, 0)
    const pendingAmount = invoices.filter(i => ["PENDING", "SENT", "OVERDUE"].includes(i.status)).reduce((sum, i) => sum + i.amountDue, 0)

    if (loading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                        <p className="text-sm text-gray-500">Cargando facturas...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-full">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Facturación</h1>
                        <p className="text-sm sm:text-base text-gray-600 mt-1">
                            Administra facturas, pagos y cobranzas
                        </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button variant="outline" className="flex-1 sm:flex-none text-sm">
                            <Download className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Exportar</span>
                            <span className="sm:hidden">Export</span>
                        </Button>
                        <Button className="flex-1 sm:flex-none text-sm" onClick={() => setCreateDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Nueva Factura</span>
                            <span className="sm:hidden">Nueva</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
                <Card className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                        <div>
                            <div className="text-xs sm:text-sm text-gray-500">Total</div>
                            <div className="text-lg sm:text-2xl font-bold">{totalInvoices}</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-3 sm:p-4 bg-green-50 border-green-200">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                        <div>
                            <div className="text-xs sm:text-sm text-green-700">Pagadas</div>
                            <div className="text-lg sm:text-2xl font-bold text-green-800">{paidInvoices}</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-3 sm:p-4 bg-yellow-50 border-yellow-200">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
                        <div>
                            <div className="text-xs sm:text-sm text-yellow-700">Pendientes</div>
                            <div className="text-lg sm:text-2xl font-bold text-yellow-800">{pendingInvoices}</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-3 sm:p-4 bg-red-50 border-red-200">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                        <div>
                            <div className="text-xs sm:text-sm text-red-700">Vencidas</div>
                            <div className="text-lg sm:text-2xl font-bold text-red-800">{overdueInvoices}</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-3 sm:p-4 bg-blue-50 border-blue-200">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                        <div>
                            <div className="text-xs sm:text-sm text-blue-700">Cobrado</div>
                            <div className="text-lg sm:text-xl font-bold text-blue-800">S/ {paidAmount}</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-3 sm:p-4 bg-orange-50 border-orange-200">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
                        <div>
                            <div className="text-xs sm:text-sm text-orange-700">Por Cobrar</div>
                            <div className="text-lg sm:text-xl font-bold text-orange-800">S/ {pendingAmount.toFixed(0)}</div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filtros */}
            <div className="space-y-4 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Buscar por número, cliente, DNI, medidor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los estados</SelectItem>
                            <SelectItem value="DRAFT">Borrador</SelectItem>
                            <SelectItem value="PENDING">Pendiente</SelectItem>
                            <SelectItem value="SENT">Enviada</SelectItem>
                            <SelectItem value="PAID">Pagada</SelectItem>
                            <SelectItem value="PARTIALLY_PAID">Pago Parcial</SelectItem>
                            <SelectItem value="OVERDUE">Vencida</SelectItem>
                            <SelectItem value="CANCELLED">Cancelada</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Período" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todo el período</SelectItem>
                            <SelectItem value="30d">Últimos 30 días</SelectItem>
                            <SelectItem value="3m">Últimos 3 meses</SelectItem>
                            <SelectItem value="6m">Últimos 6 meses</SelectItem>
                            <SelectItem value="1y">Último año</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Contenido */}
            {/* Vista de tabla para desktop */}
            <div className="hidden md:block bg-white rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Factura</TableHead>
                            <TableHead>Cliente / Medidor</TableHead>
                            <TableHead>Período</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                            <TableHead className="text-right">Por Pagar</TableHead>
                            <TableHead>Vencimiento</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredInvoices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                    No se encontraron facturas
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredInvoices.map((invoice) => (
                                <TableRow key={invoice.id}>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{invoice.invoiceNumber}</div>
                                            <div className="text-sm text-gray-500">
                                                {invoice.issuedAt.split('T')[0].split('-').reverse().join('/')}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{invoice.user.name || "Sin nombre"}</div>
                                            <div className="text-sm text-gray-500">
                                                DNI: {invoice.user.dni} | {invoice.sensor.numero_medidor}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {invoice.periodStart.split('T')[0].split('-').slice(1).reverse().join('/')} -{" "}
                                            {invoice.periodEnd.split('T')[0].split('-').reverse().join('/')}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className="font-medium">S/ {invoice.totalAmount.toFixed(2)}</span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className={`font-medium ${invoice.amountDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            S/ {invoice.amountDue.toFixed(2)}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {invoice.dueDate.split('T')[0].split('-').reverse().join('/')}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(invoice.status)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-2 justify-end">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setViewInvoice(invoice)}
                                                title="Ver"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setEditInvoice(invoice)}
                                                title="Editar"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Vista de tarjetas para móviles */}
            <div className="md:hidden space-y-4">
                {filteredInvoices.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">No se encontraron facturas</p>
                    </div>
                ) : (
                    filteredInvoices.map((invoice) => (
                        <Card key={invoice.id} className="p-4">
                            <div className="space-y-3">
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-medium text-base">{invoice.invoiceNumber}</h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {invoice.user.name || "Sin nombre"} - DNI: {invoice.user.dni}
                                        </p>
                                    </div>
                                    {getStatusBadge(invoice.status)}
                                </div>

                                {/* Medidor y período */}
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-gray-500">Medidor:</span>
                                        <div className="font-medium">{invoice.sensor.numero_medidor}</div>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Período:</span>
                                        <div>{format(new Date(invoice.periodStart), "MMM", { locale: es })}</div>
                                    </div>
                                </div>

                                {/* Importes */}
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="grid grid-cols-2 gap-3 text-center">
                                        <div>
                                            <div className="text-xs text-gray-500">Total</div>
                                            <div className="text-lg font-bold">S/ {invoice.totalAmount.toFixed(2)}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">Por Pagar</div>
                                            <div className={`text-lg font-bold ${invoice.amountDue > 0 ? 'text-red-600' : 'text-green-600'
                                                }`}>
                                                S/ {invoice.amountDue.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Fechas */}
                                <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                                    <div>
                                        <span className="font-medium">Emitida:</span>{" "}
                                        {format(new Date(invoice.issuedAt), "dd/MM/yyyy", { locale: es })}
                                    </div>
                                    <div>
                                        <span className="font-medium">Vence:</span>{" "}
                                        {format(new Date(invoice.dueDate), "dd/MM/yyyy", { locale: es })}
                                    </div>
                                </div>

                                {/* Acciones */}
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => setViewInvoice(invoice)}
                                    >
                                        <Eye className="h-4 w-4 mr-2" />
                                        Ver
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => setEditInvoice(invoice)}
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Editar
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Dialogs */}
            <CreateInvoiceDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onInvoiceCreated={fetchData}
            />

            {editInvoice && (
                <EditInvoiceDialog
                    open={!!editInvoice}
                    onOpenChange={(open) => !open && setEditInvoice(null)}
                    onInvoiceUpdated={fetchData}
                    invoice={editInvoice}
                />
            )}

            {viewInvoice && (
                <ViewInvoiceDialog
                    open={!!viewInvoice}
                    onOpenChange={(open) => !open && setViewInvoice(null)}
                    invoice={viewInvoice}
                />
            )}
        </div>
    )
}