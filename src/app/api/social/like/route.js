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

// POST: Toggle like
export async function POST(request) {
    try {
        const supabase = getSupabase(request)
        const { userId, targetType, targetId } = await request.json()
        if (!userId || !targetType || !targetId) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }

        const { data: existing } = await supabase
            .from('feed_likes')
            .select('id')
            .eq('user_id', userId)
            .eq('target_type', targetType)
            .eq('target_id', targetId)
            .maybeSingle()

        if (existing) {
            await supabase.from('feed_likes').delete().eq('id', existing.id)
            return NextResponse.json({ liked: false })
        } else {
            await supabase.from('feed_likes').insert({
                user_id: userId, target_type: targetType, target_id: targetId,
            })
            return NextResponse.json({ liked: true })
        }
    } catch (err) {
        console.error('Like error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
