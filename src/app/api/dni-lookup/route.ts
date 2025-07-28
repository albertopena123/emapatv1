// src/app/api/dni-lookup/route.ts
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dni = searchParams.get('dni')

  if (!dni || dni.length !== 8) {
    return NextResponse.json(
      { error: 'DNI debe tener 8 dígitos' },
      { status: 400 }
    )
  }

  try {
    const response = await fetch(`https://apidatos.unamad.edu.pe/api/consulta/${dni}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'No se encontraron datos para este DNI' },
        { status: 404 }
      )
    }

    const data = await response.json()

    // Formatear el nombre completo
    const fullName = `${data.NOMBRES} ${data.AP_PAT} ${data.AP_MAT}`.trim()

    return NextResponse.json({
    success: true,
    data: {
      fullName,
      nombres: data.NOMBRES,
      apellidoPaterno: data.AP_PAT,
      apellidoMaterno: data.AP_MAT,
      fechaNacimiento: data.FECHA_NAC,
      sexo: data.SEXO === '1' ? 'M' : 'F',
      ubigeoNac: data.UBIGEO_NAC,  // Agregar esta línea
      direccion: data.DIRECCION,
    }
  })
  } catch (error) {
    console.error('Error al consultar DNI:', error)
    return NextResponse.json(
      { error: 'Error al consultar los datos del DNI' },
      { status: 500 }
    )
  }
}