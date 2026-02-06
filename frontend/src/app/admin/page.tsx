'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

// Admin route now redirects to main login
// Superadmins use the regular login flow and are routed based on their role
export default function AdminLoginPage() {
    const router = useRouter()

    useEffect(() => {
        async function checkAndRedirect() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                // Check if user is superadmin
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('role, is_verified')
                    .eq('id', user.id)
                    .maybeSingle()

                if (profile?.role === 'superadmin' && profile.is_verified) {
                    // Already logged in as superadmin, go to dashboard
                    router.push('/admin/dashboard')
                    return
                }
            }

            // Not logged in or not superadmin, redirect to main login
            router.push('/login')
        }

        checkAndRedirect()
    }, [router])

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Redirecting...</p>
            </div>
        </div>
    )
}
