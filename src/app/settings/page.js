'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useSpace } from '@/context/SpaceContext'
import { useTheme } from '@/context/ThemeContext'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import { Sun, Moon, User, Users, Copy, Check, LogOut, Shield, Globe, Crown, UserMinus, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const ROLE_LABELS = {
    owner: { label: '👑 Owner', color: '#F59E0B' },
    admin: { label: '🛡️ Admin', color: '#8B5CF6' },
    editor: { label: '✏️ Editor', color: '#3B82F6' },
    viewer: { label: '👁️ Viewer', color: '#6B7280' },
}

export default function SettingsPage() {
    const { user, profile, updateProfile, signOut } = useAuth()
    const { space, members, userRole, partner, permissions, updateMemberRole, removeMember, loadSpace } = useSpace()
    const { theme, toggleTheme } = useTheme()
    const { t, locale, setLocale } = useLanguage()
    const { toast } = useToast()
    const router = useRouter()
    const [displayName, setDisplayName] = useState(profile?.display_name || '')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [copied, setCopied] = useState(false)
    const [roleDropdown, setRoleDropdown] = useState(null)

    const handleSaveName = async () => {
        setSaving(true)
        try {
            await updateProfile({ display_name: displayName })
            setSaved(true)
            toast.success(t('settings.profileSaved') || 'İsim kaydedildi ✅')
            setTimeout(() => setSaved(false), 2000)
        } catch (err) {
            toast.error(err?.message || 'Hata oluştu')
        }
        setSaving(false)
    }

    const copyInvite = () => {
        if (!space) return
        const link = `${window.location.origin}/invite/${space.invite_code}`
        navigator.clipboard.writeText(link)
        setCopied(true)
        toast.success(t('settings.inviteCopied') || 'Davet linki kopyalandı 📎')
        setTimeout(() => setCopied(false), 2000)
    }

    const handleLogout = async () => {
        await signOut()
        router.push('/login')
    }

    const handleRoleChange = async (memberId, newRole) => {
        try {
            await updateMemberRole(memberId, newRole)
            toast.success('Rol güncellendi ✅')
        } catch (err) {
            toast.error(err.message)
        }
        setRoleDropdown(null)
    }

    const handleRemoveMember = async (memberId, name) => {
        if (!confirm(`${name} grubundan çıkarılsın mı?`)) return
        try {
            await removeMember(memberId)
            toast.success(`${name} çıkarıldı`)
        } catch (err) {
            toast.error(err.message)
        }
    }

    return (
        <>
            <Sidebar />
            <div className="main-content">
                <div className="page" style={{ maxWidth: 640 }}>
                    <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img src="/umae-icon.png?v=3" alt="UMAE" style={{ width: 36, height: 36, borderRadius: 10 }} />
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
                                <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
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
                                    <input type="text" className="input" value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)} />
                                    <button
                                        className={`btn ${saved ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={handleSaveName} disabled={saving}
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

                    {/* Group Space & Members */}
                    <div className="settings-section">
                        <h3><Users size={18} style={{ display: 'inline', verticalAlign: -3, marginRight: 6 }} /> {t('settings.coupleSpace') || 'Space'}</h3>

                        {space ? (
                            <>
                                <div className="card" style={{ marginBottom: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                        <div>
                                            <h4>{space.name}</h4>
                                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                                {members.length} üye · Rolün: {ROLE_LABELS[userRole]?.label || userRole}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Members List */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {members.map((member) => {
                                            const isMe = member.user_id === user?.id
                                            const name = member.profiles?.display_name || member.profiles?.email || 'Unknown'
                                            const roleInfo = ROLE_LABELS[member.role] || ROLE_LABELS.viewer

                                            return (
                                                <div key={member.user_id} className="member-row">
                                                    <div className="member-avatar" style={{
                                                        background: isMe
                                                            ? 'linear-gradient(135deg, var(--primary-1), var(--primary-2))'
                                                            : 'linear-gradient(135deg, var(--accent-rose), var(--accent-amber))',
                                                    }}>
                                                        {name[0]?.toUpperCase()}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                                                            {name} {isMe && <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(sen)</span>}
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: roleInfo.color }}>
                                                            {roleInfo.label}
                                                        </div>
                                                    </div>

                                                    {/* Role change (owner only) */}
                                                    {permissions.canChangeRoles && !isMe && (
                                                        <div style={{ position: 'relative' }}>
                                                            <button
                                                                className="btn btn-ghost btn-sm"
                                                                onClick={() => setRoleDropdown(roleDropdown === member.user_id ? null : member.user_id)}
                                                            >
                                                                <ChevronDown size={14} />
                                                            </button>
                                                            <AnimatePresence>
                                                                {roleDropdown === member.user_id && (
                                                                    <motion.div
                                                                        className="role-dropdown"
                                                                        initial={{ opacity: 0, y: -8 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        exit={{ opacity: 0, y: -8 }}
                                                                    >
                                                                        {['admin', 'editor', 'viewer'].map(r => (
                                                                            <button key={r}
                                                                                className={`role-option ${member.role === r ? 'role-option-active' : ''}`}
                                                                                onClick={() => handleRoleChange(member.user_id, r)}
                                                                            >
                                                                                {ROLE_LABELS[r].label}
                                                                            </button>
                                                                        ))}
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    )}

                                                    {/* Remove member */}
                                                    {permissions.canManageMembers && !isMe && member.role !== 'owner' && (
                                                        <button
                                                            className="btn btn-ghost btn-sm"
                                                            onClick={() => handleRemoveMember(member.user_id, name)}
                                                            style={{ color: 'var(--error)' }}
                                                        >
                                                            <UserMinus size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Invite Link */}
                                {permissions.canInvite && (
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
                    <button className="btn btn-ghost w-full" style={{ color: 'var(--error)' }} onClick={handleLogout}>
                        <LogOut size={16} /> {t('settings.signOut')}
                    </button>
                </div>
            </div>
        </>
    )
}
