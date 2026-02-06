'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Filter, X } from 'lucide-react'

interface SegmentFilterProps {
    availableTags: string[]
    selectedTags: string[]
    onTagsChange: (tags: string[]) => void
    optInStatus?: string
    onOptInStatusChange?: (status: string | undefined) => void
}

const optInStatuses = [
    { value: 'opted_in', label: 'Opted In', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    { value: 'opted_out', label: 'Opted Out', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    { value: 'pending', label: 'Pending', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
]

export function SegmentFilter({
    availableTags,
    selectedTags,
    onTagsChange,
    optInStatus,
    onOptInStatusChange,
}: SegmentFilterProps) {
    const hasFilters = selectedTags.length > 0 || optInStatus

    function toggleTag(tag: string) {
        if (selectedTags.includes(tag)) {
            onTagsChange(selectedTags.filter((t) => t !== tag))
        } else {
            onTagsChange([...selectedTags, tag])
        }
    }

    function clearFilters() {
        onTagsChange([])
        onOptInStatusChange?.(undefined)
    }

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-300"
                    >
                        <Filter className="mr-2 h-4 w-4" />
                        Filters
                        {hasFilters && (
                            <Badge className="ml-2 bg-indigo-500/20 text-indigo-400 border-0 text-xs">
                                {selectedTags.length + (optInStatus ? 1 : 0)}
                            </Badge>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 bg-slate-800 border-slate-700">
                    <DropdownMenuLabel className="text-slate-300">Opt-in Status</DropdownMenuLabel>
                    {optInStatuses.map((status) => (
                        <DropdownMenuCheckboxItem
                            key={status.value}
                            checked={optInStatus === status.value}
                            onCheckedChange={(checked) =>
                                onOptInStatusChange?.(checked ? status.value : undefined)
                            }
                            className="text-slate-300 focus:bg-slate-700 focus:text-white"
                        >
                            {status.label}
                        </DropdownMenuCheckboxItem>
                    ))}

                    {availableTags.length > 0 && (
                        <>
                            <DropdownMenuSeparator className="bg-slate-700" />
                            <DropdownMenuLabel className="text-slate-300">Tags</DropdownMenuLabel>
                            {availableTags.map((tag) => (
                                <DropdownMenuCheckboxItem
                                    key={tag}
                                    checked={selectedTags.includes(tag)}
                                    onCheckedChange={() => toggleTag(tag)}
                                    className="text-slate-300 focus:bg-slate-700 focus:text-white"
                                >
                                    {tag}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Active Filters Display */}
            {hasFilters && (
                <>
                    {optInStatus && (
                        <Badge
                            variant="outline"
                            className={optInStatuses.find((s) => s.value === optInStatus)?.color}
                        >
                            {optInStatuses.find((s) => s.value === optInStatus)?.label}
                            <button
                                onClick={() => onOptInStatusChange?.(undefined)}
                                className="ml-1 hover:text-white"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}
                    {selectedTags.map((tag) => (
                        <Badge
                            key={tag}
                            variant="outline"
                            className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
                        >
                            {tag}
                            <button onClick={() => toggleTag(tag)} className="ml-1 hover:text-white">
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-slate-400 hover:text-white h-7 px-2"
                    >
                        Clear all
                    </Button>
                </>
            )}
        </div>
    )
}
