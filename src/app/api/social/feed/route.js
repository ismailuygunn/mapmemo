import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getSupabase() {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

// GET: Social feed
export async function GET(request) {
    try {
        const supabase = getSupabase()
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')
        const limit = parseInt(searchParams.get('limit') || '30')
        const offset = parseInt(searchParams.get('offset') || '0')

        if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

        // Get followed user IDs
        const { data: follows } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', userId)

        const followingIds = (follows || []).map(f => f.following_id)
        const feedUserIds = [userId, ...followingIds]

        // Fetch check-ins
        const { data: checkins } = await supabase
            .from('check_ins')
            .select('*, profiles(id, display_name, username, avatar_url)')
            .in('user_id', feedUserIds)
            .eq('is_public', true)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        // Fetch active stories
        const { data: stories } = await supabase
            .from('stories')
            .select('*, profiles(id, display_name, username, avatar_url)')
            .in('user_id', feedUserIds)
            .gte('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(50)

        // Get like counts
        const checkinIds = (checkins || []).map(c => c.id)
        let likeCounts = {}
        let userLikes = {}
        if (checkinIds.length > 0) {
            const { data: likes } = await supabase
                .from('feed_likes')
                .select('target_id, user_id')
                .eq('target_type', 'check_in')
                .in('target_id', checkinIds)

            ;(likes || []).forEach(l => {
                likeCounts[l.target_id] = (likeCounts[l.target_id] || 0) + 1
                if (l.user_id === userId) userLikes[l.target_id] = true
            })
        }

        // Format feed
        const feedItems = (checkins || []).map(c => ({
            id: c.id,
            type: 'check_in',
            user: c.profiles,
            placeName: c.place_name,
            city: c.city,
            country: c.country,
            note: c.note,
            photoUrl: c.photo_url,
            emoji: c.emoji,
            category: c.category,
            rating: c.rating,
            likeCount: likeCounts[c.id] || 0,
            isLiked: !!userLikes[c.id],
            createdAt: c.created_at,
        }))

        // Group stories by user
        const storyGroups = {}
        ;(stories || []).forEach(s => {
            const uid = s.user_id
            if (!storyGroups[uid]) {
                storyGroups[uid] = { user: s.profiles, stories: [] }
            }
            storyGroups[uid].stories.push({
                id: s.id, type: s.type, content: s.content, mediaUrl: s.media_url,
                city: s.city, emoji: s.emoji, bgColor: s.bg_color,
                viewCount: s.view_count, expiresAt: s.expires_at, createdAt: s.created_at,
            })
        })

        return NextResponse.json({
            feed: feedItems,
            storyGroups: Object.values(storyGroups),
            hasMore: (checkins || []).length === limit,
        })
    } catch (err) {
        console.error('Feed error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
