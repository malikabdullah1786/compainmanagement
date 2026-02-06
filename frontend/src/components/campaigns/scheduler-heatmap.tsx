'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface Campaign {
    id: string
    name: string
    scheduled_at: string | null
    status: string
}

interface SchedulerHeatmapProps {
    campaigns: Campaign[]
    className?: string
}

// Generate hours 0-23
const hours = Array.from({ length: 24 }, (_, i) => i)

// Dead hours for restaurants (2-5 PM = 14-17)
const deadHours = [14, 15, 16, 17]

export function SchedulerHeatmap({ campaigns, className }: SchedulerHeatmapProps) {
    // Count campaigns per hour
    const hourCounts = useMemo(() => {
        const counts = new Map<number, Campaign[]>()

        campaigns.forEach((campaign) => {
            if (campaign.scheduled_at) {
                const date = new Date(campaign.scheduled_at)
                const hour = date.getHours()
                const existing = counts.get(hour) || []
                counts.set(hour, [...existing, campaign])
            }
        })

        return counts
    }, [campaigns])

    const maxCount = Math.max(...Array.from(hourCounts.values()).map(c => c.length), 1)

    function getHourLabel(hour: number) {
        const ampm = hour < 12 ? 'AM' : 'PM'
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
        return `${displayHour} ${ampm}`
    }

    function getHeatColor(count: number, isDeadHour: boolean) {
        if (count === 0) {
            return isDeadHour ? 'bg-indigo-500/10' : 'bg-slate-800/50'
        }
        const intensity = Math.min(count / maxCount, 1)
        if (intensity < 0.33) return 'bg-emerald-500/30'
        if (intensity < 0.66) return 'bg-emerald-500/50'
        return 'bg-emerald-500/80'
    }

    return (
        <TooltipProvider delayDuration={0}>
            <div className={cn('space-y-4', className)}>
                <div className="flex items-center justify-between text-sm">
                    <h4 className="font-medium text-slate-200">Campaign Schedule Heatmap</h4>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded bg-indigo-500/30 border border-indigo-500/50" />
                            <span>Dead Hours</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded bg-emerald-500/50" />
                            <span>Scheduled</span>
                        </div>
                    </div>
                </div>

                {/* Heatmap Grid */}
                <div className="flex gap-1">
                    {hours.map((hour) => {
                        const campaignsAtHour = hourCounts.get(hour) || []
                        const isDeadHour = deadHours.includes(hour)
                        const hasNoCoverage = isDeadHour && campaignsAtHour.length === 0

                        return (
                            <Tooltip key={hour}>
                                <TooltipTrigger asChild>
                                    <div
                                        className={cn(
                                            'flex-1 h-12 rounded-sm cursor-pointer transition-all hover:opacity-80 relative',
                                            getHeatColor(campaignsAtHour.length, isDeadHour),
                                            isDeadHour && 'border border-indigo-500/30',
                                            hasNoCoverage && 'border-dashed'
                                        )}
                                    >
                                        {campaignsAtHour.length > 0 && (
                                            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                                                {campaignsAtHour.length}
                                            </span>
                                        )}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent
                                    side="top"
                                    className="bg-slate-800 border-slate-700 max-w-xs"
                                >
                                    <div className="text-sm">
                                        <p className="font-medium text-white">{getHourLabel(hour)}</p>
                                        {isDeadHour && (
                                            <p className="text-indigo-400 text-xs">Dead Hour - Optimal for campaigns</p>
                                        )}
                                        {campaignsAtHour.length > 0 ? (
                                            <ul className="mt-1 space-y-1">
                                                {campaignsAtHour.map((c) => (
                                                    <li key={c.id} className="text-xs text-slate-300">
                                                        • {c.name}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-xs text-slate-400 mt-1">
                                                {isDeadHour ? 'No coverage - consider scheduling here!' : 'No campaigns scheduled'}
                                            </p>
                                        )}
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        )
                    })}
                </div>

                {/* Hour Labels */}
                <div className="flex gap-1">
                    {hours.map((hour) => (
                        <div
                            key={hour}
                            className={cn(
                                'flex-1 text-center text-xs',
                                hour % 4 === 0 ? 'text-slate-400' : 'text-transparent'
                            )}
                        >
                            {getHourLabel(hour).split(' ')[0]}
                        </div>
                    ))}
                </div>

                {/* AM/PM Labels */}
                <div className="flex text-xs text-slate-500">
                    <span className="flex-1 text-left">12 AM</span>
                    <span className="flex-1 text-center">12 PM</span>
                    <span className="flex-1 text-right">11 PM</span>
                </div>
            </div>
        </TooltipProvider>
    )
}
