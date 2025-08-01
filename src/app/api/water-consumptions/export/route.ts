// src/app/api/water-consumptions/export/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface AutoTableOptions {
  head: string[][];
  body: (string | number)[][];
  startY: number;
  styles?: {
    fontSize?: number;
    cellPadding?: number;
  };
  headStyles?: {
    fillColor?: number[];
    textColor?: number;
  };
  alternateRowStyles?: {
    fillColor?: number[];
  };
}

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'excel'

    // Obtener consumos con sus relaciones
    const consumptions = await prisma.waterConsumption.findMany({
      select: {
        id: true,
        amount: true,
        readingDate: true,
        previousAmount: true,
        consumption: true,
        timestamp: true,
        serial: true,
        invoiced: true,
        source: true,
        notes: true,
        sensor: {
          select: {
            numero_medidor: true,
            name: true,
            direccion: true,
            user: {
              select: {
                name: true,
                dni: true
              }
            }
          }
        },
        user: {
          select: {
            name: true,
            dni: true
          }
        },
        tarifa: {
          select: {
            name: true,
            tariffCategory: {
              select: {
                displayName: true
              }
            }
          }
        }
      },
      orderBy: {
        readingDate: "desc"
      }
    })

    // Preparar datos para exportación
    const exportData = consumptions.map(consumption => ({
      'N° Medidor': consumption.sensor.numero_medidor,
      'Cliente': consumption.user.name || 'Sin nombre',
      'DNI': consumption.user.dni,
      'Dirección': consumption.sensor.direccion,
      'Fecha Lectura': new Date(consumption.readingDate).toLocaleString('es-PE'),
      'Lectura Anterior': consumption.previousAmount?.toFixed(2) || '0.00',
      'Lectura Actual': consumption.amount.toFixed(2),
      'Consumo (L)': consumption.consumption?.toFixed(2) || '0.00',
      'Tarifa': consumption.tarifa ? `${consumption.tarifa.name} (${consumption.tarifa.tariffCategory.displayName})` : '-',
      'Origen': consumption.source === 'AUTOMATIC' ? 'Automático' : consumption.source === 'IMPORTED' ? 'Importado' : 'Manual',
      'Estado': consumption.invoiced ? 'Facturado' : 'Pendiente',
      'Notas': consumption.notes || '-'
    }))

    if (format === 'pdf') {
      // Generar PDF
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })

      // Título
      doc.setFontSize(20)
      doc.text('Reporte de Consumo de Agua', 14, 20)
      
      // Fecha de generación
      doc.setFontSize(10)
      doc.text(`Generado: ${new Date().toLocaleString('es-PE')}`, 14, 30)

      // Tabla
      autoTable(doc, {
        head: [Object.keys(exportData[0])],
        body: exportData.map(consumption => Object.values(consumption)),
        startY: 40,
        styles: { 
          fontSize: 7,
          cellPadding: 1.5
        },
        headStyles: { 
          fillColor: [41, 128, 185],
          textColor: 255 
        },
        alternateRowStyles: { 
          fillColor: [245, 245, 245] 
        }
      })

      // Convertir a buffer
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="consumos_${new Date().toISOString().split('T')[0]}.pdf"`
        }
      })

    } else {
      // Generar Excel
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Consumos')

      // Ajustar anchos de columna
      const columnWidths = [
        { wch: 15 }, // N° Medidor
        { wch: 30 }, // Cliente
        { wch: 10 }, // DNI
        { wch: 40 }, // Dirección
        { wch: 20 }, // Fecha Lectura
        { wch: 15 }, // Lectura Anterior
        { wch: 15 }, // Lectura Actual
        { wch: 15 }, // Consumo
        { wch: 30 }, // Tarifa
        { wch: 12 }, // Origen
        { wch: 12 }, // Estado
        { wch: 30 }  // Notas
      ]
      worksheet['!cols'] = columnWidths

      // Generar buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="consumos_${new Date().toISOString().split('T')[0]}.xlsx"`
        }
      })
    }

  } catch (error) {
    console.error("Error exporting consumptions:", error)
    return NextResponse.json(
      { error: "Error al exportar consumos" },
      { status: 500 }
    )
  }
}