'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2, Building2, MapPin, Mail, Phone, Clock, DollarSign } from 'lucide-react'
import { z } from 'zod'

const timezones = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'UTC', label: 'UTC' },
]

// Extended schema for the form
const formSchema = z.object({
    name: z.string().min(1, 'Restaurant name is required'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    timezone: z.string().min(1),
    spending_limit_monthly: z.string().optional(),
})

type FormInput = z.infer<typeof formSchema>

export default function NewRestaurantPage() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<FormInput>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            timezone: 'America/New_York',
        },
    })

    const timezone = watch('timezone')

    async function onSubmit(data: FormInput) {
        setIsSubmitting(true)
        try {
            // In production, this would call the API
            await new Promise((resolve) => setTimeout(resolve, 1500))
            toast.success('Restaurant created successfully!')
            router.push('/agency/restaurants')
        } catch {
            toast.error('Failed to create restaurant')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Add Restaurant</h1>
                    <p className="text-muted-foreground mt-1">Onboard a new restaurant to your agency</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                {/* Basic Information */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            Basic Information
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Enter the restaurant details
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-foreground">Restaurant Name *</Label>
                            <Input
                                id="name"
                                placeholder="e.g., Mario's Pizza"
                                className="bg-background border-border text-foreground placeholder:text-muted-foreground/50"
                                {...register('name')}
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-foreground flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="contact@restaurant.com"
                                    className="bg-background border-border text-foreground placeholder:text-muted-foreground/50"
                                    {...register('email')}
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-500">{errors.email.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-foreground flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    Phone
                                </Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="+1 (555) 123-4567"
                                    className="bg-background border-border text-foreground placeholder:text-muted-foreground/50"
                                    {...register('phone')}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address" className="text-foreground flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                Address
                            </Label>
                            <Input
                                id="address"
                                placeholder="123 Main St, City, State ZIP"
                                className="bg-background border-border text-foreground placeholder:text-muted-foreground/50"
                                {...register('address')}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Settings */}
                <Card className="bg-card border-border mt-6">
                    <CardHeader>
                        <CardTitle className="text-foreground flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            Settings
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Configure timezone and spending limits
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-foreground">Timezone</Label>
                                <Select value={timezone} onValueChange={(v) => setValue('timezone', v)}>
                                    <SelectTrigger className="bg-background border-border text-foreground">
                                        <SelectValue placeholder="Select timezone" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border">
                                        {timezones.map((tz) => (
                                            <SelectItem
                                                key={tz.value}
                                                value={tz.value}
                                                className="text-foreground/80 focus:bg-accent focus:text-foreground"
                                            >
                                                {tz.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="spending_limit" className="text-foreground flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    Monthly Spending Limit
                                </Label>
                                <Input
                                    id="spending_limit"
                                    type="number"
                                    placeholder="e.g., 500"
                                    className="bg-background border-border text-foreground placeholder:text-muted-foreground/50"
                                    {...register('spending_limit_monthly')}
                                />
                                <p className="text-xs text-muted-foreground">Leave empty for no limit</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => router.back()}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-primary hover:bg-primary/90"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Building2 className="mr-2 h-4 w-4" />
                                Create Restaurant
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
