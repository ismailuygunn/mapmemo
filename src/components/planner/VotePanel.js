'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { ThumbsUp, ThumbsDown, Users, Heart, HeartOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function VotePanel({ tripId, itinerary }) {
    const [votes, setVotes] = useState({})       // { 'day1_item0': { myVote, partnerVote } }
    const [showSummary, setShowSummary] = useState(false)
    const { user } = useAuth()
    const { t } = useLanguage()
    const supabase = createClient()

    useEffect(() => {
        if (!tripId) return
        loadVotes()

        // Realtime subscription for partner votes
        const channel = supabase
            .channel(`votes-${tripId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'trip_votes',
                filter: `trip_id=eq.${tripId}`,
            }, () => loadVotes())
            .subscribe()

        return () => supabase.removeChannel(channel)
    }, [tripId])

    const loadVotes = async () => {
        const { data } = await supabase
            .from('trip_votes')
            .select('*')
            .eq('trip_id', tripId)

        if (data) {
            const voteMap = {}
            data.forEach(v => {
                if (!voteMap[v.item_key]) voteMap[v.item_key] = {}
                if (v.user_id === user?.id) {
                    voteMap[v.item_key].myVote = v.vote
                } else {
                    voteMap[v.item_key].partnerVote = v.vote
                }
            })
            setVotes(voteMap)
        }
    }

    const castVote = async (itemKey, vote) => {
        const currentVote = votes[itemKey]?.myVote
        const newVote = currentVote === vote ? 'neutral' : vote

        // Optimistic update
        setVotes(prev => ({
            ...prev,
            [itemKey]: { ...prev[itemKey], myVote: newVote }
        }))

        // Upsert to DB
        await supabase
            .from('trip_votes')
            .upsert({
                trip_id: tripId,
                user_id: user.id,
                item_key: itemKey,
                vote: newVote,
            }, { onConflict: 'trip_id,user_id,item_key' })
    }

    // Compute summary
    const bothLiked = []
    const bothDisliked = []
    const disagreed = []

    if (itinerary?.days) {
        itinerary.days.forEach((day, di) => {
            day.items?.forEach((item, ii) => {
                const key = `day${di}_item${ii}`
                const v = votes[key]
                if (!v) return
                const entry = { ...item, dayNumber: day.dayNumber, key }
                if (v.myVote === 'up' && v.partnerVote === 'up') bothLiked.push(entry)
                else if (v.myVote === 'down' && v.partnerVote === 'down') bothDisliked.push(entry)
                else if (v.myVote && v.partnerVote && v.myVote !== v.partnerVote && v.myVote !== 'neutral' && v.partnerVote !== 'neutral') {
                    disagreed.push(entry)
                }
            })
        })
    }

    const hasAnyVotes = Object.keys(votes).length > 0

    return (
        <div className="vote-panel">
            {/* Summary Toggle */}
            {hasAnyVotes && (
                <button className="btn btn-secondary" onClick={() => setShowSummary(!showSummary)} style={{ marginBottom: 16 }}>
                    <Users size={16} /> {t('vote.summary')}
                </button>
            )}

            {/* Summary */}
            <AnimatePresence>
                {showSummary && (
                    <motion.div className="vote-summary" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        {bothLiked.length > 0 && (
                            <div className="vote-group vote-group-liked">
                                <h4>✅ {t('vote.bothLiked')} ({bothLiked.length})</h4>
                                {bothLiked.map(item => (
                                    <div key={item.key} className="vote-group-item">
                                        <span>{item.title}</span>
                                        <span className="vote-day-tag">{t('general.day')} {item.dayNumber}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {disagreed.length > 0 && (
                            <div className="vote-group vote-group-disagree">
                                <h4>🤔 {t('vote.disagreed')} ({disagreed.length})</h4>
                                {disagreed.map(item => (
                                    <div key={item.key} className="vote-group-item">
                                        <span>{item.title}</span>
                                        <span className="vote-day-tag">{t('general.day')} {item.dayNumber}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {bothLiked.length === 0 && disagreed.length === 0 && (
                            <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: 16 }}>
                                {t('vote.waitingPartner')}
                            </p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// Inline vote buttons to use inside itinerary items
export function VoteButtons({ tripId, itemKey, votes, onVote }) {
    const myVote = votes?.[itemKey]?.myVote
    const partnerVote = votes?.[itemKey]?.partnerVote

    return (
        <div className="vote-buttons">
            <button
                className={`vote-btn ${myVote === 'up' ? 'vote-btn-up-active' : ''}`}
                onClick={() => onVote(itemKey, 'up')}
            >
                <ThumbsUp size={14} />
            </button>
            <button
                className={`vote-btn ${myVote === 'down' ? 'vote-btn-down-active' : ''}`}
                onClick={() => onVote(itemKey, 'down')}
            >
                <ThumbsDown size={14} />
            </button>
            {partnerVote && partnerVote !== 'neutral' && (
                <span className={`partner-vote ${partnerVote === 'up' ? 'partner-vote-up' : 'partner-vote-down'}`}>
                    {partnerVote === 'up' ? <Heart size={12} /> : <HeartOff size={12} />}
                </span>
            )}
        </div>
    )
}
