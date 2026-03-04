import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
    if (request.nextUrl.pathname.startsWith('/api/')) {
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
        const newPathname = request.nextUrl.pathname.replace(/^\/api/, '')
        return NextResponse.rewrite(new URL(`${backendUrl}${newPathname}${request.nextUrl.search}`))
    }

    return await updateSession(request)
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
