'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Building2,
    Users,
    TrendingUp,
    Phone,
    ArrowRight,
    Plus,
    Euro,
    MessageSquare,
    Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { useAgencyRestaurants, useAgencies } from '@/lib/queries'
import { useQuery } from '@tanstack/react-query'
import { statsApi, transactionApi } from '@/lib/api'
import { format } from 'date-fns'

const statusColors = {
    active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    suspended: 'bg-red-500/10 text-red-500 border-red-500/20',
}

export default function AgencyDashboard() {
    const { setSelectedRestaurantId } = useAuth()
    const router = useRouter()

    // Fetch agencies to get ID
    const { data: agencies } = useAgencies()
    const agencyId = agencies?.[0]?.id

    // Fetch real restaurants via agency scope
    const { data: restaurantsData = [], isLoading } = useAgencyRestaurants(agencyId || '')

    // Aggregate stats from real data
    const totalRestaurants = restaurantsData.length
    const totalCustomers = restaurantsData.reduce((acc: number, r: any) => acc + (r.total_customers || 0), 0)
    const totalMessages = restaurantsData.reduce((acc: number, r: any) => acc + (r.total_messages_sent || 0), 0)

    // Fetch stats
    const { data: agencyStats } = useQuery({
        queryKey: ['agency-stats', agencyId],
        queryFn: async () => {
            const { data } = await statsApi.getAgencyStats(agencyId!)
            return data
        },
        enabled: !!agencyId
    })

    // Fetch agency transactions
    const { data: transactions } = useQuery({
        queryKey: ['agency-transactions', agencyId],
        queryFn: async () => {
            const { data } = await transactionApi.getAgencyTransactions(agencyId!)
            return data
        },
        enabled: !!agencyId
    })

    const stats = [
        {
            title: 'Total Restaurants',
            value: agencyStats?.total_restaurants?.value?.toString() || totalRestaurants.toString(),
            change: agencyStats?.total_restaurants?.change || '+0 this month',
            icon: Building2,
            color: 'from-indigo-500 to-indigo-600',
        },
        {
            title: 'Active Customers',
            value: agencyStats?.active_customers?.value?.toLocaleString() || totalCustomers.toLocaleString(),
            change: agencyStats?.active_customers?.change || '+0',
            icon: Users,
            color: 'from-purple-500 to-purple-600',
        },
        {
            title: 'Messages Sent',
            value: agencyStats?.messages_sent?.value ? (agencyStats.messages_sent.value > 1000 ? `${(agencyStats.messages_sent.value / 1000).toFixed(1)}K` : agencyStats.messages_sent.value.toString()) : (totalMessages > 1000 ? `${(totalMessages / 1000).toFixed(1)}K` : totalMessages.toString()),
            change: agencyStats?.messages_sent?.change || 'this month',
            icon: MessageSquare,
            color: 'from-emerald-500 to-emerald-600',
        },
        {
            title: 'Monthly Budget capacity',
            value: `£${(agencies?.[0]?.budget_monthly_gbp || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            change: `£${(agencies?.[0]?.current_spend_gbp || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} spent`,
            icon: Euro,
            color: 'from-amber-500 to-amber-600',
        },
    ]

    const handleManage = (restaurantId: string) => {
        setSelectedRestaurantId(restaurantId)
        router.push('/restaurant/dashboard')
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Agency Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Manage your restaurants and monitor performance.</p>
                </div>
                <Link href="/agency/restaurants/new">
                    <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Restaurant
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <Card key={stat.title} className="bg-card border-border backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                                    <stat.icon className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                                    {stat.change}
                                </span>
                            </div>
                            <div className="mt-4">
                                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                                <p className="text-sm text-muted-foreground">{stat.title}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Restaurants List */}
                <Card className="bg-card border-border backdrop-blur-sm lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-foreground">Your Restaurants</CardTitle>
                            <CardDescription className="text-muted-foreground">Manage restaurant accounts</CardDescription>
                        </div>
                        <Link href="/agency/restaurants">
                            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                                View all <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Restaurant</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Customers</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Messages</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {restaurantsData.map((restaurant: any) => (
                                        <tr key={restaurant.id} className="border-b border-border hover:bg-muted/50">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        <Building2 className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <span className="font-medium text-foreground">{restaurant.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-foreground/80">{(restaurant.total_customers || 0).toLocaleString()}</td>
                                            <td className="py-4 px-4 text-foreground/80">{(restaurant.total_messages_sent || 0).toLocaleString()}</td>
                                            <td className="py-4 px-4">
                                                <Badge variant="outline" className={statusColors[restaurant.status as keyof typeof statusColors] || statusColors.pending}>
                                                    {restaurant.status}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-primary hover:bg-primary/10 border-primary/20"
                                                    onClick={() => handleManage(restaurant.id)}
                                                >
                                                    Manage
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Agency Transactions */}
                <Card className="bg-card border-border backdrop-blur-sm lg:col-span-2 mt-6">
                    <CardHeader>
                        <CardTitle className="text-foreground">Recent Transactions</CardTitle>
                        <CardDescription className="text-muted-foreground">Billing operations across all your restaurants</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Restaurant</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Description</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Amount (£)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!transactions || transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-muted-foreground">
                                                No recent transactions found.
                                            </td>
                                        </tr>
                                    ) : (
                                        transactions.slice(0, 5).map((tx: any) => {
                                            const relatedRest = restaurantsData.find((r: any) => r.id === tx.restaurant_id)
                                            return (
                                                <tr key={tx.id} className="border-b border-border hover:bg-muted/50">
                                                    <td className="py-4 px-4 text-sm text-foreground">
                                                        {format(new Date(tx.created_at), 'MMM d, yyyy h:mm a')}
                                                    </td>
                                                    <td className="py-4 px-4 text-sm text-foreground font-medium">
                                                        {relatedRest ? relatedRest.name : 'Unknown Restaurant'}
                                                    </td>
                                                    <td className="py-4 px-4 text-sm text-foreground">
                                                        {tx.description}
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <Badge variant="outline" className="capitalize">
                                                            {tx.transaction_type.replace('_', ' ')}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-4 px-4 text-sm text-right font-medium text-foreground">
                                                        £{Math.abs(tx.amount_gbp).toFixed(2)}
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
