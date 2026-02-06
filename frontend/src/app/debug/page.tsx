'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DebugPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            const supabase = createClient()

            // Get current user
            const { data: userData, error: userError } = await supabase.auth.getUser()

            let profileData = null
            let profileError = null

            if (userData.user) {
                // Try to get profile
                const { data: profile, error: pError } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('id', userData.user.id)
                    .maybeSingle()

                profileData = profile
                profileError = pError
            }

            setData({
                user: userData.user ? {
                    id: userData.user.id,
                    email: userData.user.email,
                    metadata: userData.user.user_metadata
                } : null,
                userError,
                profile: profileData,
                profileError
            })
            setLoading(false)
        }

        fetchData()
    }, [])

    if (loading) return <div className="p-8 text-white">Loading...</div>

    return (
        <div className="min-h-screen bg-slate-900 p-8">
            <h1 className="text-2xl font-bold text-white mb-6">Debug Page</h1>
            <pre className="bg-slate-800 p-4 rounded-lg text-green-400 overflow-auto">
                {JSON.stringify(data, null, 2)}
            </pre>
        </div>
    )
}
