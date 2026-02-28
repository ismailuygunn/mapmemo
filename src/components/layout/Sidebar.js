'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Map, Compass, Calendar, Settings, LogOut, Gift, ChevronLeft, ChevronRight, MapPin, CalendarDays, LayoutDashboard, Users, BarChart3, Shield, Zap, Plane, Ticket, MoreHorizontal, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { motion, AnimatePresence } from 'framer-motion'

export default function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { signOut, profile } = useAuth()
    const { t } = useLanguage()
    const [collapsed, setCollapsed] = useState(false)
    const [moreOpen, setMoreOpen] = useState(false)

    // Persist collapse state
    useEffect(() => {
        const saved = localStorage.getItem('umae-sidebar')
        if (saved === 'collapsed') setCollapsed(true)
    }, [])

    const toggleCollapse = () => {
        const next = !collapsed
        setCollapsed(next)
        localStorage.setItem('umae-sidebar', next ? 'collapsed' : 'expanded')
    }

    const navItems = [
        { icon: LayoutDashboard, label: t('nav.dashboard') || 'Panel', href: '/dashboard' },
        { icon: Map, label: t('nav.map') || 'Harita', href: '/map' },
        { icon: Compass, label: 'Keşfet', href: '/explore' },
        { icon: Compass, label: t('nav.cities') || 'Şehirler', href: '/cities' },
        { icon: Calendar, label: t('nav.planner') || 'Planla', href: '/planner' },
        { icon: Zap, label: 'SOS Plan', href: '/meetups' },
        { icon: Plane, label: t('Uçuşlar', 'Flights'), href: '/flights' },
        { icon: Ticket, label: 'Etkinlikler', href: '/events' },
        { icon: Users, label: 'Ekiplerim', href: '/spaces' },
        { icon: Gift, label: t('nav.capsules') || 'Kapsüller', href: '/capsules' },
        { icon: BarChart3, label: t('nav.stats') || 'İstatistik', href: '/stats' },
        { icon: Settings, label: t('nav.settings') || 'Ayarlar', href: '/settings' },
        ...(profile?.role === 'admin' ? [{ icon: Shield, label: 'Admin', href: '/admin' }] : []),
    ]

    // Mobile: 5 key items for bottom nav, rest in "More" drawer
    const mobileMainItems = [
        { icon: Map, label: 'Harita', href: '/map' },
        { icon: Zap, label: 'SOS Plan', href: '/meetups' },
        { icon: Compass, label: 'Keşfet', href: '/explore' },
        { icon: Users, label: 'Ekipler', href: '/spaces' },
        { icon: MoreHorizontal, label: 'Daha', href: '__more__' },
    ]

    const handleLogout = async () => {
        await signOut()
        router.push('/login')
    }

    const handleMobileNav = (href) => {
        if (href === '__more__') {
            setMoreOpen(true)
        } else {
            setMoreOpen(false)
            router.push(href)
        }
    }

    return (
        <>
            {/* Desktop Sidebar */}
            <motion.aside
                className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}
                animate={{ width: collapsed ? 72 : 220 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
                {/* Logo */}
                <div className="sidebar-top">
                    <div className="sidebar-logo-area" onClick={() => router.push('/map')}>
                        <div className="sidebar-logo-icon" style={{ padding: 0, overflow: 'hidden', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src="/umae-icon.png" alt="UMAE" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 10 }} />
                        </div>
                        <AnimatePresence>
                            {!collapsed && (
                                <motion.span
                                    className="sidebar-logo-text"
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    UMAE
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>
                    <button className="sidebar-collapse-btn" onClick={toggleCollapse}>
                        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                </div>

                {/* Nav Items */}
                <nav className="sidebar-nav">
                    {navItems.map(({ icon: Icon, label, href }) => {
                        const isActive = pathname.startsWith(href)
                        return (
                            <button
                                key={href}
                                className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
                                onClick={() => router.push(href)}
                                title={collapsed ? label : undefined}
                            >
                                <span className="sidebar-link-icon">
                                    <Icon size={20} />
                                </span>
                                <AnimatePresence>
                                    {!collapsed && (
                                        <motion.span
                                            className="sidebar-link-label"
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: 'auto' }}
                                            exit={{ opacity: 0, width: 0 }}
                                            transition={{ duration: 0.15 }}
                                        >
                                            {label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                                {isActive && (
                                    <motion.div
                                        className="sidebar-active-indicator"
                                        layoutId="sidebar-indicator"
                                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                    />
                                )}
                            </button>
                        )
                    })}
                </nav>

                {/* Logout */}
                <button
                    className="sidebar-link sidebar-logout"
                    onClick={handleLogout}
                    title={collapsed ? t('nav.signOut') : undefined}
                >
                    <span className="sidebar-link-icon">
                        <LogOut size={20} />
                    </span>
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.span
                                className="sidebar-link-label"
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.15 }}
                            >
                                {t('nav.signOut')}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </motion.aside>

            {/* Mobile Bottom Nav — 5 Key Items */}
            <nav className="mobile-nav">
                <div className="mobile-nav-pill">
                    {mobileMainItems.map(({ icon: Icon, label, href }) => {
                        const isActive = href === '__more__' ? moreOpen : pathname.startsWith(href)
                        return (
                            <button
                                key={href}
                                className={`mobile-nav-item ${isActive ? 'mobile-nav-item-active' : ''}`}
                                onClick={() => handleMobileNav(href)}
                            >
                                <span className="mobile-nav-icon">
                                    <Icon size={20} />
                                </span>
                                {isActive && (
                                    <motion.span
                                        className="mobile-nav-label"
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: 'auto' }}
                                        exit={{ opacity: 0, width: 0 }}
                                    >
                                        {label}
                                    </motion.span>
                                )}
                            </button>
                        )
                    })}
                </div>
            </nav>

            {/* Mobile "More" Drawer */}
            <AnimatePresence>
                {moreOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            className="mobile-more-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMoreOpen(false)}
                        />
                        {/* Drawer */}
                        <motion.div
                            className="mobile-more-drawer"
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                        >
                            <div className="mobile-more-header">
                                <span style={{ fontWeight: 700, fontSize: '1rem' }}>Tüm Sayfalar</span>
                                <button className="mobile-more-close" onClick={() => setMoreOpen(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="mobile-more-grid">
                                {navItems.map(({ icon: Icon, label, href }) => {
                                    const isActive = pathname.startsWith(href)
                                    return (
                                        <button
                                            key={href}
                                            className={`mobile-more-item ${isActive ? 'mobile-more-item-active' : ''}`}
                                            onClick={() => { setMoreOpen(false); router.push(href) }}
                                        >
                                            <div className="mobile-more-icon">
                                                <Icon size={22} />
                                            </div>
                                            <span className="mobile-more-label">{label}</span>
                                        </button>
                                    )
                                })}
                                {/* Logout */}
                                <button
                                    className="mobile-more-item"
                                    onClick={() => { setMoreOpen(false); handleLogout() }}
                                    style={{ color: 'var(--error)' }}
                                >
                                    <div className="mobile-more-icon" style={{ background: 'rgba(239,68,68,0.1)' }}>
                                        <LogOut size={22} />
                                    </div>
                                    <span className="mobile-more-label">Çıkış</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}
