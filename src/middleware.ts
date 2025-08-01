import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this'
)

// Rutas públicas que no requieren autenticación
const publicRoutes = [
  '/',  // Página principal pública
  '/login', 
  '/register', 
  '/forgot-password', 
  '/reset-password'
]

// Rutas que NO deben ser accesibles para usuarios autenticados
const authOnlyRoutes = ['/login', '/register', '/forgot-password', '/reset-password']

// Mapeo de rutas a módulos requeridos
const routeModules: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/users': 'users',
  '/roles': 'roles',
  '/sensors': 'sensors',
  '/maps': 'maps',
  '/consumption': 'consumption',
  '/billing': 'billing',
  '/alarms': 'alarms',
  '/maintenance': 'maintenance',
  '/reports': 'reports',
  '/settings': 'settings'
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Permitir archivos estáticos y API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Obtener token de las cookies
  const token = request.cookies.get('auth-token')?.value
  
  // ===== NUEVA LÓGICA: Redirigir usuarios autenticados desde rutas de auth =====
  if (token && authOnlyRoutes.some(route => pathname.startsWith(route))) {
    try {
      // Verificar si el token es válido
      await jwtVerify(token, secret)
      // Si el token es válido, redirigir a dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } catch {
      // Si el token no es válido, permitir acceso a la página de login
      // y eliminar la cookie inválida
      const response = NextResponse.next()
      response.cookies.delete('auth-token')
      return response
    }
  }
  
  // ===== LÓGICA EXISTENTE: Protección de rutas privadas =====
  
  // Permitir rutas públicas
  if (publicRoutes.some(route => pathname === route || (route !== '/' && pathname.startsWith(route)))) {
    return NextResponse.next()
  }
  
  // Si no hay token, redirigir a login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    // Verificar token
    const { payload } = await jwtVerify(token, secret)
    
    // Super admin tiene acceso a todo
    if (payload.isSuperAdmin) {
      return NextResponse.next()
    }
    
    // Encontrar el módulo requerido para esta ruta
    const requiredModule = Object.entries(routeModules).find(([route]) => 
      pathname.startsWith(route)
    )?.[1]
    
    if (!requiredModule) {
      // Si no hay módulo específico, permitir acceso
      return NextResponse.next()
    }
    
    // Verificar si el usuario tiene acceso al módulo
    const hasAccess = await checkUserModuleAccess(
      payload.userId as string,
      requiredModule
    )
    
    if (!hasAccess) {
      // Redirigir a dashboard si no tiene acceso
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    return NextResponse.next()
  } catch (error) {
    // Token inválido o expirado - eliminar cookie y redirigir a login
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('auth-token')
    return response
  }
}

// Función para verificar acceso a módulos via API
async function checkUserModuleAccess(userId: string, moduleName: string): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3001'}/api/auth/check-access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, moduleName }),
    })
    
    if (!response.ok) return false
    
    const data = await response.json()
    return data.hasAccess
  } catch {
    return false
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}