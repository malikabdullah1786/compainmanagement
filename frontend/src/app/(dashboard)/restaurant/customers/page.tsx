'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
} from '@/components/ui/select'
import { CSVUploader } from '@/components/customers/csv-uploader'
import { SegmentFilter } from '@/components/customers/segment-filter'
import { Users, Search, Plus, Phone, Mail, Edit2, Trash2, UserCheck, UserX, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { useCustomers, useDeleteCustomer, useUpdateCustomer, useCreateCustomer, useRestaurantTags, useRestaurantMessages, Customer } from '@/lib/queries'

const optInColors: Record<string, string> = {
    opted_in: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    opted_out: 'bg-red-500/20 text-red-400 border-red-500/30',
    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
}

const deliveryColors: Record<string, string> = {
    delivered: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    sent: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    undelivered: 'bg-red-500/20 text-red-400 border-red-500/30',
}

interface CustomerFormData {
    phone: string
    first_name: string
    last_name: string
    email: string
    opt_in_status: string
    tags: string
}

export default function CustomersPage() {
    const { restaurantId, isLoading: authLoading } = useAuth()
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [optInStatus, setOptInStatus] = useState<string | undefined>()
    const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null)
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
    const [showAddDialog, setShowAddDialog] = useState(false)

    // Form for adding/editing customer
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CustomerFormData>({
        defaultValues: {
            opt_in_status: 'opted_in'
        }
    })

    // Separate form for editing to avoid state collision
    const editForm = useForm<CustomerFormData>()

    // Fetch customers from API
    const {
        data: customers = [],
        isLoading: customersLoading,
        error: customersError,
        refetch
    } = useCustomers(restaurantId, { opt_in_status: optInStatus })

    // Fetch available tags
    const { data: availableTags = [] } = useRestaurantTags(restaurantId)

    // Fetch message logs for status mapping
    const { data: messages = [] } = useRestaurantMessages(restaurantId, 500)

    // Mutations
    const deleteMutation = useDeleteCustomer()
    const createMutation = useCreateCustomer()
    const updateMutation = useUpdateCustomer()

    // Map messages to customers to find last status
    const customerLastStatus = useMemo(() => {
        const mapping: Record<string, string> = {}
        // Sort messages by creation date descending to get the latest first
        const sorted = [...messages].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        sorted.forEach(msg => {
            if (!mapping[msg.to_phone]) {
                mapping[msg.to_phone] = msg.status
            }
        })
        return mapping
    }, [messages])

    // Filter customers client-side for search and tags
    const filteredCustomers = useMemo(() => {
        return customers.map(c => ({
            ...c,
            last_message_status: customerLastStatus[c.phone]
        })).filter((customer) => {
            // Search filter
            const searchLower = searchQuery.toLowerCase()
            const matchesSearch =
                !searchQuery ||
                customer.first_name?.toLowerCase().includes(searchLower) ||
                customer.last_name?.toLowerCase().includes(searchLower) ||
                customer.email?.toLowerCase().includes(searchLower) ||
                customer.phone.includes(searchQuery)

            // Tag filter
            const matchesTags =
                selectedTags.length === 0 ||
                selectedTags.some((tag) => customer.tags?.includes(tag))

            return matchesSearch && matchesTags
        })
    }, [customers, searchQuery, selectedTags, customerLastStatus])

    async function handleDelete() {
        if (deleteCustomer) {
            try {
                await deleteMutation.mutateAsync(deleteCustomer.id)
                toast.success('Customer deleted')
                setDeleteCustomer(null)
            } catch (error) {
                toast.error('Failed to delete customer')
            }
        }
    }

    async function handleAddCustomer(data: CustomerFormData) {
        if (!restaurantId) return

        try {
            // Parse tags from comma-separated string
            const tags = data.tags
                ? data.tags.split(',').map(t => t.trim()).filter(t => t)
                : []

            await createMutation.mutateAsync({
                restaurant_id: restaurantId,
                phone: data.phone,
                first_name: data.first_name || null,
                last_name: data.last_name || null,
                email: data.email || null,
                opt_in_status: data.opt_in_status,
                tags: tags,
            })

            toast.success('Customer added successfully!')
            setShowAddDialog(false)
            reset()
            refetch()
        } catch (error) {
            console.error('Error adding customer:', error)
            toast.error('Failed to add customer')
        }
    }

    async function handleUpdateCustomer(data: CustomerFormData) {
        if (!editingCustomer) return

        try {
            const tags = data.tags
                ? data.tags.split(',').map(t => t.trim()).filter(t => t)
                : []

            await updateMutation.mutateAsync({
                id: editingCustomer.id,
                data: {
                    phone: data.phone,
                    first_name: data.first_name || null,
                    last_name: data.last_name || null,
                    email: data.email || null,
                    opt_in_status: data.opt_in_status,
                    tags: tags,
                }
            })

            toast.success('Customer updated successfully!')
            setEditingCustomer(null)
            refetch()
        } catch (error) {
            console.error('Error updating customer:', error)
            toast.error('Failed to update customer')
        }
    }

    function openEditDialog(customer: Customer) {
        setEditingCustomer(customer)
        editForm.reset({
            phone: customer.phone,
            first_name: customer.first_name || '',
            last_name: customer.last_name || '',
            email: customer.email || '',
            opt_in_status: customer.opt_in_status,
            tags: customer.tags?.join(', ') || ''
        })
    }

    // Loading state
    if (authLoading || customersLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        )
    }

    // Error state
    if (customersError) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <p className="text-red-400">Failed to load customers</p>
                <Button onClick={() => refetch()} variant="outline">
                    Retry
                </Button>
            </div>
        )
    }

    // No restaurant ID
    if (!restaurantId) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <AlertCircle className="h-12 w-12 text-amber-500" />
                <p className="text-amber-400">No restaurant associated with your account</p>
                <p className="text-slate-500 text-sm">Please contact support to set up your restaurant.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Customers</h1>
                    <p className="text-muted-foreground mt-1">Manage your customer database and segments</p>
                </div>
                <div className="flex items-center gap-3">
                    <CSVUploader
                        restaurantId={restaurantId}
                        onSuccess={() => {
                            toast.success('Customers imported')
                            refetch()
                        }}
                    />
                    <Button
                        onClick={() => setShowAddDialog(true)}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Customer
                    </Button>
                </div>
            </div>

            {/* Filters & Search */}
            <Card className="bg-card border-border">
                <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, email, or phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 bg-background border-border text-foreground placeholder:text-muted-foreground"
                            />
                        </div>
                        <SegmentFilter
                            availableTags={availableTags.length > 0 ? availableTags : ['VIP', 'Friday-Regular', 'Lunch-Only', 'Weekend-Regular', 'New Customer']}
                            selectedTags={selectedTags}
                            onTagsChange={setSelectedTags}
                            optInStatus={optInStatus}
                            onOptInStatusChange={setOptInStatus}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Customer Table */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-foreground">Customer Directory</CardTitle>
                            <CardDescription className="text-muted-foreground">
                                {filteredCustomers.length} of {customers.length} customers
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border border-border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border hover:bg-muted/30">
                                    <TableHead className="text-muted-foreground">Customer</TableHead>
                                    <TableHead className="text-muted-foreground">Phone</TableHead>
                                    <TableHead className="text-muted-foreground">Tags</TableHead>
                                    <TableHead className="text-muted-foreground">Status</TableHead>
                                    <TableHead className="text-muted-foreground">Last Message</TableHead>
                                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCustomers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                            <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                                            <p>No customers found</p>
                                            <p className="text-sm text-muted-foreground/70 mt-1">
                                                Try adjusting your filters or import customers
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredCustomers.map((customer: any) => (
                                        <TableRow
                                            key={customer.id}
                                            className="border-border hover:bg-muted/30"
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                                                        <span className="text-sm font-medium text-indigo-400">
                                                            {customer.first_name?.charAt(0) || customer.phone.charAt(1)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground">
                                                            {customer.first_name} {customer.last_name}
                                                        </p>
                                                        {customer.email && (
                                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Mail className="h-3 w-3" />
                                                                {customer.email}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-foreground flex items-center gap-1">
                                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                                    {customer.phone}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {customer.tags?.map((tag: string) => (
                                                        <Badge
                                                            key={tag}
                                                            variant="outline"
                                                            className="text-xs bg-muted text-foreground border-border"
                                                        >
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={optInColors[customer.opt_in_status]}
                                                >
                                                    {customer.opt_in_status === 'opted_in' ? (
                                                        <UserCheck className="mr-1 h-3 w-3" />
                                                    ) : customer.opt_in_status === 'opted_out' ? (
                                                        <UserX className="mr-1 h-3 w-3" />
                                                    ) : null}
                                                    {customer.opt_in_status.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {customer.last_message_status ? (
                                                    <Badge
                                                        variant="outline"
                                                        className={deliveryColors[customer.last_message_status.toLowerCase()] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}
                                                    >
                                                        {customer.last_message_status}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-slate-500 italic">No messages</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
                                                        onClick={() => openEditDialog(customer)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => setDeleteCustomer(customer)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Add Customer Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Add New Customer</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Add a customer to your database manually
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(handleAddCustomer)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-foreground">Phone Number *</Label>
                            <Input
                                id="phone"
                                placeholder="+1234567890"
                                {...register('phone', { required: 'Phone number is required' })}
                                className="bg-background border-border text-foreground"
                            />
                            {errors.phone && (
                                <p className="text-sm text-destructive">{errors.phone.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="first_name" className="text-foreground">First Name</Label>
                                <Input
                                    id="first_name"
                                    placeholder="John"
                                    {...register('first_name')}
                                    className="bg-background border-border text-foreground"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name" className="text-foreground">Last Name</Label>
                                <Input
                                    id="last_name"
                                    placeholder="Doe"
                                    {...register('last_name')}
                                    className="bg-background border-border text-foreground"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-foreground">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="john@example.com"
                                {...register('email')}
                                className="bg-background border-border text-foreground"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tags" className="text-foreground">Tags (comma-separated)</Label>
                            <Input
                                id="tags"
                                placeholder="VIP, Regular, Lunch"
                                {...register('tags')}
                                className="bg-background border-border text-foreground"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-foreground">Opt-in Status</Label>
                            <Select
                                defaultValue="opted_in"
                                onValueChange={(value) => setValue('opt_in_status', value)}
                            >
                                <SelectTrigger className="bg-background border-border text-foreground">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    <SelectItem value="opted_in" className="text-foreground">Opted In</SelectItem>
                                    <SelectItem value="pending" className="text-foreground">Pending</SelectItem>
                                    <SelectItem value="opted_out" className="text-foreground">Opted Out</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    setShowAddDialog(false)
                                    reset()
                                }}
                                className="text-slate-400 hover:text-white"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createMutation.isPending}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                            >
                                {createMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Customer
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Customer Dialog */}
            <Dialog open={!!editingCustomer} onOpenChange={(open) => !open && setEditingCustomer(null)}>
                <DialogContent className="bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Edit Customer</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Update customer information
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={editForm.handleSubmit(handleUpdateCustomer)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-phone" className="text-foreground">Phone Number *</Label>
                            <Input
                                id="edit-phone"
                                placeholder="+1234567890"
                                {...editForm.register('phone', { required: 'Phone number is required' })}
                                className="bg-background border-border text-foreground"
                            />
                            {editForm.formState.errors.phone && (
                                <p className="text-sm text-destructive">{editForm.formState.errors.phone.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-first_name" className="text-foreground">First Name</Label>
                                <Input
                                    id="edit-first_name"
                                    placeholder="John"
                                    {...editForm.register('first_name')}
                                    className="bg-background border-border text-foreground"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-last_name" className="text-foreground">Last Name</Label>
                                <Input
                                    id="edit-last_name"
                                    placeholder="Doe"
                                    {...editForm.register('last_name')}
                                    className="bg-background border-border text-foreground"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-email" className="text-foreground">Email</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                placeholder="john@example.com"
                                {...editForm.register('email')}
                                className="bg-background border-border text-foreground"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-tags" className="text-foreground">Tags (comma-separated)</Label>
                            <Input
                                id="edit-tags"
                                placeholder="VIP, Regular, Lunch"
                                {...editForm.register('tags')}
                                className="bg-background border-border text-foreground"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-foreground">Opt-in Status</Label>
                            <Select
                                value={editForm.watch('opt_in_status')}
                                onValueChange={(value) => editForm.setValue('opt_in_status', value)}
                            >
                                <SelectTrigger className="bg-background border-border text-foreground">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    <SelectItem value="opted_in" className="text-foreground">Opted In</SelectItem>
                                    <SelectItem value="pending" className="text-foreground">Pending</SelectItem>
                                    <SelectItem value="opted_out" className="text-foreground">Opted Out</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setEditingCustomer(null)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={updateMutation.isPending}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                            >
                                {updateMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    'Update Customer'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteCustomer} onOpenChange={() => setDeleteCustomer(null)}>
                <DialogContent className="bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Delete Customer</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Are you sure you want to delete{' '}
                            <span className="text-foreground font-medium">
                                {deleteCustomer?.first_name} {deleteCustomer?.last_name}
                            </span>
                            ? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setDeleteCustomer(null)}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {deleteMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete Customer'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

