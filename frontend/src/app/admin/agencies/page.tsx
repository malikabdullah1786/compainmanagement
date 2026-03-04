'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Building2, Edit2, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useAgencies } from '@/lib/queries'
import { agencyApi } from '@/lib/api'

export default function AdminAgenciesPage() {
    const router = useRouter()
    const [isCheckingAuth, setIsCheckingAuth] = useState(true)
    const { data: agencies, isLoading: isLoadingAgencies, refetch } = useAgencies()

    const [selectedAgency, setSelectedAgency] = useState<any | null>(null)
    const [budgetInput, setBudgetInput] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            const { data: profile } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profile?.role !== 'superadmin') {
                toast.error('Access denied. Superadmin role required.')
                router.push('/login')
                return
            }
            setIsCheckingAuth(false)
        }
        checkAuth()
    }, [router])

    const handleEditClick = (agency: any) => {
        setSelectedAgency(agency)
        setBudgetInput((agency.budget_monthly_gbp || 0).toString())
    }

    const handleSaveBudget = async () => {
        if (!selectedAgency) return

        const newBudget = parseFloat(budgetInput)
        if (isNaN(newBudget) || newBudget < 0) {
            toast.error("Please enter a valid positive number")
            return
        }

        setIsSaving(true)
        try {
            await agencyApi.update(selectedAgency.id, {
                budget_monthly_gbp: newBudget
            })
            toast.success("Agency budget updated successfully")
            setSelectedAgency(null)
            refetch()
        } catch (error: any) {
            console.error("Failed to update budget:", error)
            toast.error(error.response?.data?.detail || "Failed to update agency budget")
        } finally {
            setIsSaving(false)
        }
    }

    if (isCheckingAuth) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-primary" />
                        Agencies
                    </h2>
                    <p className="text-muted-foreground">Manage platform agencies and allocate budgets.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoadingAgencies}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingAgencies ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <Card className="bg-card border-border">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead>Agency Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Monthly Budget</TableHead>
                                <TableHead className="text-right">Current Spend</TableHead>
                                <TableHead className="w-[100px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingAgencies ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : !agencies || agencies.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No agencies found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                agencies.map((agency: any) => (
                                    <TableRow key={agency.id}>
                                        <TableCell className="font-medium">{agency.name}</TableCell>
                                        <TableCell>{agency.email}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${agency.status === 'active'
                                                    ? 'bg-emerald-500/10 text-emerald-500'
                                                    : 'bg-amber-500/10 text-amber-500'
                                                }`}>
                                                {agency.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            £{(agency.budget_monthly_gbp || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">
                                            £{(agency.current_spend_gbp || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEditClick(agency)}
                                                className="h-8 w-8 p-0"
                                            >
                                                <Edit2 className="h-4 w-4 text-muted-foreground" />
                                                <span className="sr-only">Edit Budget</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!selectedAgency} onOpenChange={(open) => !open && setSelectedAgency(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Manage Agency Budget</DialogTitle>
                        <DialogDescription>
                            Allocate exactly how much {selectedAgency?.name} can distribute to their restaurants each month.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="budget">Monthly Budget (£)</Label>
                            <Input
                                id="budget"
                                type="number"
                                min="0"
                                step="10"
                                value={budgetInput}
                                onChange={(e) => setBudgetInput(e.target.value)}
                                placeholder="0.00"
                            />
                            <p className="text-xs text-muted-foreground">
                                To remove budget restrictions, set to a virtually unlimited amount like 999999.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedAgency(null)} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveBudget} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
