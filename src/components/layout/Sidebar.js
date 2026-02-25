'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Map, Compass, Calendar, Settings, LogOut } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const navItems = [
    { icon: Map, label: 'Map', href: '/map' },
    { icon: Compass, label: 'Cities', href: '/cities' },
    { icon: Calendar, label: 'Planner', href: '/planner' },
    { icon: Settings, label: 'Settings', href: '/settings' },
]

export default function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { signOut } = useAuth()

    const handleLogout = async () => {
        await signOut()
        router.push('/login')
    }

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">M</div>
                <nav className="sidebar-nav">
                    {navItems.map(({ icon: Icon, label, href }) => (
                        <button
                            key={href}
                            className={`sidebar-link ${pathname.startsWith(href) ? 'sidebar-link-active' : ''}`}
                            onClick={() => router.push(href)}
                            title={label}
                        >
                            <Icon size={22} />
                        </button>
                    ))}
                </nav>
                <button
                    className="sidebar-link"
                    onClick={handleLogout}
                    title="Sign out"
                    style={{ marginTop: 'auto' }}
                >
                    <LogOut size={20} />
                </button>
            </aside>

            {/* Mobile Bottom Nav */}
            <nav className="mobile-nav">
                <div className="mobile-nav-inner">
                    {navItems.map(({ icon: Icon, label, href }) => (
                        <button
                            key={href}
                            className={`mobile-nav-link ${pathname.startsWith(href) ? 'mobile-nav-link-active' : ''}`}
                            onClick={() => router.push(href)}
                        >
                            <Icon size={20} />
                            <span>{label}</span>
                        </button>
                    ))}
                </div>
            </nav>
        </>
    )
}
