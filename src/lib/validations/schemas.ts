import { z } from 'zod'

// Login schema
export const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
})

export type LoginFormData = z.infer<typeof loginSchema>

// Sign up schema
export const signUpSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    role: z.enum(['admin', 'worker']).default('worker'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
})

export type SignUpFormData = z.infer<typeof signUpSchema>

// Shed schema
export const shedSchema = z.object({
    name: z.string().min(1, 'Shed name is required').max(50, 'Shed name must be less than 50 characters'),
    variant: z.enum(['W', 'B'], {
        required_error: 'Please select a variant',
    }),
    description: z.string().max(500, 'Description must be less than 500 characters').optional(),
    capacity: z.number().int().min(0, 'Capacity must be a positive number').default(0),
    is_active: z.boolean().default(true),
})

export type ShedFormData = z.infer<typeof shedSchema>

// Worker assignment schema
export const workerAssignmentSchema = z.object({
    worker_id: z.string().uuid('Invalid worker selection'),
    shed_id: z.string().uuid('Invalid shed selection'),
})

export type WorkerAssignmentFormData = z.infer<typeof workerAssignmentSchema>

// Daily entry schema
export const dailyEntrySchema = z.object({
    shed_id: z.string().uuid('Please select a shed'),
    entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    production_crates: z.number()
        .min(0, 'Production crates must be 0 or greater')
        .max(9999.99, 'Production crates seems too high'),
    production_birds: z.number()
        .int('Must be a whole number')
        .min(0, 'Production birds must be 0 or greater')
        .max(99999, 'Production birds seems too high'),
    total_birds: z.number()
        .int('Must be a whole number')
        .min(0, 'Total birds must be 0 or greater')
        .max(99999, 'Total birds seems too high'),
    non_production: z.number()
        .int('Must be a whole number')
        .min(0, 'Non-production must be 0 or greater'),
    mortality: z.number()
        .int('Must be a whole number')
        .min(0, 'Mortality must be 0 or greater'),
    notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
}).refine((data) => {
    // Non-production + production birds should not exceed total birds
    return (data.non_production + data.production_birds) <= data.total_birds
}, {
    message: 'Production + Non-production birds cannot exceed total birds',
    path: ['total_birds'],
})

export type DailyEntryFormData = z.infer<typeof dailyEntrySchema>

// Report filter schema
export const reportFilterSchema = z.object({
    shed_id: z.string().optional(),
    variant: z.enum(['W', 'B', 'all']).optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    month: z.string().optional(),
})

export type ReportFilterData = z.infer<typeof reportFilterSchema>

// Profile update schema
export const profileUpdateSchema = z.object({
    full_name: z.string().min(2, 'Full name must be at least 2 characters').optional(),
    avatar_url: z.string().url('Invalid URL').optional().nullable(),
})

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>
