export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type UserRole = 'admin' | 'worker'
export type ShedVariant = 'W' | 'B'

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    role: UserRole
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    role?: UserRole
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    role?: UserRole
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            sheds: {
                Row: {
                    id: string
                    name: string
                    variant: ShedVariant
                    description: string | null
                    capacity: number
                    number_of_birds: number
                    is_active: boolean
                    created_by: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    variant: ShedVariant
                    description?: string | null
                    capacity?: number
                    number_of_birds?: number
                    is_active?: boolean
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    variant?: ShedVariant
                    description?: string | null
                    capacity?: number
                    number_of_birds?: number
                    is_active?: boolean
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            worker_assignments: {
                Row: {
                    id: string
                    worker_id: string
                    shed_id: string
                    assigned_by: string | null
                    assigned_at: string
                    is_active: boolean
                }
                Insert: {
                    id?: string
                    worker_id: string
                    shed_id: string
                    assigned_by?: string | null
                    assigned_at?: string
                    is_active?: boolean
                }
                Update: {
                    id?: string
                    worker_id?: string
                    shed_id?: string
                    assigned_by?: string | null
                    assigned_at?: string
                    is_active?: boolean
                }
            }
            daily_entries: {
                Row: {
                    id: string
                    shed_id: string
                    worker_id: string
                    entry_date: string
                    production_crates: number
                    production_birds: number
                    total_birds: number
                    non_production: number
                    mortality: number
                    notes: string | null
                    corrected_by: string | null
                    corrected_at: string | null
                    original_values: Json | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    shed_id: string
                    worker_id: string
                    entry_date?: string
                    production_crates: number
                    production_birds: number
                    total_birds: number
                    non_production: number
                    mortality: number
                    notes?: string | null
                    corrected_by?: string | null
                    corrected_at?: string | null
                    original_values?: Json | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    shed_id?: string
                    worker_id?: string
                    entry_date?: string
                    production_crates?: number
                    production_birds?: number
                    total_birds?: number
                    non_production?: number
                    mortality?: number
                    notes?: string | null
                    corrected_by?: string | null
                    corrected_at?: string | null
                    original_values?: Json | null
                    created_at?: string
                    updated_at?: string
                }
            }
            production_summary: {
                Row: {
                    id: string
                    shed_id: string
                    month: string
                    total_production_crates: number
                    total_production_birds: number
                    avg_total_birds: number
                    total_non_production: number
                    total_mortality: number
                    entry_count: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    shed_id: string
                    month: string
                    total_production_crates?: number
                    total_production_birds?: number
                    avg_total_birds?: number
                    total_non_production?: number
                    total_mortality?: number
                    entry_count?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    shed_id?: string
                    month?: string
                    total_production_crates?: number
                    total_production_birds?: number
                    avg_total_birds?: number
                    total_non_production?: number
                    total_mortality?: number
                    entry_count?: number
                    created_at?: string
                    updated_at?: string
                }
            }
        }
        Views: {
            shed_statistics: {
                Row: {
                    id: string
                    name: string
                    variant: ShedVariant
                    is_active: boolean
                    current_month_crates: number
                    current_month_birds: number
                    current_month_mortality: number
                    assigned_workers: number
                }
            }
            worker_statistics: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    role: UserRole
                    assigned_sheds: number
                    total_entries: number
                    last_entry_date: string | null
                }
            }
        }
        Functions: {
            is_admin: {
                Args: Record<PropertyKey, never>
                Returns: boolean
            }
            is_assigned_to_shed: {
                Args: { shed_uuid: string }
                Returns: boolean
            }
        }
    }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Shed = Database['public']['Tables']['sheds']['Row']
export type WorkerAssignment = Database['public']['Tables']['worker_assignments']['Row']
export type DailyEntry = Database['public']['Tables']['daily_entries']['Row']
export type ProductionSummary = Database['public']['Tables']['production_summary']['Row']
export type ShedStatistics = Database['public']['Views']['shed_statistics']['Row']
export type WorkerStatistics = Database['public']['Views']['worker_statistics']['Row']

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ShedInsert = Database['public']['Tables']['sheds']['Insert']
export type WorkerAssignmentInsert = Database['public']['Tables']['worker_assignments']['Insert']
export type DailyEntryInsert = Database['public']['Tables']['daily_entries']['Insert']

// Update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type ShedUpdate = Database['public']['Tables']['sheds']['Update']
export type DailyEntryUpdate = Database['public']['Tables']['daily_entries']['Update']

// Extended types with relations
export interface ShedWithStats extends Shed {
    worker_count?: number
    latest_entry?: DailyEntry | null
}

export interface WorkerWithAssignments extends Profile {
    assignments?: (WorkerAssignment & { shed: Shed })[]
}

export interface DailyEntryWithRelations extends DailyEntry {
    shed?: Shed
    worker?: Profile
}
