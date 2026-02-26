'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useSpace } from '@/context/SpaceContext'
import { Plus, X, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const CATEGORIES = [
    { key: 'food', emoji: '🍕', label: { tr: 'Yemek', en: 'Food' }, color: '#F59E0B' },
    { key: 'transport', emoji: '🚕', label: { tr: 'Ulaşım', en: 'Transport' }, color: '#3B82F6' },
    { key: 'hotel', emoji: '🏨', label: { tr: 'Konaklama', en: 'Stay' }, color: '#8B5CF6' },
    { key: 'shopping', emoji: '🛍️', label: { tr: 'Alışveriş', en: 'Shopping' }, color: '#EC4899' },
    { key: 'ticket', emoji: '🎫', label: { tr: 'Bilet', en: 'Tickets' }, color: '#10B981' },
    { key: 'other', emoji: '📦', label: { tr: 'Diğer', en: 'Other' }, color: '#64748B' },
]

export default function ExpenseTracker({ tripId, spaceId, locale }) {
    const [expenses, setExpenses] = useState([])
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ description: '', amount: '', category: 'food', paidBy: '' })
    const { user } = useAuth()
    const { members } = useSpace()
    const t = (tr, en) => locale === 'tr' ? tr : en

    // Load from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(`expenses-${tripId}`)
            if (saved) setExpenses(JSON.parse(saved))
        } catch { }
    }, [tripId])

    const save = (list) => {
        setExpenses(list)
        localStorage.setItem(`expenses-${tripId}`, JSON.stringify(list))
    }

    const addExpense = () => {
        if (!form.description.trim() || !form.amount) return
        const amount = parseFloat(form.amount)
        if (isNaN(amount) || amount <= 0) return

        const paidByMember = form.paidBy ? members?.find(m => m.user_id === form.paidBy) : null
        const expense = {
            id: Date.now(),
            description: form.description.trim(),
            amount,
            category: form.category,
            paidBy: form.paidBy || user?.id || 'me',
            paidByName: paidByMember?.profiles?.display_name || user?.user_metadata?.full_name || 'Ben',
            date: new Date().toISOString(),
        }
        save([expense, ...expenses])
        setForm({ description: '', amount: '', category: 'food', paidBy: '' })
        setShowForm(false)
    }

    const deleteExpense = (id) => save(expenses.filter(e => e.id !== id))

    const total = expenses.reduce((s, e) => s + e.amount, 0)
    const perCategory = CATEGORIES.map(c => ({
        ...c,
        total: expenses.filter(e => e.category === c.key).reduce((s, e) => s + e.amount, 0),
    })).filter(c => c.total > 0)

    // Calculate split
    const memberCount = Math.max(members?.length || 1, 1)
    const perPerson = total / memberCount

    // Calculate who owes whom
    const balances = {}
    expenses.forEach(e => {
        balances[e.paidByName] = (balances[e.paidByName] || 0) + e.amount
    })
    const settlements = []
    Object.entries(balances).forEach(([name, paid]) => {
        const diff = paid - perPerson
        if (Math.abs(diff) > 1) { // ignore tiny rounding diffs
            settlements.push({
                name,
                amount: Math.abs(diff),
                type: diff > 0 ? 'owed' : 'owes',
            })
        }
    })

    return (
        <div className="tool-tab">
            <div className="tool-header">
                <h3>💰 {t('Harcamalar', 'Expenses')}</h3>
                <button
                    className="btn btn-sm btn-primary"
                    onClick={() => setShowForm(!showForm)}
                    style={{ borderRadius: 20, padding: '4px 14px', fontSize: '0.75rem' }}
                >
                    {showForm ? '✕' : <><Plus size={14} /> {t('Ekle', 'Add')}</>}
                </button>
            </div>

            {/* ── Add Expense Form ── */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{
                            background: 'var(--bg-primary)', borderRadius: 14,
                            padding: 16, border: '1px solid var(--border-primary)',
                            marginBottom: 16,
                        }}>
                            <input
                                className="input"
                                placeholder={t('Açıklama (Taksi, Restoran...)', 'Description')}
                                value={form.description}
                                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                style={{ marginBottom: 8 }}
                                autoFocus
                                onKeyDown={e => e.key === 'Enter' && addExpense()}
                            />
                            <input
                                className="input"
                                type="number"
                                inputMode="decimal"
                                placeholder={t('Tutar (₺)', 'Amount (₺)')}
                                value={form.amount}
                                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                                style={{ marginBottom: 10 }}
                                onKeyDown={e => e.key === 'Enter' && addExpense()}
                            />

                            {/* Category pills */}
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                                {CATEGORIES.map(c => (
                                    <button
                                        key={c.key}
                                        onClick={() => setForm(p => ({ ...p, category: c.key }))}
                                        style={{
                                            padding: '5px 12px', borderRadius: 20,
                                            fontSize: '0.72rem', border: 'none', cursor: 'pointer',
                                            fontWeight: 600, transition: 'all 200ms',
                                            background: form.category === c.key ? c.color : 'var(--bg-secondary)',
                                            color: form.category === c.key ? 'white' : 'var(--text-secondary)',
                                        }}
                                    >
                                        {c.emoji} {c.label[locale] || c.label.en}
                                    </button>
                                ))}
                            </div>

                            {/* Who paid */}
                            {members?.length > 1 && (
                                <select
                                    className="input"
                                    value={form.paidBy}
                                    onChange={e => setForm(p => ({ ...p, paidBy: e.target.value }))}
                                    style={{ marginBottom: 10, fontSize: '0.82rem' }}
                                >
                                    <option value="">{t('Ben ödedim', 'I paid')}</option>
                                    {members.map(m => (
                                        <option key={m.user_id} value={m.user_id}>
                                            {m.profiles?.display_name || m.profiles?.email || '?'}
                                        </option>
                                    ))}
                                </select>
                            )}

                            <button
                                className="btn btn-primary w-full"
                                onClick={addExpense}
                                disabled={!form.description || !form.amount}
                                style={{ borderRadius: 12 }}
                            >
                                💰 {t('Harcama Ekle', 'Add Expense')}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Summary Cards ── */}
            {expenses.length > 0 && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                            borderRadius: 14, padding: '14px 16px', color: 'white',
                        }}>
                            <div style={{ fontSize: '0.68rem', opacity: 0.8 }}>{t('Toplam Harcama', 'Total Spent')}</div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>₺{total.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}</div>
                        </div>
                        <div style={{
                            background: 'linear-gradient(135deg, #10B981, #059669)',
                            borderRadius: 14, padding: '14px 16px', color: 'white',
                        }}>
                            <div style={{ fontSize: '0.68rem', opacity: 0.8 }}>{t('Kişi Başı', 'Per Person')}</div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>₺{Math.round(perPerson).toLocaleString()}</div>
                            <div style={{ fontSize: '0.62rem', opacity: 0.7 }}>{memberCount} {t('kişi', 'people')}</div>
                        </div>
                    </div>

                    {/* Category chips */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                        {perCategory.map(c => (
                            <div key={c.key} style={{
                                padding: '4px 10px', borderRadius: 20, fontSize: '0.7rem',
                                fontWeight: 700, background: `${c.color}22`, color: c.color,
                                border: `1px solid ${c.color}33`,
                            }}>
                                {c.emoji} ₺{c.total.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                            </div>
                        ))}
                    </div>

                    {/* Balance / Who owes whom */}
                    {settlements.length > 0 && (
                        <div style={{
                            background: 'var(--bg-primary)', borderRadius: 12, padding: 12,
                            marginBottom: 14, border: '1px solid var(--border-primary)',
                        }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-tertiary)' }}>
                                ⚖️ {t('Hesap Özeti', 'Balance')}
                            </div>
                            {settlements.map((s, i) => (
                                <div key={i} style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    alignItems: 'center', padding: '5px 0', fontSize: '0.82rem',
                                }}>
                                    <span style={{ fontWeight: 500 }}>{s.name}</span>
                                    <span style={{
                                        fontWeight: 700,
                                        color: s.type === 'owed' ? '#10B981' : '#EF4444',
                                    }}>
                                        {s.type === 'owed'
                                            ? `+₺${Math.round(s.amount).toLocaleString()} ${t('alacaklı', 'owed')}`
                                            : `-₺${Math.round(s.amount).toLocaleString()} ${t('borçlu', 'owes')}`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ── Expense List ── */}
            {expenses.length === 0 ? (
                <div className="trip-placeholder">
                    <span style={{ fontSize: '3rem' }}>💸</span>
                    <p style={{ fontWeight: 600 }}>{t('Henüz harcama eklenmedi', 'No expenses yet')}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', maxWidth: 240 }}>
                        {t('Harcamalarını ekle, grup içinde otomatik bölünsün', 'Add expenses, auto-split among group members')}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {expenses.map(e => {
                        const cat = CATEGORIES.find(c => c.key === e.category)
                        return (
                            <motion.div
                                key={e.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '10px 12px', background: 'var(--bg-primary)',
                                    borderRadius: 12, border: '1px solid var(--border-primary)',
                                }}
                            >
                                <div style={{
                                    width: 38, height: 38, borderRadius: 10,
                                    background: `${cat?.color || '#64748B'}22`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.1rem', flexShrink: 0,
                                }}>
                                    {cat?.emoji || '📦'}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{e.description}</div>
                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                                        {e.paidByName} • {new Date(e.date).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' })}
                                    </div>
                                </div>
                                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                                    ₺{e.amount.toLocaleString()}
                                </div>
                                <button
                                    onClick={() => deleteExpense(e.id)}
                                    style={{
                                        background: 'none', border: 'none',
                                        color: 'var(--text-tertiary)', cursor: 'pointer',
                                        padding: 4, opacity: 0.5,
                                    }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
