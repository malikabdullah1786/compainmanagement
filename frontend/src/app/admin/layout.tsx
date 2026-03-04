'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Shield, Users, Building2, Store, LogOut, Receipt } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()

    const handleSignOut = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
    }

    if (pathname === '/admin') return <>{children}</>

    return (
        <div className="min-h-screen bg-background">
            <header className="bg-card border-b border-border shadow-sm sticky top-0 z-10 w-full">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 mr-2">
                            <Shield className="h-6 w-6 text-primary" />
                            <h1 className="text-xl font-semibold text-foreground hidden sm:block">Admin Portal</h1>
                        </div>
                        <nav className="hidden md:flex items-center gap-1">
                            <Link href="/admin/dashboard">
                                <Button variant={pathname === '/admin/dashboard' ? 'secondary' : 'ghost'} size="sm">
                                    <Users className="w-4 h-4 mr-2" />
                                    Approvals
                                </Button>
                            </Link>
                            <Link href="/admin/agencies">
                                <Button variant={pathname?.startsWith('/admin/agencies') ? 'secondary' : 'ghost'} size="sm">
                                    <Building2 className="w-4 h-4 mr-2" />
                                    Agencies
                                </Button>
                            </Link>
                            <Link href="/admin/restaurants">
                                <Button variant={pathname?.startsWith('/admin/restaurants') ? 'secondary' : 'ghost'} size="sm">
                                    <Store className="w-4 h-4 mr-2" />
                                    Restaurants
                                </Button>
                            </Link>
                            <Link href="/admin/transactions">
                                <Button variant={pathname?.startsWith('/admin/transactions') ? 'secondary' : 'ghost'} size="sm">
                                    <Receipt className="w-4 h-4 mr-2" />
                                    Transactions
                                </Button>
                            </Link>
                        </nav>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSignOut}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                        </Button>
                    </div>
                </div>
            </header>

            {/* Mobile Nav */}
            <div className="md:hidden border-b border-border bg-card/50 overflow-x-auto">
                <nav className="flex items-center p-2 gap-2 min-w-max">
                    <Link href="/admin/dashboard">
                        <Button variant={pathname === '/admin/dashboard' ? 'secondary' : 'ghost'} size="sm">
                            <Users className="w-4 h-4 mr-2" />
                            Approvals
                        </Button>
                    </Link>
                    <Link href="/admin/agencies">
                        <Button variant={pathname?.startsWith('/admin/agencies') ? 'secondary' : 'ghost'} size="sm">
                            <Building2 className="w-4 h-4 mr-2" />
                            Agencies
                        </Button>
                    </Link>
                    <Link href="/admin/restaurants">
                        <Button variant={pathname?.startsWith('/admin/restaurants') ? 'secondary' : 'ghost'} size="sm">
                            <Store className="w-4 h-4 mr-2" />
                            Restaurants
                        </Button>
                    </Link>
                    <Link href="/admin/transactions">
                        <Button variant={pathname?.startsWith('/admin/transactions') ? 'secondary' : 'ghost'} size="sm">
                            <Receipt className="w-4 h-4 mr-2" />
                            Transactions
                        </Button>
                    </Link>
                </nav>
            </div>

            {children}
        </div>
    )
}
