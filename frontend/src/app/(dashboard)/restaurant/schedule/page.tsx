'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { useCampaigns } from '@/lib/queries'
import { Calendar, Clock, MessageSquare, Loader2, Plus } from 'lucide-react'
import Link from 'next/link'
import { format, parseISO, startOfWeek, addDays, isSameDay } from 'date-fns'

export default function SchedulePage() {
    const { restaurantId, isLoading: authLoading } = useAuth()
    const { data: campaigns = [], isLoading } = useCampaigns(restaurantId)

    // Get scheduled campaigns
    const scheduledCampaigns = useMemo(() =>
        campaigns
            .filter(c => c.status === 'scheduled' && c.scheduled_at)
            .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime()),
        [campaigns]
    )

    // Get upcoming week dates
    const weekDates = useMemo(() => {
        const start = startOfWeek(new Date(), { weekStartsOn: 0 })
        return Array.from({ length: 7 }, (_, i) => addDays(start, i))
    }, [])

    // Group campaigns by date
    const campaignsByDate = useMemo(() => {
        const grouped = new Map<string, typeof scheduledCampaigns>()
        scheduledCampaigns.forEach(campaign => {
            const dateKey = format(parseISO(campaign.scheduled_at!), 'yyyy-MM-dd')
            if (!grouped.has(dateKey)) {
                grouped.set(dateKey, [])
            }
            grouped.get(dateKey)!.push(campaign)
        })
        return grouped
    }, [scheduledCampaigns])

    if (authLoading || isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Schedule</h1>
                    <p className="text-muted-foreground mt-1">View and manage your scheduled campaigns</p>
                </div>
                <Link href="/restaurant/campaigns/new">
                    <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                        <Plus className="mr-2 h-4 w-4" />
                        New Campaign
                    </Button>
                </Link>
            </div>

            {/* Weekly Calendar View */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        This Week
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Scheduled campaigns for the current week
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-7 gap-2">
                        {weekDates.map((date) => {
                            const dateKey = format(date, 'yyyy-MM-dd')
                            const dayCampaigns = campaignsByDate.get(dateKey) || []
                            const isToday = isSameDay(date, new Date())

                            return (
                                <div
                                    key={dateKey}
                                    className={`
                                        p-3 rounded-lg border min-h-[120px]
                                        ${isToday
                                            ? 'border-primary bg-primary/10'
                                            : 'border-border bg-background'
                                        }
                                    `}
                                >
                                    <div className="text-center mb-2">
                                        <p className="text-xs text-muted-foreground">{format(date, 'EEE')}</p>
                                        <p className={`text-lg font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                                            {format(date, 'd')}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        {dayCampaigns.slice(0, 2).map(campaign => (
                                            <div
                                                key={campaign.id}
                                                className="p-1.5 rounded bg-indigo-500/20 text-xs text-indigo-300 truncate"
                                            >
                                                {campaign.name}
                                            </div>
                                        ))}
                                        {dayCampaigns.length > 2 && (
                                            <p className="text-xs text-muted-foreground text-center">
                                                +{dayCampaigns.length - 2} more
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Upcoming Campaigns List */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                        <Clock className="h-5 w-5 text-amber-500" />
                        Upcoming Campaigns
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        All scheduled campaigns in chronological order
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {scheduledCampaigns.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Calendar className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                            <p className="font-medium">No scheduled campaigns</p>
                            <p className="text-sm mt-1">Create a new campaign and schedule it for later</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {scheduledCampaigns.map(campaign => (
                                <div
                                    key={campaign.id}
                                    className="flex items-center justify-between p-4 rounded-lg bg-background border border-border"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                            <MessageSquare className="h-5 w-5 text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">{campaign.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(parseISO(campaign.scheduled_at!), 'MMM d, yyyy h:mm a')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                                            {campaign.total_recipients} recipients
                                        </Badge>
                                        <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30">
                                            Scheduled
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
