// src/components/consumption/export-button.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FileSpreadsheet, FileText, Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function ExportConsumptionButton() {
    const [loading, setLoading] = useState(false)

    const handleExport = async (format: 'excel' | 'pdf') => {
        setLoading(true)
        const loadingToast = toast.loading(`Generando archivo ${format.toUpperCase()}...`)

        try {
            const response = await fetch(`/api/water-consumptions/export?format=${format}`)

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Error al exportar')
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)

            const link = document.createElement('a')
            link.href = url
            link.download = `consumos_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`

            document.body.appendChild(link)
            link.click()

            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            toast.dismiss(loadingToast)
            toast.success(`Archivo ${format.toUpperCase()} descargado exitosamente`, {
                description: 'El archivo se ha guardado en tu carpeta de descargas',
                duration: 5000,
            })
        } catch (error) {
            toast.dismiss(loadingToast)
            toast.error(
                error instanceof Error ? error.message : 'Error al exportar',
                {
                    description: 'Por favor, intenta nuevamente',
                    duration: 5000,
                }
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={loading} className="flex-1 sm:flex-none text-sm">
                    {loading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4 mr-2" />
                    )}
                    <span className="hidden sm:inline">Exportar</span>
                    <span className="sm:hidden">Export</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('excel')}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Exportar como Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    <FileText className="mr-2 h-4 w-4" />
                    Exportar como PDF
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}