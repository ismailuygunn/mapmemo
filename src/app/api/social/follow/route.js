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

// POST: Toggle follow
// GET: Get followers/following list
export async function POST(request) {
    try {
        const supabase = getSupabase(request)
        const { followerId, followingId } = await request.json()
        if (!followerId || !followingId) {
            return NextResponse.json({ error: 'Missing follower or following ID' }, { status: 400 })
        }
        if (followerId === followingId) {
            return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
        }

        const { data: existing } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', followerId)
            .eq('following_id', followingId)
            .maybeSingle()

        if (existing) {
            await supabase.from('follows').delete().eq('id', existing.id)
            return NextResponse.json({ followed: false })
        } else {
            await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId })
            return NextResponse.json({ followed: true })
        }
    } catch (err) {
        console.error('Follow error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function GET(request) {
    try {
        const supabase = getSupabase(request)
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')
        const type = searchParams.get('type') || 'followers'

        if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

        if (type === 'following') {
            // Try with FK join first
            const joinResult = await supabase
                .from('follows')
                .select('following_id, created_at, profiles!follows_following_id_profiles_fkey(id, display_name, username, avatar_url, bio, home_city, checkin_count)')
                .eq('follower_id', userId)
                .order('created_at', { ascending: false })

            if (joinResult.error?.message?.includes('relationship')) {
                // Fallback: get follows, then fetch profiles separately
                const { data: followData } = await supabase
                    .from('follows')
                    .select('following_id, created_at')
                    .eq('follower_id', userId)
                    .order('created_at', { ascending: false })

                const ids = (followData || []).map(f => f.following_id)
                if (ids.length === 0) return NextResponse.json({ users: [] })

                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, display_name, username, avatar_url, bio, home_city, checkin_count')
                    .in('id', ids)

                const profileMap = {}
                    ; (profiles || []).forEach(p => { profileMap[p.id] = p })

                const users = (followData || []).map(f => ({
                    ...(profileMap[f.following_id] || { id: f.following_id }),
                    followedAt: f.created_at,
                }))
                return NextResponse.json({ users })
            } else if (joinResult.error) {
                throw joinResult.error
            }
            return NextResponse.json({ users: (joinResult.data || []).map(d => ({ ...d.profiles, followedAt: d.created_at })) })
        } else {
            // followers
            const joinResult = await supabase
                .from('follows')
                .select('follower_id, created_at, profiles!follows_follower_id_profiles_fkey(id, display_name, username, avatar_url, bio, home_city, checkin_count)')
                .eq('following_id', userId)
                .order('created_at', { ascending: false })

            if (joinResult.error?.message?.includes('relationship')) {
                const { data: followData } = await supabase
                    .from('follows')
                    .select('follower_id, created_at')
                    .eq('following_id', userId)
                    .order('created_at', { ascending: false })

                const ids = (followData || []).map(f => f.follower_id)
                if (ids.length === 0) return NextResponse.json({ users: [] })

                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, display_name, username, avatar_url, bio, home_city, checkin_count')
                    .in('id', ids)

                const profileMap = {}
                    ; (profiles || []).forEach(p => { profileMap[p.id] = p })

                const users = (followData || []).map(f => ({
                    ...(profileMap[f.follower_id] || { id: f.follower_id }),
                    followedAt: f.created_at,
                }))
                return NextResponse.json({ users })
            } else if (joinResult.error) {
                throw joinResult.error
            }
            return NextResponse.json({ users: (joinResult.data || []).map(d => ({ ...d.profiles, followedAt: d.created_at })) })
        }
    } catch (err) {
        console.error('Get follows error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
