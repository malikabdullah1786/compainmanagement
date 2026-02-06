'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { signupSchema, type SignupInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, MessageSquare, Building2, UtensilsCrossed } from 'lucide-react'

export default function SignupPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<SignupInput>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            role: 'restaurant_admin',
        },
    })

    const selectedRole = watch('role')

    async function onSubmit(data: SignupInput) {
        setIsLoading(true)
        try {
            const { error } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        business_name: data.businessName,
                        phone: data.phone,
                        role: data.role,
                        is_verified: false, // Requires admin approval after payment
                    },
                },
            })

            if (error) {
                toast.error(error.message)
                return
            }

            toast.success('Account created! Your account is pending admin approval.')
            router.push('/pending-approval')
        } catch {
            toast.error('Something went wrong')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/5 to-background p-4">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            <Card className="w-full max-w-md relative backdrop-blur-sm bg-card/80 border-border">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <MessageSquare className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                            Create Account
                        </CardTitle>
                        <CardDescription className="text-muted-foreground mt-1">
                            Start your SMS marketing journey
                        </CardDescription>
                    </div>
                </CardHeader>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        {/* Role Selection */}
                        <div className="space-y-2">
                            <Label className="text-foreground">Account Type</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setValue('role', 'restaurant_admin')}
                                    className={`p-4 rounded-lg border-2 transition-all ${selectedRole === 'restaurant_admin'
                                        ? 'border-primary bg-primary/10'
                                        : 'border-border bg-accent/50 hover:border-primary/50'
                                        }`}
                                >
                                    <UtensilsCrossed className={`w-6 h-6 mx-auto mb-2 ${selectedRole === 'restaurant_admin' ? 'text-primary' : 'text-muted-foreground'
                                        }`} />
                                    <p className={`text-sm font-medium ${selectedRole === 'restaurant_admin' ? 'text-primary' : 'text-muted-foreground'
                                        }`}>Restaurant</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setValue('role', 'agency_admin')}
                                    className={`p-4 rounded-lg border-2 transition-all ${selectedRole === 'agency_admin'
                                        ? 'border-purple-500 bg-purple-500/10'
                                        : 'border-border bg-accent/50 hover:border-purple-500/50'
                                        }`}
                                >
                                    <Building2 className={`w-6 h-6 mx-auto mb-2 ${selectedRole === 'agency_admin' ? 'text-purple-400' : 'text-muted-foreground'
                                        }`} />
                                    <p className={`text-sm font-medium ${selectedRole === 'agency_admin' ? 'text-purple-400' : 'text-muted-foreground'
                                        }`}>Agency</p>
                                </button>
                            </div>
                            {errors.role && (
                                <p className="text-sm text-destructive">{errors.role.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="businessName" className="text-foreground">Business Name</Label>
                            <Input
                                id="businessName"
                                placeholder="Your restaurant or agency name"
                                className="bg-background border-border focus:ring-primary text-foreground placeholder:text-muted-foreground"
                                {...register('businessName')}
                            />
                            {errors.businessName && (
                                <p className="text-sm text-destructive">{errors.businessName.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-foreground">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                className="bg-background border-border focus:ring-primary text-foreground placeholder:text-muted-foreground"
                                {...register('email')}
                            />
                            {errors.email && (
                                <p className="text-sm text-destructive">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-foreground">Phone (optional)</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="+1234567890"
                                className="bg-background border-border focus:ring-primary text-foreground placeholder:text-muted-foreground"
                                {...register('phone')}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-foreground">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                className="bg-background border-border focus:ring-primary text-foreground placeholder:text-muted-foreground"
                                {...register('password')}
                            />
                            {errors.password && (
                                <p className="text-sm text-destructive">{errors.password.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                className="bg-background border-border focus:ring-primary text-foreground placeholder:text-muted-foreground"
                                {...register('confirmPassword')}
                            />
                            {errors.confirmPassword && (
                                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                            )}
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4">
                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30"
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Account
                        </Button>

                        <p className="text-sm text-muted-foreground text-center">
                            Already have an account?{' '}
                            <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
                                Sign in
                            </Link>
                        </p>

                        <p className="text-xs text-muted-foreground/60 text-center">
                            Account requires admin approval after payment confirmation
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
