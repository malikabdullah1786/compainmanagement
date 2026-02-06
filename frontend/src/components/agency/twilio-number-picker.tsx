'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Phone, Search, Loader2, Check, MapPin, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Mock available phone numbers
const mockPhoneNumbers = [
    { number: '+12025551001', locality: 'Washington, DC', monthly_cost: 1.15 },
    { number: '+12025551002', locality: 'Washington, DC', monthly_cost: 1.15 },
    { number: '+13105551001', locality: 'Los Angeles, CA', monthly_cost: 1.00 },
    { number: '+13105551002', locality: 'Los Angeles, CA', monthly_cost: 1.00 },
    { number: '+12125551001', locality: 'New York, NY', monthly_cost: 1.25 },
    { number: '+12125551002', locality: 'New York, NY', monthly_cost: 1.25 },
]

interface TwilioNumberPickerProps {
    onSelect?: (number: string) => void
}

export function TwilioNumberPicker({ onSelect }: TwilioNumberPickerProps) {
    const [areaCode, setAreaCode] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [numbers, setNumbers] = useState<typeof mockPhoneNumbers>([])
    const [selectedNumber, setSelectedNumber] = useState<string | null>(null)
    const [isPurchasing, setIsPurchasing] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    async function handleSearch() {
        if (!areaCode || areaCode.length < 3) {
            toast.error('Please enter a valid area code')
            return
        }

        setIsSearching(true)
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500))
        setNumbers(mockPhoneNumbers)
        setIsSearching(false)
    }

    async function handlePurchase() {
        if (!selectedNumber) return

        setIsPurchasing(true)
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 2000))

        toast.success('Phone number purchased successfully!')
        setShowConfirm(false)
        setIsPurchasing(false)
        onSelect?.(selectedNumber)
    }

    const selectedNumberData = numbers.find((n) => n.number === selectedNumber)

    return (
        <div className="space-y-6">
            {/* Search */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                        <Phone className="h-5 w-5 text-primary" />
                        Search Phone Numbers
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Enter an area code to find available Twilio phone numbers
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Enter area code (e.g., 202)"
                                value={areaCode}
                                onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                className="pl-9 bg-background border-border text-foreground placeholder:text-muted-foreground/50"
                            />
                        </div>
                        <Button
                            onClick={handleSearch}
                            disabled={isSearching}
                            className="bg-primary hover:bg-primary/90"
                        >
                            {isSearching ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Searching...
                                </>
                            ) : (
                                'Search'
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Results */}
            {numbers.length > 0 && (
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground">Available Numbers</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Select a number to purchase
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3">
                            {numbers.map((phone) => (
                                <button
                                    key={phone.number}
                                    onClick={() => {
                                        setSelectedNumber(phone.number)
                                        setShowConfirm(true)
                                    }}
                                    className={cn(
                                        'w-full flex items-center justify-between p-4 rounded-lg border transition-all text-left',
                                        'border-border bg-card/50 hover:border-primary/50 hover:bg-accent'
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                                            <Phone className="w-6 h-6 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="font-mono font-medium text-foreground text-lg">{phone.number}</p>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                {phone.locality}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                        <DollarSign className="h-3 w-3 mr-1" />
                                        {phone.monthly_cost.toFixed(2)}/mo
                                    </Badge>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Confirm Dialog */}
            <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                <DialogContent className="bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Confirm Purchase</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            You are about to purchase this phone number
                        </DialogDescription>
                    </DialogHeader>

                    {selectedNumberData && (
                        <div className="p-4 rounded-lg bg-muted/50 border border-border">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                    <Phone className="w-6 h-6 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="font-mono font-medium text-foreground text-lg">{selectedNumberData.number}</p>
                                    <p className="text-sm text-muted-foreground">{selectedNumberData.locality}</p>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-border flex justify-between">
                                <span className="text-muted-foreground">Monthly cost</span>
                                <span className="text-foreground font-medium">${selectedNumberData.monthly_cost.toFixed(2)}/month</span>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setShowConfirm(false)}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handlePurchase}
                            disabled={isPurchasing}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {isPurchasing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Purchasing...
                                </>
                            ) : (
                                <>
                                    <Check className="mr-2 h-4 w-4" />
                                    Purchase Number
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
