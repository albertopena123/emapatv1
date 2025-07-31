// src/app/api/internal/billing/execute/route.ts
import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"

// Importar la lógica de ejecución del API principal
// Para evitar duplicar código, extrae la lógica a una función compartida

export async function POST(request: NextRequest) {
  try {
    // Verificar clave secreta interna
    const headersList = await headers()
    const internalKey = headersList.get('x-internal-key')
    
    // Usar variable de entorno para la clave
    const expectedKey = process.env.INTERNAL_API_KEY || 'default-dev-key'
    
    if (internalKey !== expectedKey) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Redirigir a la API principal pero sin verificar autenticación
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
    const body = await request.json()
    
    // Llamar directamente a la función de ejecución
    // En lugar de hacer otro fetch, importa y ejecuta la lógica directamente
    const { executeBilling } = await import('@/lib/billing-executor')
    const result = await executeBilling(body.configId)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error executing internal billing:", error)
    return NextResponse.json(
      { error: "Error al ejecutar facturación interna" },
      { status: 500 }
    )
  }
}