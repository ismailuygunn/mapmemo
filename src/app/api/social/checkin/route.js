import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getSupabase() {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

// POST: Create check-in
// GET: Get check-ins
export async function POST(request) {
    try {
        const supabase = getSupabase()
        const body = await request.json()
        const { userId, placeName, city, country, lat, lng, note, photoUrl, emoji, category, rating } = body

        if (!userId || !placeName) {
            return NextResponse.json({ error: 'userId and placeName required' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('check_ins')
            .insert({
                user_id: userId,
                place_name: placeName,
                city: city || null,
                country: country || null,
                lat: lat || null,
                lng: lng || null,
                note: note || null,
                photo_url: photoUrl || null,
                emoji: emoji || '📍',
                category: category || 'other',
                rating: rating || null,
            })
            .select()
            .single()

        if (error) throw error

        // Auto-create story
        await supabase.from('stories').insert({
            user_id: userId,
            type: 'checkin',
            content: note || `📍 ${placeName}`,
            city: city || null,
            emoji: emoji || '📍',
            checkin_id: data.id,
        }).catch(() => {})

        return NextResponse.json({ checkin: data })
    } catch (err) {
        console.error('Checkin error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function GET(request) {
    try {
        const supabase = getSupabase()
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')
        const city = searchParams.get('city')
        const limit = parseInt(searchParams.get('limit') || '30')

        let query = supabase
            .from('check_ins')
            .select('*, profiles(id, display_name, username, avatar_url)')
            .eq('is_public', true)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (userId) query = query.eq('user_id', userId)
        if (city) query = query.eq('city', city)

        const { data, error } = await query
        if (error) throw error

        // Get like counts
        const checkinIds = (data || []).map(c => c.id)
        if (checkinIds.length > 0) {
            const { data: likes } = await supabase
                .from('feed_likes')
                .select('target_id')
                .eq('target_type', 'check_in')
                .in('target_id', checkinIds)

            const likeCounts = {}
            ;(likes || []).forEach(l => { likeCounts[l.target_id] = (likeCounts[l.target_id] || 0) + 1 })
            data.forEach(c => { c.likeCount = likeCounts[c.id] || 0 })
        }

        return NextResponse.json({ checkins: data || [] })
    } catch (err) {
        console.error('Get checkins error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
