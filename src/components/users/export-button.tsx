// src/components/users/export-button.tsx
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

export function ExportButton() {
    const [loading, setLoading] = useState(false)

    const handleExport = async (format: 'excel' | 'pdf') => {
        setLoading(true)
        const loadingToast = toast.loading(`Generando archivo ${format.toUpperCase()}...`)

        try {
            const response = await fetch(`/api/users/export?format=${format}`)

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Error al exportar')
            }

            // Obtener el blob del response
            const blob = await response.blob()

            // Crear URL del blob
            const url = window.URL.createObjectURL(blob)

            // Crear link temporal para descargar
            const link = document.createElement('a')
            link.href = url
            link.download = `usuarios_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`

            // Trigger download
            document.body.appendChild(link)
            link.click()

            // Limpiar
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
                <Button variant="outline" disabled={loading} className="flex-1 sm:flex-initial">
                    {loading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4 mr-2" />
                    )}
                    Exportar
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