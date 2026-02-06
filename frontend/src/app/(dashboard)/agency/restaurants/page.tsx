'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Building2,
    Plus,
    Search,
    MoreHorizontal,
    Edit2,
    Eye,
    Phone,
    Trash2,
    Users,
    MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock data
const mockRestaurants = [
    { id: '1', name: "Mario's Pizza", status: 'active', customers: 1247, messages: 8934, phone: '+12025551234', spending: 127.45, limit: 500 },
    { id: '2', name: 'Sushi Express', status: 'active', customers: 892, messages: 6721, phone: '+12025551235', spending: 89.32, limit: 300 },
    { id: '3', name: 'Taco Bell Central', status: 'active', customers: 2341, messages: 15678, phone: '+12025551236', spending: 234.67, limit: 1000 },
    { id: '4', name: 'The BBQ Joint', status: 'pending', customers: 567, messages: 0, phone: null, spending: 0, limit: 200 },
    { id: '5', name: 'Café Milano', status: 'suspended', customers: 432, messages: 2341, phone: '+12025551238', spending: 45.12, limit: 150 },
]

const statusColors: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    suspended: 'bg-red-500/10 text-red-500 border-red-500/20',
}

export default function RestaurantsPage() {
    const [searchQuery, setSearchQuery] = useState('')

    const filteredRestaurants = mockRestaurants.filter((restaurant) =>
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Restaurants</h1>
                    <p className="text-muted-foreground mt-1">Manage restaurant accounts</p>
                </div>
                <Link href="/agency/restaurants/new">
                    <Button className="bg-primary hover:bg-primary/90">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Restaurant
                    </Button>
                </Link>
            </div>

            {/* Search */}
            <Card className="bg-card border-border">
                <CardContent className="py-4">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search restaurants..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-background border-border text-foreground placeholder:text-muted-foreground/50"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Restaurants Table */}
            <Card className="bg-card border-border">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border hover:bg-muted/50">
                                <TableHead className="text-muted-foreground">Restaurant</TableHead>
                                <TableHead className="text-muted-foreground">Status</TableHead>
                                <TableHead className="text-muted-foreground">Customers</TableHead>
                                <TableHead className="text-muted-foreground">Messages</TableHead>
                                <TableHead className="text-muted-foreground">Spending</TableHead>
                                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRestaurants.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                        <Building2 className="mx-auto h-12 w-12 text-muted/30 mb-3" />
                                        <p>No restaurants found</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRestaurants.map((restaurant) => {
                                    const spendPercent = (restaurant.spending / restaurant.limit) * 100

                                    return (
                                        <TableRow
                                            key={restaurant.id}
                                            className="border-border hover:bg-muted/50"
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        <Building2 className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground">{restaurant.name}</p>
                                                        {restaurant.phone && (
                                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Phone className="h-3 w-3" />
                                                                {restaurant.phone}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={cn('capitalize', statusColors[restaurant.status])}>
                                                    {restaurant.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-foreground/80">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    {restaurant.customers.toLocaleString()}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-foreground/80">
                                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                                    {restaurant.messages.toLocaleString()}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-foreground">${restaurant.spending.toFixed(2)}</span>
                                                        <span className="text-muted-foreground">${restaurant.limit}</span>
                                                    </div>
                                                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className={cn(
                                                                'h-full rounded-full',
                                                                spendPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                                                            )}
                                                            style={{ width: `${Math.min(spendPercent, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-card border-border">
                                                        <DropdownMenuItem className="text-foreground/80 focus:bg-accent focus:text-foreground">
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Dashboard
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-foreground/80 focus:bg-accent focus:text-foreground">
                                                            <Edit2 className="mr-2 h-4 w-4" />
                                                            Edit Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-foreground/80 focus:bg-accent focus:text-foreground">
                                                            <Phone className="mr-2 h-4 w-4" />
                                                            Manage Phone
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-border" />
                                                        <DropdownMenuItem className="text-red-500 focus:bg-red-500/10 focus:text-red-500">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Remove
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
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
