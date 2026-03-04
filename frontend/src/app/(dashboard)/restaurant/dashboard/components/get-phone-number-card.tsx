'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    PhoneCall,
    Search,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Phone
} from 'lucide-react'
import { twilioApi } from '@/lib/api'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

interface GetPhoneNumberCardProps {
    restaurantId: string
    budget: number
    spend: number
}

export function GetPhoneNumberCard({ restaurantId, budget, spend }: GetPhoneNumberCardProps) {
    const queryClient = useQueryClient()
    const [areaCode, setAreaCode] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [availableNumbers, setAvailableNumbers] = useState<any[]>([])
    const [isPurchasing, setIsPurchasing] = useState<string | null>(null)

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!areaCode || areaCode.length !== 3) {
            toast.error('Please enter a valid 3-digit Area Code.')
            return
        }

        setIsSearching(true)
        try {
            const { data } = await twilioApi.search(areaCode)
            setAvailableNumbers(data || [])
            if (data?.length === 0) {
                toast.info(`No numbers found in area code ${areaCode}. Try another one.`)
            }
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to search for numbers.')
        } finally {
            setIsSearching(false)
        }
    }

    const handlePurchase = async (phoneNumber: string) => {
        if (!restaurantId) return

        setIsPurchasing(phoneNumber)
        try {
            await twilioApi.buy({ phone_number: phoneNumber, restaurant_id: restaurantId })
            toast.success(`Successfully activated ${phoneNumber}!`)
            queryClient.invalidateQueries({ queryKey: ['restaurants', restaurantId] })
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to purchase phone number.')
        } finally {
            setIsPurchasing(null)
        }
    }

    return (
        <Card className="bg-amber-500/10 border-amber-500/20 shadow-none mb-6">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    <CardTitle className="text-amber-500">Missing Phone Number</CardTitle>
                </div>
                <CardDescription className="text-amber-500/80">
                    Your account does not have a dedicated Twilio phone number attached. You must procure one below before sending messaging campaigns. (Cost: £1.15/mo)
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-lg mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-amber-500/50" />
                        <Input
                            placeholder="Search by Area Code (e.g. 201)"
                            className="pl-9 bg-background/50 border-amber-500/20 text-foreground"
                            value={areaCode}
                            onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
                            maxLength={3}
                        />
                    </div>
                    <Button type="submit" disabled={isSearching || areaCode.length !== 3} className="bg-amber-500 hover:bg-amber-600 text-white">
                        {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Search Numbers'}
                    </Button>
                </form>

                {availableNumbers.length > 0 && (
                    <div className="space-y-3 mt-6">
                        <p className="text-sm font-medium text-amber-500 mb-2">Available Numbers in Area Code {areaCode}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {availableNumbers.slice(0, 4).map((num) => (
                                <div key={num.phone_number} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-amber-500/20">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                                            <Phone className="w-4 h-4 text-amber-500" />
                                        </div>
                                        <div>
                                            <p className="font-mono text-sm font-medium text-foreground">{num.phone_number}</p>
                                            <p className="text-xs text-muted-foreground">{num.locality || 'United States'}</p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white"
                                        disabled={isPurchasing !== null}
                                        onClick={() => handlePurchase(num.phone_number)}
                                    >
                                        {isPurchasing === num.phone_number ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buy (£1.15)'}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
            {budget > 0 && (
                <CardFooter className="pt-0 pb-4">
                    <p className="text-xs text-amber-500/70 w-full text-right">
                        Remaining Capacity: £{Math.max(0, budget - spend).toFixed(2)}
                    </p>
                </CardFooter>
            )}
        </Card>
    )
}
