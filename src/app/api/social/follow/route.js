import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getSupabase() {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

// POST: Toggle follow
// GET: Get followers/following list
export async function POST(request) {
    try {
        const supabase = getSupabase()
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
        const supabase = getSupabase()
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')
        const type = searchParams.get('type') || 'followers'

        if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

        if (type === 'following') {
            const { data } = await supabase
                .from('follows')
                .select('following_id, created_at, profiles!follows_following_id_fkey(id, display_name, username, avatar_url, bio, home_city, checkin_count)')
                .eq('follower_id', userId)
                .order('created_at', { ascending: false })
            return NextResponse.json({ users: (data || []).map(d => ({ ...d.profiles, followedAt: d.created_at })) })
        } else {
            const { data } = await supabase
                .from('follows')
                .select('follower_id, created_at, profiles!follows_follower_id_fkey(id, display_name, username, avatar_url, bio, home_city, checkin_count)')
                .eq('following_id', userId)
                .order('created_at', { ascending: false })
            return NextResponse.json({ users: (data || []).map(d => ({ ...d.profiles, followedAt: d.created_at })) })
        }
    } catch (err) {
        console.error('Get follows error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
