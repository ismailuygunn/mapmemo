'use client'

import { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './AuthContext'

const SpaceContext = createContext({})

export function SpaceProvider({ children }) {
    const { user } = useAuth()
    const [space, setSpace] = useState(null)
    const [members, setMembers] = useState([])
    const [userRole, setUserRole] = useState(null)
    const [loading, setLoading] = useState(true)
    const [dbError, setDbError] = useState(null)
    const retryCountRef = useRef(0)
    const retryTimerRef = useRef(null)
    const loadingTimeoutRef = useRef(null)
    const supabase = createClient()

    useEffect(() => {
        if (!user) {
            setSpace(null)
            setMembers([])
            setUserRole(null)
            setLoading(false)
            setDbError(null)
            retryCountRef.current = 0
            return
        }
        loadSpace()
        return () => {
            if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
            if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current)
        }
    }, [user])

    const loadSpace = useCallback(async () => {
        setLoading(true)
        // CRITICAL: Hard timeout — never let loading stay stuck more than 5 seconds
        if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = setTimeout(() => {
            console.warn('SpaceContext: Hard timeout reached, forcing loading=false')
            setLoading(false)
        }, 5000)
        try {
            // Step 1: Get user's space membership — no timeout, let Supabase handle it
            const { data: membership, error } = await supabase
                .from('space_members')
                .select('space_id, role')
                .eq('user_id', user.id)
                .limit(1)
                .maybeSingle()

            if (error) {
                console.warn('space_members query error:', error.message)

                // If it's a recursion error, retry silently up to 3 times
                if (error.message?.includes('infinite recursion') || error.code === '42P17') {
                    if (retryCountRef.current < 2) {
                        retryCountRef.current++
                        console.log(`Retrying space load (attempt ${retryCountRef.current}/2)...`)
                        retryTimerRef.current = setTimeout(() => loadSpace(), 1000)
                        return
                    }
                    // After 3 retries, still set dbError but don't block the app
                    setDbError('RLS_RECURSION')
                }
                // For other errors, just continue without space — don't block the app
                setLoading(false)
                return
            }

            // Reset retry counter on success
            retryCountRef.current = 0
            setDbError(null)

            if (membership) {
                setUserRole(membership.role)

                // Step 2: Get space details
                const { data: spaceData } = await supabase
                    .from('spaces')
                    .select('*')
                    .eq('id', membership.space_id)
                    .single()

                setSpace(spaceData || { id: membership.space_id, name: 'Space' })

                // Step 3: Get members (non-blocking)
                supabase
                    .from('space_members')
                    .select('user_id, role, joined_at, profiles(display_name, avatar_url, email)')
                    .eq('space_id', membership.space_id)
                    .order('joined_at', { ascending: true })
                    .then(({ data }) => setMembers(data || []))
                    .catch(() => setMembers([]))
            } else {
                // No membership found — auto-create a personal space
                // This ensures pins, trips, and cities all work (RLS requires space_id)
                console.log('No space found, auto-creating personal space...')
                try {
                    const inviteToken = Array.from(crypto.getRandomValues(new Uint8Array(16)))
                        .map(b => b.toString(16).padStart(2, '0')).join('')

                    const { data: newSpace, error: createErr } = await supabase
                        .from('spaces')
                        .insert({ name: 'Benim Haritam', created_by: user.id, invite_token: inviteToken })
                        .select()
                        .single()

                    if (createErr) {
                        console.error('Auto-create space error:', createErr.message)
                    } else {
                        const { error: memberErr } = await supabase
                            .from('space_members')
                            .insert({ space_id: newSpace.id, user_id: user.id, role: 'owner' })

                        if (memberErr) {
                            console.error('Auto-create membership error:', memberErr.message)
                            await supabase.from('spaces').delete().eq('id', newSpace.id)
                        } else {
                            setSpace(newSpace)
                            setUserRole('owner')
                            setMembers([{ user_id: user.id, role: 'owner', joined_at: new Date().toISOString() }])
                            setDbError(null)
                        }
                    }
                } catch (autoErr) {
                    console.error('Auto-create space failed:', autoErr)
                }
            }
        } catch (err) {
            console.error('Error loading space:', err)
            // Don't set dbError for generic errors — just continue
        }
        if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current)
        setLoading(false)
    }, [user, supabase])

    const createSpace = async (name) => {
        const inviteToken = Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0')).join('')

        const { data: spaceData, error: spaceError } = await supabase
            .from('spaces')
            .insert({ name, created_by: user.id, invite_token: inviteToken })
            .select()
            .single()

        if (spaceError) throw new Error(`Space oluşturulamadı: ${spaceError.message}`)

        const { error: memberError } = await supabase
            .from('space_members')
            .insert({ space_id: spaceData.id, user_id: user.id, role: 'owner' })

        if (memberError) {
            await supabase.from('spaces').delete().eq('id', spaceData.id)
            throw new Error(`Üyelik oluşturulamadı: ${memberError.message}`)
        }

        setSpace(spaceData)
        setUserRole('owner')
        setDbError(null)
        return spaceData
    }

    const joinSpace = async (inviteToken) => {
        const { data: spaceData, error: findError } = await supabase
            .from('spaces')
            .select('*')
            .eq('invite_token', inviteToken)
            .single()

        if (findError || !spaceData) throw new Error('Geçersiz davet linki')

        // Check if already a member
        const { data: existing } = await supabase
            .from('space_members')
            .select('id')
            .eq('space_id', spaceData.id)
            .eq('user_id', user.id)
            .maybeSingle()

        if (existing) {
            setSpace(spaceData)
            await loadSpace()
            return spaceData
        }

        const { error: joinError } = await supabase
            .from('space_members')
            .insert({ space_id: spaceData.id, user_id: user.id, role: 'editor' })

        if (joinError) throw new Error(`Katılım başarısız: ${joinError.message}`)

        setSpace(spaceData)
        await loadSpace()
        return spaceData
    }

    const updateMemberRole = async (memberId, newRole) => {
        if (userRole !== 'owner') throw new Error('Sadece alan sahibi rol değiştirebilir')
        const { error } = await supabase
            .from('space_members')
            .update({ role: newRole })
            .eq('user_id', memberId)
            .eq('space_id', space.id)
        if (error) throw error
        await loadSpace()
    }

    const removeMember = async (memberId) => {
        if (!['owner', 'admin'].includes(userRole)) throw new Error('Yetkiniz yok')
        if (memberId === user.id) throw new Error('Kendinizi çıkaramazsınız')
        const { error } = await supabase
            .from('space_members')
            .delete()
            .eq('user_id', memberId)
            .eq('space_id', space.id)
        if (error) throw error
        await loadSpace()
    }

    const permissions = useMemo(() => ({
        isOwner: userRole === 'owner',
        canInvite: ['owner', 'admin'].includes(userRole),
        canEdit: ['owner', 'admin', 'editor'].includes(userRole),
        canManageMembers: ['owner', 'admin'].includes(userRole),
        canChangeRoles: userRole === 'owner',
        canView: !!userRole,
    }), [userRole])

    const partner = useMemo(() => {
        const others = members.filter(m => m.user_id !== user?.id)
        return others.length > 0 ? others[0].profiles : null
    }, [members, user])

    return (
        <SpaceContext.Provider value={{
            space, members, userRole, partner, loading, permissions, dbError,
            createSpace, joinSpace, loadSpace, updateMemberRole, removeMember,
            setSpace, setUserRole,
        }}>
            {children}
        </SpaceContext.Provider>
    )
}

export const useSpace = () => useContext(SpaceContext)
