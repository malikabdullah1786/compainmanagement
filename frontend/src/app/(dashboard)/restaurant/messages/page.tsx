'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { MessageSquare, Send, CheckCircle2, Clock, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useRestaurantMessages } from '@/lib/queries'

const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
    delivered: { color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle2 },
    sent: { color: 'bg-primary/10 text-primary border-primary/20', icon: Send },
    queued: { color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Clock },
    failed: { color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle },
    undelivered: { color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle },
}

export default function MessagesPage() {
    const { restaurantId, isLoading: authLoading } = useAuth()
    const { data: messages = [], isLoading: messagesLoading, error } = useRestaurantMessages(restaurantId, 100)

    if (authLoading || messagesLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <p className="text-destructive font-medium">Failed to load messages</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Message Logs</h1>
                <p className="text-muted-foreground mt-1">Review your sent SMS and their delivery status</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Sent Messages</CardTitle>
                    <CardDescription>
                        Recent outreach activity for your restaurant
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Recipient</TableHead>
                                    <TableHead>Message</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {messages.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                            <MessageSquare className="mx-auto h-12 w-12 opacity-20 mb-3" />
                                            <p>No messages sent yet</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    messages.map((msg: any) => {
                                        const status = msg.status?.toLowerCase() || 'queued'
                                        const StatusIcon = statusConfig[status]?.icon || Send
                                        return (
                                            <TableRow key={msg.id}>
                                                <TableCell className="text-sm">
                                                    {new Date(msg.created_at).toLocaleString()}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {msg.to_phone}
                                                </TableCell>
                                                <TableCell className="max-w-md truncate">
                                                    {msg.body}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={statusConfig[status]?.color || 'bg-secondary text-secondary-foreground'}
                                                    >
                                                        <StatusIcon className="mr-1 h-3 w-3" />
                                                        {msg.status || 'unknown'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
