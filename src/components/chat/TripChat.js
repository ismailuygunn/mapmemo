'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { Send, MapPin, Smile } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function TripChat({ tripId, spaceId, locale }) {
    const [messages, setMessages] = useState([])
    const [newMsg, setNewMsg] = useState('')
    const [sending, setSending] = useState(false)
    const [members, setMembers] = useState({})
    const endRef = useRef(null)
    const { user } = useAuth()
    const supabase = createClient()
    const t = (tr, en) => locale === 'tr' ? tr : en

    useEffect(() => { loadMessages(); loadMembers(); subscribeRealtime() }, [tripId])

    const loadMessages = async () => {
        const { data } = await supabase.from('trip_messages').select('*').eq('trip_id', tripId).order('created_at', { ascending: true }).limit(100)
        if (data) setMessages(data)
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }

    const loadMembers = async () => {
        const { data } = await supabase.from('space_members').select('user_id, profiles(display_name, avatar_url)').eq('space_id', spaceId)
        if (data) {
            const map = {}
            data.forEach(m => { map[m.user_id] = m.profiles })
            setMembers(map)
        }
    }

    const subscribeRealtime = () => {
        const channel = supabase.channel(`trip-chat-${tripId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trip_messages', filter: `trip_id=eq.${tripId}` }, (payload) => {
                setMessages(prev => [...prev, payload.new])
                setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
            })
            .subscribe()
        return () => supabase.removeChannel(channel)
    }

    const sendMessage = async (e) => {
        e.preventDefault()
        if (!newMsg.trim() || sending) return
        setSending(true)
        await supabase.from('trip_messages').insert({ trip_id: tripId, space_id: spaceId, user_id: user.id, content: newMsg.trim(), type: 'text' })
        setNewMsg('')
        setSending(false)
    }

    const isMe = (msg) => msg.user_id === user?.id
    const getName = (userId) => members[userId]?.display_name || 'User'
    const getAvatar = (userId) => members[userId]?.display_name?.[0]?.toUpperCase() || '?'
    const fmtTime = (ts) => new Date(ts).toLocaleTimeString(locale === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' })

    // Group messages by date
    const grouped = messages.reduce((acc, msg) => {
        const date = new Date(msg.created_at).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' })
        if (!acc[date]) acc[date] = []
        acc[date].push(msg)
        return acc
    }, {})

    return (
        <div className="chat-container">
            <div className="chat-messages">
                {messages.length === 0 && (
                    <div className="chat-empty">
                        <span style={{ fontSize: '2rem' }}>💬</span>
                        <p>{t('Henüz mesaj yok. İlk mesajı sen gönder!', 'No messages yet. Send the first one!')}</p>
                    </div>
                )}
                {Object.entries(grouped).map(([date, msgs]) => (
                    <div key={date}>
                        <div className="chat-date-divider"><span>{date}</span></div>
                        {msgs.map((msg, i) => (
                            <motion.div key={msg.id || i} className={`chat-bubble-row ${isMe(msg) ? 'chat-me' : 'chat-other'}`}
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                                {!isMe(msg) && <div className="chat-avatar" style={{ background: `hsl(${msg.user_id?.charCodeAt(0) * 5 || 0}, 60%, 50%)` }}>{getAvatar(msg.user_id)}</div>}
                                <div className="chat-bubble">
                                    {!isMe(msg) && <span className="chat-sender">{getName(msg.user_id)}</span>}
                                    <p className="chat-text">{msg.content}</p>
                                    <span className="chat-time">{fmtTime(msg.created_at)}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ))}
                <div ref={endRef} />
            </div>
            <form className="chat-input-bar" onSubmit={sendMessage}>
                <input className="chat-input" placeholder={t('Mesaj yaz...', 'Type a message...')} value={newMsg} onChange={e => setNewMsg(e.target.value)} autoComplete="off" />
                <button type="submit" className="chat-send-btn" disabled={!newMsg.trim() || sending}>
                    <Send size={18} />
                </button>
            </form>
        </div>
    )
}
