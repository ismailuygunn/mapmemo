'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useSpace } from '@/context/SpaceContext'
import { useTheme } from '@/context/ThemeContext'
import { useLanguage } from '@/context/LanguageContext'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import { Sun, Moon, User, Users, Copy, Check, LogOut, Shield, Globe } from 'lucide-react'
import { motion } from 'framer-motion'

export default function SettingsPage() {
    const { user, profile, updateProfile, signOut } = useAuth()
    const { space, partner } = useSpace()
    const { theme, toggleTheme } = useTheme()
    const { t, locale, setLocale } = useLanguage()
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
                        <h1>⚙️ {t('settings.title')}</h1>
                    </div>

                    {/* Language */}
                    <div className="settings-section">
                        <h3><Globe size={18} style={{ display: 'inline', verticalAlign: -3, marginRight: 6 }} /> {t('settings.language')}</h3>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                            {t('settings.languageDesc')}
                        </p>
                        <div className="lang-selector">
                            <button
                                className={`lang-option ${locale === 'tr' ? 'lang-option-active' : ''}`}
                                onClick={() => setLocale('tr')}
                            >
                                <span className="lang-flag">🇹🇷</span>
                                <span>Türkçe</span>
                            </button>
                            <button
                                className={`lang-option ${locale === 'en' ? 'lang-option-active' : ''}`}
                                onClick={() => setLocale('en')}
                            >
                                <span className="lang-flag">🇬🇧</span>
                                <span>English</span>
                            </button>
                        </div>
                    </div>

                    {/* Theme */}
                    <div className="settings-section">
                        <h3>{t('settings.appearance')}</h3>
                        <div className="settings-row">
                            <div className="settings-row-info">
                                <h4>{t('settings.theme')}</h4>
                                <p>{theme === 'dark' ? t('settings.darkMode') : t('settings.lightMode')}</p>
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
                        <h3><User size={18} style={{ display: 'inline', verticalAlign: -3, marginRight: 6 }} /> {t('settings.profile')}</h3>

                        <div style={{ marginBottom: 16 }}>
                            <div className="input-group" style={{ marginBottom: 12 }}>
                                <label>{t('settings.displayName')}</label>
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
                                        {saved ? <><Check size={16} /> {t('settings.saved')}</> : saving ? t('settings.saving') : t('settings.save')}
                                    </button>
                                </div>
                            </div>

                            <div className="input-group">
                                <label>{t('auth.email')}</label>
                                <input type="email" className="input" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
                            </div>
                        </div>
                    </div>

                    {/* Space */}
                    <div className="settings-section">
                        <h3><Users size={18} style={{ display: 'inline', verticalAlign: -3, marginRight: 6 }} /> {t('settings.coupleSpace')}</h3>

                        {space ? (
                            <>
                                <div className="card" style={{ marginBottom: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h4>{space.name}</h4>
                                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                                {partner ? `${t('settings.sharedWith')} ${partner.display_name || partner.email}` : t('settings.waitingPartner')}
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
                                        {copied ? <><Check size={16} /> {t('settings.linkCopied')}</> : <><Copy size={16} /> {t('settings.copyInvite')}</>}
                                    </button>
                                )}
                            </>
                        ) : (
                            <button className="btn btn-primary" onClick={() => router.push('/onboarding')}>
                                {t('settings.createCoupleSpace')}
                            </button>
                        )}
                    </div>

                    {/* Security */}
                    <div className="settings-section">
                        <h3><Shield size={18} style={{ display: 'inline', verticalAlign: -3, marginRight: 6 }} /> {t('settings.security')}</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                            {t('settings.securityDesc')}
                        </p>
                    </div>

                    {/* Logout */}
                    <button
                        className="btn btn-ghost w-full"
                        style={{ color: 'var(--error)' }}
                        onClick={handleLogout}
                    >
                        <LogOut size={16} /> {t('settings.signOut')}
                    </button>
                </div>
            </div>
        </>
    )
}
