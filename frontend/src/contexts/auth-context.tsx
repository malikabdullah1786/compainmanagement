'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface UserProfile {
    id: string
    role: 'superadmin' | 'agency_admin' | 'restaurant_admin'
    is_verified: boolean
    business_name: string | null
    restaurant_id: string | null
}

interface AuthContextType {
    user: User | null
    profile: UserProfile | null
    restaurantId: string | null
    isLoading: boolean
    error: string | null
    refetch: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const supabase = createClient()

    async function fetchProfile() {
        try {
            setIsLoading(true)
            setError(null)

            const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()

            if (authError || !currentUser) {
                setUser(null)
                setProfile(null)
                return
            }

            setUser(currentUser)

            // Fetch profile using RPC function
            const { data: profileData, error: profileError } = await supabase
                .rpc('get_my_profile')
                .single()

            if (profileError) {
                console.error('Profile fetch error:', profileError)
                setError('Failed to load profile')
                return
            }

            setProfile(profileData as UserProfile)
        } catch (err) {
            console.error('Auth context error:', err)
            setError('Authentication error')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchProfile()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                await fetchProfile()
            } else if (event === 'SIGNED_OUT') {
                setUser(null)
                setProfile(null)
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    const value: AuthContextType = {
        user,
        profile,
        restaurantId: profile?.restaurant_id ?? null,
        isLoading,
        error,
        refetch: fetchProfile,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

// Convenience hook for getting restaurant ID with loading state
export function useRestaurantId() {
    const { restaurantId, isLoading, error } = useAuth()
    return { restaurantId, isLoading, error }
}
