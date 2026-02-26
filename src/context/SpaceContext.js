'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './AuthContext'

const SpaceContext = createContext({})

export function SpaceProvider({ children }) {
    const { user } = useAuth()
    const [space, setSpace] = useState(null)
    const [members, setMembers] = useState([])
    const [userRole, setUserRole] = useState(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        if (!user) {
            setSpace(null)
            setMembers([])
            setUserRole(null)
            setLoading(false)
            return
        }
        loadSpace()
    }, [user])

    const loadSpace = async () => {
        setLoading(true)
        try {
            // Get user's space membership
            const { data: membership } = await supabase
                .from('space_members')
                .select('space_id, role')
                .eq('user_id', user.id)
                .single()

            if (membership) {
                setUserRole(membership.role)

                // Get space details
                const { data: spaceData } = await supabase
                    .from('spaces')
                    .select('*')
                    .eq('id', membership.space_id)
                    .single()
                setSpace(spaceData)

                // Get all members with profiles
                const { data: memberData } = await supabase
                    .from('space_members')
                    .select('user_id, role, joined_at, profiles(display_name, avatar_url, email)')
                    .eq('space_id', membership.space_id)
                    .order('joined_at', { ascending: true })

                setMembers(memberData || [])
            }
        } catch (err) {
            console.error('Error loading space:', err)
        }
        setLoading(false)
    }

    const createSpace = async (name) => {
        const inviteToken = Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0')).join('')

        const { data: spaceData, error: spaceError } = await supabase
            .from('spaces')
            .insert({ name, created_by: user.id, invite_token: inviteToken })
            .select()
            .single()

        if (spaceError) throw spaceError

        const { error: memberError } = await supabase
            .from('space_members')
            .insert({ space_id: spaceData.id, user_id: user.id, role: 'owner' })

        if (memberError) throw memberError

        setSpace(spaceData)
        setUserRole('owner')
        return spaceData
    }

    const joinSpace = async (inviteToken) => {
        const { data: spaceData, error: findError } = await supabase
            .from('spaces')
            .select('*')
            .eq('invite_token', inviteToken)
            .single()

        if (findError || !spaceData) throw new Error('Invalid invite link')

        // Check if already a member
        const { data: existing } = await supabase
            .from('space_members')
            .select('id')
            .eq('space_id', spaceData.id)
            .eq('user_id', user.id)
            .single()

        if (existing) {
            setSpace(spaceData)
            await loadSpace()
            return spaceData
        }

        // No member limit — group spaces support unlimited members
        const { error: joinError } = await supabase
            .from('space_members')
            .insert({ space_id: spaceData.id, user_id: user.id, role: 'editor' })

        if (joinError) throw joinError

        setSpace(spaceData)
        await loadSpace()
        return spaceData
    }

    const updateMemberRole = async (memberId, newRole) => {
        if (userRole !== 'owner') throw new Error('Only owner can change roles')
        const { error } = await supabase
            .from('space_members')
            .update({ role: newRole })
            .eq('user_id', memberId)
            .eq('space_id', space.id)
        if (error) throw error
        await loadSpace()
    }

    const removeMember = async (memberId) => {
        if (!['owner', 'admin'].includes(userRole)) throw new Error('No permission')
        if (memberId === user.id) throw new Error('Cannot remove yourself')
        const { error } = await supabase
            .from('space_members')
            .delete()
            .eq('user_id', memberId)
            .eq('space_id', space.id)
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
            space, members, userRole, partner, loading, permissions,
            createSpace, joinSpace, loadSpace, updateMemberRole, removeMember,
        }}>
            {children}
        </SpaceContext.Provider>
    )
}

export const useSpace = () => useContext(SpaceContext)
