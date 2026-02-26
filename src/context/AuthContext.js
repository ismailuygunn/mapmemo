'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const getUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                setUser(user)
                if (user) {
                    const { data } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single()
                    setProfile(data)
                }
            } catch (err) {
                console.error('Auth check failed:', err)
                setUser(null)
            }
            setLoading(false)
        }
        getUser()

        const timeout = setTimeout(() => setLoading(false), 8000)

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setUser(session?.user ?? null)
                if (session?.user) {
                    const { data } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single()
                    setProfile(data)
                } else {
                    setProfile(null)
                }
            }
        )

        return () => { subscription.unsubscribe(); clearTimeout(timeout) }
    }, [])

    const signUp = async (email, password, displayName) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { display_name: displayName }
            }
        })
        if (error) throw error

        if (data.user) {
            await supabase.from('profiles').upsert({
                id: data.user.id,
                display_name: displayName,
                email: email,
            })
        }
        return data
    }

    const signIn = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        return data
    }

    const signInWithGoogle = async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/onboarding`,
            }
        })
        if (error) throw error
        return data
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
    }

    const updateProfile = async (updates) => {
        if (!user) return
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single()
        if (error) throw error
        setProfile(data)
        return data
    }

    return (
        <AuthContext.Provider value={{
            user, profile, loading, signUp, signIn, signInWithGoogle, signOut, updateProfile
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
