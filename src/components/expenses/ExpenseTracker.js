'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { Plus, X, Receipt, Coffee, Car, Hotel, Ticket, ShoppingBag, Utensils, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const CATEGORIES = [
    { key: 'food', emoji: '🍽️', icon: Utensils, label: { tr: 'Yeme-İçme', en: 'Food & Drink' } },
    { key: 'transport', emoji: '🚕', icon: Car, label: { tr: 'Ulaşım', en: 'Transport' } },
    { key: 'hotel', emoji: '🏨', icon: Hotel, label: { tr: 'Konaklama', en: 'Accommodation' } },
    { key: 'activity', emoji: '🎫', icon: Ticket, label: { tr: 'Aktivite', en: 'Activity' } },
    { key: 'shopping', emoji: '🛍️', icon: ShoppingBag, label: { tr: 'Alışveriş', en: 'Shopping' } },
    { key: 'other', emoji: '📌', icon: Receipt, label: { tr: 'Diğer', en: 'Other' } },
]

export default function ExpenseTracker({ tripId, spaceId, locale }) {
    const [expenses, setExpenses] = useState([])
    const [members, setMembers] = useState([])
    const [showAdd, setShowAdd] = useState(false)
    const [form, setForm] = useState({ title: '', amount: '', category: 'food', currency: 'TRY' })
    const { user } = useAuth()
    const supabase = createClient()
    const t = (tr, en) => locale === 'tr' ? tr : en

    useEffect(() => { loadExpenses(); loadMembers() }, [tripId])

    const loadExpenses = async () => {
        const { data } = await supabase.from('trip_expenses').select('*, profiles:paid_by(display_name)').eq('trip_id', tripId).order('created_at', { ascending: false })
        if (data) setExpenses(data)
    }

    const loadMembers = async () => {
        const { data } = await supabase.from('space_members').select('user_id, profiles(display_name)').eq('space_id', spaceId)
        if (data) setMembers(data)
    }

    const addExpense = async (e) => {
        e.preventDefault()
        if (!form.title || !form.amount) return
        const amount = parseFloat(form.amount)
        if (isNaN(amount) || amount <= 0) return

        await supabase.from('trip_expenses').insert({
            trip_id: tripId, space_id: spaceId, paid_by: user.id,
            title: form.title, amount, currency: form.currency,
            category: form.category, split_type: 'equal',
        })

        // Create equal shares for all members
        const perPerson = amount / members.length
        for (const m of members) {
            await supabase.from('expense_shares').insert({
                expense_id: null, // Will need ID from insert
                user_id: m.user_id,
                amount: perPerson,
                is_settled: m.user_id === user.id,
            })
        }

        setForm({ title: '', amount: '', category: 'food', currency: 'TRY' })
        setShowAdd(false)
        loadExpenses()
    }

    // Calculate balances
    const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
    const perCategory = CATEGORIES.map(cat => ({
        ...cat,
        total: expenses.filter(e => e.category === cat.key).reduce((s, e) => s + (e.amount || 0), 0),
    })).filter(c => c.total > 0)

    // Per person spending
    const perPerson = {}
    expenses.forEach(e => {
        if (!perPerson[e.paid_by]) perPerson[e.paid_by] = { name: e.profiles?.display_name || 'User', total: 0 }
        perPerson[e.paid_by].total += e.amount || 0
    })
    const fairShare = members.length > 0 ? totalSpent / members.length : 0

    return (
        <div className="expense-container">
            {/* Total Summary */}
            <div className="expense-summary">
                <div className="expense-total-card">
                    <span className="expense-total-label">{t('Toplam Harcama', 'Total Spent')}</span>
                    <span className="expense-total-amount">₺{totalSpent.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                    <span className="expense-per-person">{t(`Kişi başı: ₺${fairShare.toFixed(0)}`, `Per person: ₺${fairShare.toFixed(0)}`)}</span>
                </div>
                <button className="expense-add-btn" onClick={() => setShowAdd(true)}><Plus size={16} /> {t('Harcama Ekle', 'Add Expense')}</button>
            </div>

            {/* Category Breakdown */}
            {perCategory.length > 0 && (
                <div className="expense-categories">
                    {perCategory.map(c => (
                        <div key={c.key} className="expense-cat-chip">
                            <span>{c.emoji}</span>
                            <span className="expense-cat-amount">₺{c.total.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Balances */}
            {Object.keys(perPerson).length > 1 && (
                <div className="expense-balances">
                    <h4 className="expense-balance-title">{t('Kimin Borcu Var?', 'Who Owes Whom?')}</h4>
                    {Object.entries(perPerson).map(([id, p]) => {
                        const diff = p.total - fairShare
                        return (
                            <div key={id} className="expense-balance-row">
                                <span className="expense-balance-name">{p.name}</span>
                                <span className={`expense-balance-diff ${diff >= 0 ? 'positive' : 'negative'}`}>
                                    {diff >= 0 ? `+₺${diff.toFixed(0)}` : `-₺${Math.abs(diff).toFixed(0)}`}
                                </span>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Expense List */}
            <div className="expense-list">
                {expenses.length === 0 ? (
                    <div className="expense-empty">
                        <Receipt size={40} style={{ color: 'var(--text-tertiary)' }} />
                        <p>{t('Henüz harcama yok', 'No expenses yet')}</p>
                    </div>
                ) : expenses.map(exp => {
                    const cat = CATEGORIES.find(c => c.key === exp.category) || CATEGORIES[5]
                    return (
                        <motion.div key={exp.id} className="expense-item" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
                            <span className="expense-item-emoji">{cat.emoji}</span>
                            <div className="expense-item-info">
                                <span className="expense-item-title">{exp.title}</span>
                                <span className="expense-item-meta">{exp.profiles?.display_name} · {new Date(exp.created_at).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' })}</span>
                            </div>
                            <span className="expense-item-amount">₺{(exp.amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                        </motion.div>
                    )
                })}
            </div>

            {/* Add Expense Modal */}
            <AnimatePresence>
                {showAdd && (
                    <motion.div className="expense-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAdd(false)}>
                        <motion.form className="expense-modal" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={e => e.stopPropagation()} onSubmit={addExpense}>
                            <div className="expense-modal-header">
                                <h3>{t('Harcama Ekle', 'Add Expense')}</h3>
                                <button type="button" onClick={() => setShowAdd(false)}><X size={18} /></button>
                            </div>
                            <input className="expense-modal-input" placeholder={t('Başlık (ör: Akşam yemeği)', 'Title (e.g. Dinner)')} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required autoFocus />
                            <input className="expense-modal-input" type="number" step="0.01" placeholder={t('Tutar (₺)', 'Amount (₺)')} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
                            <div className="expense-modal-cats">
                                {CATEGORIES.map(c => (
                                    <button key={c.key} type="button" className={`expense-cat-btn ${form.category === c.key ? 'active' : ''}`} onClick={() => setForm({ ...form, category: c.key })}>
                                        {c.emoji} {c.label[locale] || c.label.en}
                                    </button>
                                ))}
                            </div>
                            <button type="submit" className="expense-modal-submit">{t('Ekle', 'Add')}</button>
                        </motion.form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
