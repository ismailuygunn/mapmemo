'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useSpace } from '@/context/SpaceContext'
import { useTheme } from '@/context/ThemeContext'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import { Sun, Moon, User, Users, Copy, Check, LogOut, Shield } from 'lucide-react'
import { motion } from 'framer-motion'

export default function SettingsPage() {
    const { user, profile, updateProfile, signOut } = useAuth()
    const { space, partner } = useSpace()
    const { theme, toggleTheme } = useTheme()
    const router = useRouter()
    const [displayName, setDisplayName] = useState(profile?.display_name || '')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [copied, setCopied] = useState(false)

    const handleSaveName = async () => {
        setSaving(true)
        try {
            await updateProfile({ display_name: displayName })
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } catch { }
        setSaving(false)
    }

    const copyInvite = () => {
        if (!space) return
        const link = `${window.location.origin}/invite/${space.invite_token}`
        navigator.clipboard.writeText(link)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleLogout = async () => {
        await signOut()
        router.push('/login')
    }

    return (
        <>
            <Sidebar />
            <div className="main-content">
                <div className="page" style={{ maxWidth: 640 }}>
                    <div className="page-header">
                        <h1>⚙️ Settings</h1>
                    </div>

                    {/* Theme */}
                    <div className="settings-section">
                        <h3>Appearance</h3>
                        <div className="settings-row">
                            <div className="settings-row-info">
                                <h4>Theme</h4>
                                <p>{theme === 'dark' ? 'Dark mode is on' : 'Light mode is on'}</p>
                            </div>
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={theme === 'dark'}
                                    onChange={toggleTheme}
                                />
                                <span className="toggle-slider" />
                            </label>
                        </div>
                    </div>

                    {/* Profile */}
                    <div className="settings-section">
                        <h3><User size={18} style={{ display: 'inline', verticalAlign: -3, marginRight: 6 }} /> Profile</h3>

                        <div style={{ marginBottom: 16 }}>
                            <div className="input-group" style={{ marginBottom: 12 }}>
                                <label>Display Name</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input
                                        type="text"
                                        className="input"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                    />
                                    <button
                                        className={`btn ${saved ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={handleSaveName}
                                        disabled={saving}
                                    >
                                        {saved ? <><Check size={16} /> Saved!</> : saving ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Email</label>
                                <input type="email" className="input" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
                            </div>
                        </div>
                    </div>

                    {/* Space */}
                    <div className="settings-section">
                        <h3><Users size={18} style={{ display: 'inline', verticalAlign: -3, marginRight: 6 }} /> Couple Space</h3>

                        {space ? (
                            <>
                                <div className="card" style={{ marginBottom: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h4>{space.name}</h4>
                                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                                {partner ? `Shared with ${partner.display_name || partner.email}` : 'Waiting for partner to join'}
                                            </p>
                                        </div>
                                        {partner ? (
                                            <div style={{
                                                width: 40, height: 40, borderRadius: 20,
                                                background: 'linear-gradient(135deg, var(--accent-rose), var(--primary-2))',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'white', fontWeight: 700,
                                            }}>
                                                {(partner.display_name || 'P')[0].toUpperCase()}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>

                                {!partner && (
                                    <button className="btn btn-secondary w-full" onClick={copyInvite}>
                                        {copied ? <><Check size={16} /> Link Copied!</> : <><Copy size={16} /> Copy Invite Link</>}
                                    </button>
                                )}
                            </>
                        ) : (
                            <button className="btn btn-primary" onClick={() => router.push('/onboarding')}>
                                Create Couple Space
                            </button>
                        )}
                    </div>

                    {/* Security */}
                    <div className="settings-section">
                        <h3><Shield size={18} style={{ display: 'inline', verticalAlign: -3, marginRight: 6 }} /> Security</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                            All your data is private and only visible to you and your partner.
                        </p>
                    </div>

                    {/* Logout */}
                    <button
                        className="btn btn-ghost w-full"
                        style={{ color: 'var(--error)' }}
                        onClick={handleLogout}
                    >
                        <LogOut size={16} /> Sign out
                    </button>
                </div>
            </div>
        </>
    )
}
