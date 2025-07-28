// src/components/reports/export-button.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Download } from "lucide-react"

interface ExportButtonProps {
    reportType: string
    filters: Record<string, string>
    className?: string // Agregar className opcional
}

export function ExportButton({ reportType, filters, className }: ExportButtonProps) {
    const [exporting, setExporting] = useState(false)

    const exportReport = async (format: string) => {
        setExporting(true)
        try {
            const response = await fetch('/api/reports/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reportType,
                    format,
                    filters
                })
            })

            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${reportType}_${new Date().toISOString().split('T')[0]}.${format}`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
            }
        } catch (error) {
            console.error('Error exporting report:', error)
        } finally {
            setExporting(false)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={exporting} className={className}>
                    <Download className="h-4 w-4 mr-2" />
                    {exporting ? 'Exportando...' : 'Exportar'}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportReport('csv')}>
                    Exportar como CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportReport('xlsx')}>
                    Exportar como Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportReport('pdf')}>
                    Exportar como PDF
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}