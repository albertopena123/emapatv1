// src/app/api/users/export/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Extend jsPDF type
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

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => jsPDF;
  }
}

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permiso de exportación
    const canExport = await hasPermission(user.userId, 'users', 'export', 'users')
    if (!canExport) {
      return NextResponse.json({ error: 'Sin permisos para exportar' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'excel'

    // Obtener usuarios con sus relaciones
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        dni: true,
        isActive: true,
        isSuperAdmin: true,
        fechaNacimiento: true,
        sexo: true,
        ubigeoNac: true,
        direccion: true,
        createdAt: true,
        lastLogin: true,
        role: {
          select: {
            displayName: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Preparar datos para exportación
    const exportData = users.map(user => ({
      'Nombre': user.name || 'Sin nombre',
      'DNI': user.dni,
      'Email': user.email || '-',
      'Rol': user.role?.displayName || '-',
      'Estado': user.isActive ? 'Activo' : 'Inactivo',
      'Super Admin': user.isSuperAdmin ? 'Sí' : 'No',
      'Fecha Nacimiento': user.fechaNacimiento ? new Date(user.fechaNacimiento).toLocaleDateString('es-PE') : '-',
      'Sexo': user.sexo === 'M' ? 'Masculino' : user.sexo === 'F' ? 'Femenino' : user.sexo === 'O' ? 'Otro' : '-',
      'Dirección': user.direccion || '-',
      'Último Ingreso': user.lastLogin ? new Date(user.lastLogin).toLocaleString('es-PE') : 'Nunca',
      'Fecha Registro': new Date(user.createdAt).toLocaleString('es-PE')
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
      doc.text('Listado de Usuarios', 14, 20)
      
      // Fecha de generación
      doc.setFontSize(10)
      doc.text(`Generado: ${new Date().toLocaleString('es-PE')}`, 14, 30)

      // Tabla
      autoTable(doc, {
        head: [Object.keys(exportData[0])],
        body: exportData.map(user => Object.values(user)),
        startY: 40,
        styles: { 
          fontSize: 8,
          cellPadding: 2
        },
        headStyles: { 
          fillColor: [66, 139, 202],
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
          'Content-Disposition': `attachment; filename="usuarios_${new Date().toISOString().split('T')[0]}.pdf"`
        }
      })

    } else {
      // Generar Excel
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios')

      // Ajustar anchos de columna
      const columnWidths = [
        { wch: 30 }, // Nombre
        { wch: 10 }, // DNI
        { wch: 30 }, // Email
        { wch: 20 }, // Rol
        { wch: 10 }, // Estado
        { wch: 12 }, // Super Admin
        { wch: 15 }, // Fecha Nacimiento
        { wch: 12 }, // Sexo
        { wch: 40 }, // Dirección
        { wch: 20 }, // Último Ingreso
        { wch: 20 }  // Fecha Registro
      ]
      worksheet['!cols'] = columnWidths

      // Generar buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="usuarios_${new Date().toISOString().split('T')[0]}.xlsx"`
        }
      })
    }

  } catch (error) {
    console.error("Error exporting users:", error)
    return NextResponse.json(
      { error: "Error al exportar usuarios" },
      { status: 500 }
    )
  }
}