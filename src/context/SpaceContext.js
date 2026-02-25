'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './AuthContext'

const SpaceContext = createContext({})

export function SpaceProvider({ children }) {
    const { user } = useAuth()
    const [space, setSpace] = useState(null)
    const [partner, setPartner] = useState(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        if (!user) {
            setSpace(null)
            setPartner(null)
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
                // Get space details
                const { data: spaceData } = await supabase
                    .from('spaces')
                    .select('*')
                    .eq('id', membership.space_id)
                    .single()
                setSpace(spaceData)

                // Get partner
                const { data: members } = await supabase
                    .from('space_members')
                    .select('user_id, profiles(display_name, avatar_url, email)')
                    .eq('space_id', membership.space_id)
                    .neq('user_id', user.id)

                if (members && members.length > 0) {
                    setPartner(members[0].profiles)
                }
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
            return spaceData
        }

        // Check member count (max 2)
        const { count } = await supabase
            .from('space_members')
            .select('id', { count: 'exact' })
            .eq('space_id', spaceData.id)

        if (count >= 2) throw new Error('This couple space is already full')

        const { error: joinError } = await supabase
            .from('space_members')
            .insert({ space_id: spaceData.id, user_id: user.id, role: 'member' })

        if (joinError) throw joinError

        setSpace(spaceData)
        await loadSpace()
        return spaceData
    }

    return (
        <SpaceContext.Provider value={{
            space, partner, loading, createSpace, joinSpace, loadSpace
        }}>
            {children}
        </SpaceContext.Provider>
    )
}

export const useSpace = () => useContext(SpaceContext)
