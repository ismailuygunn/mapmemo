import { createClient } from '@/lib/supabase/client'

/** Get Authorization headers for API calls */
export async function getAuthHeaders() {
    const supabase = createClient()
    const { data } = await supabase.auth.getSession()
    const token = data?.session?.access_token
    if (!token) return {}
    return { Authorization: `Bearer ${token}` }
}
