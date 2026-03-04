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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Store, Edit2, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useRestaurants } from '@/lib/queries'
import { restaurantApi } from '@/lib/api'

export default function AdminRestaurantsPage() {
    const router = useRouter()
    const [isCheckingAuth, setIsCheckingAuth] = useState(true)
    const { data: allRestaurants, isLoading, refetch } = useRestaurants()

    // Admins only manage self_created restaurants here, agencies manage their own.
    const restaurants = allRestaurants?.filter((r: any) => r.creation_type === 'self_created') || []

    const [selectedRestaurant, setSelectedRestaurant] = useState<any | null>(null)
    const [budgetInput, setBudgetInput] = useState('')
    const [statusInput, setStatusInput] = useState('active')
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

    const handleEditClick = (restaurant: any) => {
        setSelectedRestaurant(restaurant)
        setBudgetInput((restaurant.budget_monthly_gbp || 0).toString())
        setStatusInput(restaurant.status || 'active')
    }

    const handleSaveChanges = async () => {
        if (!selectedRestaurant) return

        const newBudget = parseFloat(budgetInput)
        if (isNaN(newBudget) || newBudget < 0) {
            toast.error("Please enter a valid positive number for budget")
            return
        }

        setIsSaving(true)
        try {
            await restaurantApi.update(selectedRestaurant.id, {
                budget_monthly_gbp: newBudget,
                status: statusInput
            })
            toast.success("Restaurant updated successfully")
            setSelectedRestaurant(null)
            refetch()
        } catch (error: any) {
            console.error("Failed to update restaurant:", error)
            toast.error(error.response?.data?.detail || "Failed to update restaurant")
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
                        <Store className="h-6 w-6 text-primary" />
                        Independent Restaurants
                    </h2>
                    <p className="text-muted-foreground">Manage direct sign-ups and allocate their budgets.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <Card className="bg-card border-border">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead>Restaurant Name</TableHead>
                                <TableHead>Admin Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Monthly Budget</TableHead>
                                <TableHead className="text-right">Current Spend</TableHead>
                                <TableHead className="w-[100px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : restaurants.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No independent restaurants found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                restaurants.map((restaurant: any) => (
                                    <TableRow key={restaurant.id}>
                                        <TableCell className="font-medium">{restaurant.name}</TableCell>
                                        <TableCell>{restaurant.email}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${restaurant.status === 'active'
                                                    ? 'bg-emerald-500/10 text-emerald-500'
                                                    : 'bg-amber-500/10 text-amber-500'
                                                }`}>
                                                {restaurant.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            £{(restaurant.budget_monthly_gbp || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">
                                            £{(restaurant.current_spend_gbp || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEditClick(restaurant)}
                                                className="h-8 w-8 p-0"
                                            >
                                                <Edit2 className="h-4 w-4 text-muted-foreground" />
                                                <span className="sr-only">Edit Restaurant</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!selectedRestaurant} onOpenChange={(open) => !open && setSelectedRestaurant(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Manage Restaurant</DialogTitle>
                        <DialogDescription>
                            Update settings for {selectedRestaurant?.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="status">Account Status</Label>
                            <Select value={statusInput} onValueChange={setStatusInput}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

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
                                Max allowed monthly spend for SMS campaigns
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedRestaurant(null)} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveChanges} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
