'use client'

import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './AuthContext'

const SpaceContext = createContext({})

// Helper: race a promise against a timeout
function withTimeout(promise, ms = 8000) {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT')), ms)
        ),
    ])
}

export function SpaceProvider({ children }) {
    const { user } = useAuth()
    const [space, setSpace] = useState(null)
    const [members, setMembers] = useState([])
    const [userRole, setUserRole] = useState(null)
    const [loading, setLoading] = useState(true)
    const [dbError, setDbError] = useState(null)
    const supabase = createClient()

    useEffect(() => {
        if (!user) {
            setSpace(null)
            setMembers([])
            setUserRole(null)
            setLoading(false)
            setDbError(null)
            return
        }
        loadSpace()
    }, [user])

    const loadSpace = async () => {
        setLoading(true)
        setDbError(null)
        try {
            // Step 1: Get user's space membership (with timeout)
            let membership = null
            try {
                const { data, error } = await withTimeout(
                    supabase
                        .from('space_members')
                        .select('space_id, role')
                        .eq('user_id', user.id)
                        .limit(1)
                        .maybeSingle()
                )
                if (error) {
                    // RLS recursion error or other DB error
                    if (error.message?.includes('infinite recursion')) {
                        setDbError('RLS_RECURSION')
                        setLoading(false)
                        return
                    }
                    console.warn('space_members query error:', error.message)
                }
                membership = data
            } catch (err) {
                if (err.message === 'TIMEOUT') {
                    console.warn('space_members query timed out — likely RLS recursion')
                    setDbError('RLS_RECURSION')
                    setLoading(false)
                    return
                }
                throw err
            }

            if (membership) {
                setUserRole(membership.role)

                // Step 2: Get space details (spaces table — separate RLS)
                try {
                    const { data: spaceData } = await withTimeout(
                        supabase
                            .from('spaces')
                            .select('*')
                            .eq('id', membership.space_id)
                            .single()
                    )
                    setSpace(spaceData)
                } catch (err) {
                    console.warn('spaces query failed:', err.message)
                    // If we have membership but can't load space, still set basic info
                    setSpace({ id: membership.space_id, name: 'Space' })
                }

                // Step 3: Get all members with profiles
                try {
                    const { data: memberData } = await withTimeout(
                        supabase
                            .from('space_members')
                            .select('user_id, role, joined_at, profiles(display_name, avatar_url, email)')
                            .eq('space_id', membership.space_id)
                            .order('joined_at', { ascending: true })
                    )
                    setMembers(memberData || [])
                } catch (err) {
                    console.warn('members query failed:', err.message)
                    // Still functional without member list
                    setMembers([])
                }
            }
            // If no membership, user hasn't created/joined a space yet
            // loading will be set to false, onboarding will show
        } catch (err) {
            console.error('Error loading space:', err)
        }
        setLoading(false)
    }

    const createSpace = async (name) => {
        const inviteToken = Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0')).join('')

        // Step 1: Create the space
        const { data: spaceData, error: spaceError } = await withTimeout(
            supabase
                .from('spaces')
                .insert({ name, created_by: user.id, invite_token: inviteToken })
                .select()
                .single()
        )

        if (spaceError) throw new Error(`Space oluşturulamadı: ${spaceError.message}`)

        // Step 2: Add creator as owner
        try {
            const { error: memberError } = await withTimeout(
                supabase
                    .from('space_members')
                    .insert({ space_id: spaceData.id, user_id: user.id, role: 'owner' }),
                10000
            )
            if (memberError) throw new Error(`Üyelik oluşturulamadı: ${memberError.message}`)
        } catch (err) {
            // Clean up: delete the space if member creation failed
            await supabase.from('spaces').delete().eq('id', spaceData.id)
            if (err.message === 'TIMEOUT') {
                throw new Error('Veritabanı zaman aşımı. Supabase SQL Editor\'de fix_rls_v3.sql dosyasını çalıştırın.')
            }
            throw err
        }

        setSpace(spaceData)
        setUserRole('owner')
        setDbError(null)
        return spaceData
    }

    const joinSpace = async (inviteToken) => {
        const { data: spaceData, error: findError } = await withTimeout(
            supabase
                .from('spaces')
                .select('*')
                .eq('invite_token', inviteToken)
                .single()
        )

        if (findError || !spaceData) throw new Error('Geçersiz davet linki')

        // Check if already a member
        try {
            const { data: existing } = await withTimeout(
                supabase
                    .from('space_members')
                    .select('id')
                    .eq('space_id', spaceData.id)
                    .eq('user_id', user.id)
                    .maybeSingle()
            )

            if (existing) {
                setSpace(spaceData)
                await loadSpace()
                return spaceData
            }
        } catch {
            // If check fails, proceed to insert
        }

        const { error: joinError } = await withTimeout(
            supabase
                .from('space_members')
                .insert({ space_id: spaceData.id, user_id: user.id, role: 'editor' })
        )

        if (joinError) throw new Error(`Katılım başarısız: ${joinError.message}`)

        setSpace(spaceData)
        await loadSpace()
        return spaceData
    }

    const updateMemberRole = async (memberId, newRole) => {
        if (userRole !== 'owner') throw new Error('Sadece alan sahibi rol değiştirebilir')
        const { error } = await withTimeout(
            supabase
                .from('space_members')
                .update({ role: newRole })
                .eq('user_id', memberId)
                .eq('space_id', space.id)
        )
        if (error) throw error
        await loadSpace()
    }

    const removeMember = async (memberId) => {
        if (!['owner', 'admin'].includes(userRole)) throw new Error('Yetkiniz yok')
        if (memberId === user.id) throw new Error('Kendinizi çıkaramazsınız')
        const { error } = await withTimeout(
            supabase
                .from('space_members')
                .delete()
                .eq('user_id', memberId)
                .eq('space_id', space.id)
        )
        if (error) throw error
        await loadSpace()
    }

    // Permission helpers
    const permissions = useMemo(() => ({
        isOwner: userRole === 'owner',
        canInvite: ['owner', 'admin'].includes(userRole),
        canEdit: ['owner', 'admin', 'editor'].includes(userRole),
        canManageMembers: ['owner', 'admin'].includes(userRole),
        canChangeRoles: userRole === 'owner',
        canView: !!userRole,
    }), [userRole])

    // Backward compat: partner = first other member
    const partner = useMemo(() => {
        const others = members.filter(m => m.user_id !== user?.id)
        return others.length > 0 ? others[0].profiles : null
    }, [members, user])

    return (
        <SpaceContext.Provider value={{
            space, members, userRole, partner, loading, permissions, dbError,
            createSpace, joinSpace, loadSpace, updateMemberRole, removeMember,
        }}>
            {children}
        </SpaceContext.Provider>
    )
}

export const useSpace = () => useContext(SpaceContext)
