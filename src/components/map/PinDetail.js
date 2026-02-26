'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PIN_TYPES, PIN_STATUSES } from '@/lib/constants'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import { X, Edit3, Trash2, Star, Calendar, Tag, ExternalLink } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function PinDetail({ pin, onClose, onEdit, onDelete }) {
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const { t } = useLanguage()
    const { toast } = useToast()
    const supabase = createClient()
    const pinType = PIN_TYPES[pin.type] || PIN_TYPES.memory
    const pinStatus = PIN_STATUSES[pin.status] || PIN_STATUSES.visited

    const handleDelete = async () => {
        setDeleting(true)
        // Delete media from storage first
        if (pin.pin_media?.length > 0) {
            for (const media of pin.pin_media) {
                const path = media.url.split('/pin-media/')[1]
                if (path) {
                    await supabase.storage.from('pin-media').remove([path])
                }
            }
            await supabase.from('pin_media').delete().eq('pin_id', pin.id)
        }
        await supabase.from('pins').delete().eq('id', pin.id)
        toast.success(t('pin.deleted') || 'Pin silindi 🗑️')
        onDelete(pin.id)
    }

    return (
        <div className="card-glass" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Media Preview */}
            {pin.pin_media && pin.pin_media.length > 0 && (
                <div style={{
                    height: 180, overflow: 'hidden', position: 'relative',
                }}>
                    <img
                        src={pin.pin_media[0].url}
                        alt={pin.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {pin.pin_media.length > 1 && (
                        <div style={{
                            position: 'absolute', bottom: 8, right: 8,
                            background: 'rgba(0,0,0,0.6)', color: 'white',
                            padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem',
                            fontWeight: 600,
                        }}>
                            +{pin.pin_media.length - 1} {t('pin.more')}
                        </div>
                    )}
                </div>
            )}

            <div style={{ padding: '16px 20px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem',
                                fontWeight: 600, background: `${pinType.color}20`,
                                color: pinType.color,
                            }}>
                                {pinType.emoji} {t(`pinType.${pin.type}`)}
                            </span>
                            <span className={`badge badge-${pin.status === 'visited' ? 'success' : pin.status === 'planned' ? 'primary' : 'warning'}`}>
                                {t(`pinStatus.${pin.status}`)}
                            </span>
                        </div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{pin.title}</h3>
                    </div>
                    <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ marginLeft: 8, flexShrink: 0 }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Location */}
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                    📍 {pin.city}{pin.country ? `, ${pin.country}` : ''}
                </p>

                {/* Rating */}
                {pin.rating > 0 && (
                    <div className="stars" style={{ marginBottom: 8 }}>
                        {[1, 2, 3, 4, 5].map(n => (
                            <Star key={n} size={16} fill={pin.rating >= n ? '#FBBF24' : 'none'} color={pin.rating >= n ? '#FBBF24' : 'var(--text-tertiary)'} />
                        ))}
                    </div>
                )}

                {/* Date */}
                {pin.date_visited && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                        <Calendar size={14} /> {formatDate(pin.date_visited)}
                    </div>
                )}

                {/* Notes */}
                {pin.notes && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                        {pin.notes}
                    </p>
                )}

                {/* Tags */}
                {pin.tags && pin.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                        {pin.tags.map((tag, i) => (
                            <span key={i} style={{
                                padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem',
                                background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
                                fontWeight: 500,
                            }}>
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
                    <button className="btn btn-secondary btn-sm" onClick={onEdit} style={{ flex: 1 }}>
                        <Edit3 size={14} /> {t('pin.edit')}
                    </button>
                    {!confirmDelete ? (
                        <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(true)} style={{ color: 'var(--error)' }}>
                            <Trash2 size={14} />
                        </button>
                    ) : (
                        <button
                            className="btn btn-danger btn-sm"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? t('pin.deleting') : t('pin.confirmDelete')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
