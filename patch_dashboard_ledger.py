import re

filepath = r"e:\sms\frontend\src\app\(dashboard)\agency\dashboard\page.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    "import { statsApi } from '@/lib/api'",
    "import { statsApi, transactionApi } from '@/lib/api'\nimport { format } from 'date-fns'"
)

# 2. Add transaction query inside component
query_logic = """    const { data: agencyStats } = useQuery({
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
    })"""

content = content.replace(
    "    const { data: agencyStats } = useQuery({\n        queryKey: ['agency-stats', agencyId],\n        queryFn: async () => {\n            const { data } = await statsApi.getAgencyStats(agencyId!)\n            return data\n        },\n        enabled: !!agencyId\n    })",
    query_logic
)

# 3. Add formatting helper and UI Table
ui_table = """                            </table>
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
                </Card>"""

# Find the end of the restaurants Card to inject the transactions card directly underneath
content = content.replace(
    "                            </table>\n                        </div>\n                    </CardContent>\n                </Card>",
    ui_table
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Successfully injected agency transaction ledger via Python patch.")
