// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server"

export async function POST() {
  const response = NextResponse.json(
    { success: true },
    { status: 200 }
  )

  // Eliminar cookie correctamente
  response.headers.set(
    "Set-Cookie",
    "auth-token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax"
  )

  return response
}