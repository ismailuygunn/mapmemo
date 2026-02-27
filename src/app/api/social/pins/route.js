import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getSupabase(req) {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {}
    )
    return supabase
}

// GET: Social check-in pins for the map
export async function GET(request) {
    try {
        const supabase = getSupabase(request)
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')
        const scope = searchParams.get('scope') || 'all' // all | following | city

        let feedUserIds = null

        if (scope === 'following' && userId) {
            // Only show pins from followed users + self
            const { data: follows } = await supabase
                .from('follows')
                .select('following_id')
                .eq('follower_id', userId)
            feedUserIds = [userId, ...(follows || []).map(f => f.following_id)]
        }

        // Fetch check-ins with profiles (FK join)
        let query = supabase
            .from('check_ins')
            .select('id, user_id, place_name, city, country, lat, lng, emoji, category, photo_url, note, rating, created_at, profiles(id, display_name, username, avatar_url)')
            .eq('is_public', true)
            .not('lat', 'is', null)
            .not('lng', 'is', null)
            .order('created_at', { ascending: false })
            .limit(200)

        if (feedUserIds) {
            query = query.in('user_id', feedUserIds)
        }

        const { data, error } = await query
        if (error) throw error

        // Check if profiles came through FK join
        const needsManualProfiles = (data || []).some(c => !c.profiles && c.user_id)

        let profileMap = {}
        if (needsManualProfiles) {
            // Fallback: Manually fetch profiles
            const userIds = [...new Set((data || []).map(c => c.user_id).filter(Boolean))]
            if (userIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, display_name, username, avatar_url')
                    .in('id', userIds)
                    ; (profiles || []).forEach(p => { profileMap[p.id] = p })
            }
        }

        // Format for map markers
        const markers = (data || []).map(c => {
            const profile = c.profiles || profileMap[c.user_id] || null
            return {
                id: c.id,
                lat: c.lat,
                lng: c.lng,
                placeName: c.place_name,
                city: c.city,
                country: c.country,
                emoji: c.emoji || '📍',
                category: c.category,
                photoUrl: c.photo_url,
                note: c.note,
                rating: c.rating,
                createdAt: c.created_at,
                user: profile ? {
                    id: profile.id,
                    displayName: profile.display_name,
                    username: profile.username,
                    avatarUrl: profile.avatar_url,
                } : null,
            }
        })

        return NextResponse.json({ markers, total: markers.length })
    } catch (err) {
        console.error('Social pins error:', err)
        return NextResponse.json({ markers: [], error: err.message }, { status: 500 })
    }
}
