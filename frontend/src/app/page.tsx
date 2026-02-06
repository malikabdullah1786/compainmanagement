import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Query user_profiles table for correct verification status (not user_metadata which doesn't update)
  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('user_profiles')
    .select('role, is_verified')
    .eq('id', user.id)
    .single()

  // If no profile or not verified, redirect to pending approval
  if (!profile || !profile.is_verified) {
    redirect('/pending-approval')
  }

  // Redirect based on role from database
  if (profile.role === 'superadmin') {
    redirect('/admin/dashboard')
  } else if (profile.role === 'agency_admin') {
    redirect('/agency/dashboard')
  } else {
    redirect('/restaurant/dashboard')
  }
}
