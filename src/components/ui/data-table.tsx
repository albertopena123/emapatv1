// src/components/ui/data-table.tsx
"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ReactNode } from "react"

interface Row {
    getValue: (key: string) => unknown
}

interface Column {
    accessorKey: string
    header: string
    cell?: ({ row }: { row: Row }) => ReactNode
}

interface DataTableProps {
    columns: Column[]
    data: Record<string, unknown>[]
    loading?: boolean
}

export function DataTable({ columns, data, loading }: DataTableProps) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Cargando...</div>
            </div>
        )
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map((column) => (
                            <TableHead key={column.accessorKey}>
                                {column.header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data?.length ? (
                        data.map((row, index) => (
                            <TableRow key={index}>
                                {columns.map((column) => (
                                    <TableCell key={column.accessorKey}>
                                        {column.cell
                                            ? column.cell({ row: { getValue: (key: string) => getNestedValue(row, key) } })
                                            : String(getNestedValue(row, column.accessorKey) ?? '')
                                        }
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                No hay resultados.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}

// Función auxiliar para acceder a propiedades anidadas como "user.name"
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: unknown, key: string) => {
        if (current && typeof current === 'object' && key in current) {
            return (current as Record<string, unknown>)[key]
        }
        return undefined
    }, obj as unknown)
}