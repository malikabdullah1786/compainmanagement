import { z } from 'zod'

// Phone validation (E.164 format)
export const phoneSchema = z.string()
    .regex(/^\+[1-9]\d{1,14}$/, 'Phone must be in E.164 format (e.g., +1234567890)')

// Auth schemas
export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const signupSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    businessName: z.string().min(2, 'Business name is required'),
    phone: z.string().optional(),
    role: z.enum(['agency_admin', 'restaurant_admin']),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
})

// Customer schemas
export const customerSchema = z.object({
    phone: phoneSchema,
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    tags: z.array(z.string()).optional(),
})

// Campaign schemas
export const campaignSchema = z.object({
    name: z.string().min(1, 'Campaign name is required'),
    message_template: z.string()
        .min(1, 'Message is required')
        .max(1600, 'Message too long (max 1600 characters)'),
    segment_criteria: z.record(z.string(), z.unknown()).optional(),
    schedule_type: z.enum(['one_time', 'recurring']),
    scheduled_at: z.string().datetime().optional(),
    timezone: z.string().optional(),
})

// Restaurant schemas
export const restaurantSchema = z.object({
    name: z.string().min(1, 'Restaurant name is required'),
    agency_id: z.string().uuid(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    timezone: z.string().default('UTC'),
    budget_monthly_gbp: z.number().positive().optional(),
    budget_daily_gbp: z.number().positive().optional(),
})

// Types
export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type CustomerInput = z.infer<typeof customerSchema>
export type CampaignInput = z.infer<typeof campaignSchema>
export type RestaurantInput = z.infer<typeof restaurantSchema>
