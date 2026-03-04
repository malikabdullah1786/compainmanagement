'use client'

import { useQuery } from '@tanstack/react-query'
import { transactionApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Receipt } from 'lucide-react'
import { format } from 'date-fns'

const txTypeColors: Record<string, string> = {
    budget_allocation: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    sms_charge: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
    number_purchase: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
}

export default function AdminTransactionsPage() {
    const { data: transactions = [], isLoading } = useQuery({
        queryKey: ['admin-all-transactions'],
        queryFn: async () => {
            const { data } = await transactionApi.getAllTransactions()
            return data
        }
    })

    if (isLoading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
    )

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Global Transaction Ledger</h1>
                <p className="text-muted-foreground mt-1">All billing events across agencies and restaurants</p>
            </div>

            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-foreground">All Transactions</CardTitle>
                    <CardDescription className="text-muted-foreground">{transactions.length} transaction{transactions.length !== 1 ? 's' : ''} total</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Entity</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Description</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Amount (£)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center">
                                            <Receipt className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                                            <p className="text-muted-foreground">No transactions recorded yet.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((tx: any) => (
                                        <tr key={tx.id} className="border-b border-border hover:bg-muted/50">
                                            <td className="py-3 px-4 text-sm text-foreground">
                                                {format(new Date(tx.created_at), 'MMM d, yyyy h:mm a')}
                                            </td>
                                            <td className="py-3 px-4 text-sm">
                                                {tx.agency_id && !tx.restaurant_id ? (
                                                    <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Agency</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20">Restaurant</Badge>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant="outline" className={txTypeColors[tx.transaction_type] || 'bg-muted'}>
                                                    {tx.transaction_type.replace(/_/g, ' ')}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-foreground">{tx.description || '—'}</td>
                                            <td className="py-3 px-4 text-sm text-right font-mono font-medium text-foreground">
                                                £{Math.abs(tx.amount_gbp).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
