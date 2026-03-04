'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { CreditCard, ArrowDownRight, ArrowUpRight, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useRestaurantTransactions, Transaction } from '@/lib/queries'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export default function TransactionsPage() {
    const { restaurantId } = useAuth()
    const { data: transactions, isLoading } = useRestaurantTransactions(restaurantId)

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'EUR',
        }).format(amount)
    }

    const getTypeDetails = (type: Transaction['transaction_type']) => {
        switch (type) {
            case 'budget_allocation':
                return { label: 'Allocation', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', isPositive: true }
            case 'campaign_send':
                return { label: 'Campaign Cost', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', isPositive: false }
            case 'number_purchase':
                return { label: 'Number Purchase', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', isPositive: false }
            case 'subscription_fee':
                return { label: 'Subscription', color: 'text-red-500 bg-red-500/10 border-red-500/20', isPositive: false }
            default:
                return { label: type, color: 'text-gray-500 bg-gray-500/10 border-gray-500/20', isPositive: false }
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <CreditCard className="h-6 w-6 text-primary" />
                        Transactions & Billing
                    </h1>
                    <p className="text-muted-foreground mt-1">View your budget allocations and spending history</p>
                </div>
            </div>

            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-foreground">Ledger History</CardTitle>
                    <CardDescription className="text-muted-foreground">Detailed view of all deductions and allocations.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border hover:bg-muted/50">
                                <TableHead className="text-muted-foreground">Date</TableHead>
                                <TableHead className="text-muted-foreground">Type</TableHead>
                                <TableHead className="text-muted-foreground">Description</TableHead>
                                <TableHead className="text-right text-muted-foreground">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(!transactions || transactions.length === 0) ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                        No transactions recorded yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((tx: Transaction) => {
                                    const { label, color, isPositive } = getTypeDetails(tx.transaction_type)
                                    return (
                                        <TableRow key={tx.id} className="border-border hover:bg-muted/50">
                                            <TableCell className="font-medium text-foreground">
                                                {format(new Date(tx.created_at), 'MMM d, yyyy h:mm a')}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={cn('capitalize', color)}>
                                                    {label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-foreground/80">
                                                {tx.description || '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className={cn(
                                                    "flex items-center justify-end font-semibold",
                                                    isPositive ? "text-emerald-500" : "text-foreground"
                                                )}>
                                                    {isPositive ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="text-red-500 h-4 w-4 mr-1" />}
                                                    {isPositive ? '+' : '-'}{formatCurrency(tx.amount_gbp)}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
