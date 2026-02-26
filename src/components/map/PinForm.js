'use client'

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PIN_TYPES, PIN_STATUSES } from '@/lib/constants'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import { X, Upload, Star, Loader2, Image as ImageIcon, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'

export default function PinForm({ coords, locationData, editPin, spaceId, onClose, onCreated, onUpdated }) {
    const isEditing = !!editPin
    const { t } = useLanguage()
    const { toast } = useToast()
    const [formData, setFormData] = useState({
        title: editPin?.title || '',
        type: editPin?.type || 'memory',
        status: editPin?.status || 'visited',
        notes: editPin?.notes || '',
        tags: editPin?.tags?.join(', ') || '',
        rating: editPin?.rating || 0,
        date_visited: editPin?.date_visited || '',
        city: editPin?.city || locationData?.city || '',
        country: editPin?.country || locationData?.country || '',
        lat: editPin?.lat || coords?.lat || 0,
        lng: editPin?.lng || coords?.lng || 0,
    })
    const [files, setFiles] = useState([])
    const [previews, setPreviews] = useState(editPin?.pin_media?.map(m => m.url) || [])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [locationSearch, setLocationSearch] = useState(
        editPin?.city
            ? `${editPin.city}${editPin.country ? `, ${editPin.country}` : ''}`
            : locationData?.placeName || ''
    )
    const [locationResults, setLocationResults] = useState([])
    const fileInputRef = useRef(null)
    const supabase = createClient()

    const update = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }))
    }

    // Location search via Mapbox Geocoding
    const searchLocation = useCallback(async (query) => {
        setLocationSearch(query)
        if (query.length < 2) { setLocationResults([]); return }
        try {
            const res = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&types=place,locality,poi,address&limit=5`
            )
            const data = await res.json()
            setLocationResults(data.features || [])
        } catch {
            setLocationResults([])
        }
    }, [])

    const selectLocation = (result) => {
        const [lng, lat] = result.center
        const context = result.context || []
        const city = result.text || ''
        const country = context.find(c => c.id.startsWith('country'))?.text || ''

        update('lat', lat)
        update('lng', lng)
        update('city', city)
        update('country', country)
        setLocationSearch(result.place_name)
        setLocationResults([])
    }

    const handleFiles = (e) => {
        const newFiles = Array.from(e.target.files)
        setFiles(prev => [...prev, ...newFiles])

        newFiles.forEach(file => {
            const reader = new FileReader()
            reader.onload = () => setPreviews(prev => [...prev, reader.result])
            reader.readAsDataURL(file)
        })
    }

    const removePreview = (index) => {
        setPreviews(prev => prev.filter((_, i) => i !== index))
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            if (!formData.lat || !formData.lng) {
                throw new Error(t('pin.selectLocation'))
            }

            const pinData = {
                space_id: spaceId,
                title: formData.title,
                type: formData.type,
                status: formData.status,
                notes: formData.notes,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
                rating: formData.rating,
                date_visited: formData.date_visited || null,
                city: formData.city,
                country: formData.country,
                lat: formData.lat,
                lng: formData.lng,
            }

            let pin
            if (isEditing) {
                const { data, error: updateError } = await supabase
                    .from('pins')
                    .update(pinData)
                    .eq('id', editPin.id)
                    .select('*, pin_media(*)')
                    .single()
                if (updateError) throw updateError
                pin = data
            } else {
                const { data, error: insertError } = await supabase
                    .from('pins')
                    .insert(pinData)
                    .select('*, pin_media(*)')
                    .single()
                if (insertError) throw insertError
                pin = data
            }

            // Upload media files
            if (files.length > 0) {
                for (const file of files) {
                    const ext = file.name.split('.').pop()
                    const filePath = `${spaceId}/${pin.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

                    const { error: uploadError } = await supabase.storage
                        .from('pin-media')
                        .upload(filePath, file)

                    if (uploadError) {
                        console.error('Upload error:', uploadError)
                        continue
                    }

                    const { data: { publicUrl } } = supabase.storage
                        .from('pin-media')
                        .getPublicUrl(filePath)

                    await supabase.from('pin_media').insert({
                        pin_id: pin.id,
                        url: publicUrl,
                        type: file.type.startsWith('video') ? 'video' : 'image',
                        caption: '',
                    })
                }

                // Reload pin with media
                const { data: refreshed } = await supabase
                    .from('pins')
                    .select('*, pin_media(*)')
                    .eq('id', pin.id)
                    .single()
                if (refreshed) pin = refreshed
            }

            if (isEditing) {
                onUpdated?.(pin)
                toast.success(t('pin.updated') || 'Pin güncellendi ✅')
            } else {
                onCreated?.(pin)
                toast.success(t('pin.created') || 'Pin oluşturuldu 📌')
            }
        } catch (err) {
            setError(err.message)
            toast.error(err.message)
        }
        setLoading(false)
    }

    return (
        <>
            <motion.div
                className="slide-over-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            />
            <motion.div
                className="slide-over"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
                <div className="slide-over-header">
                    <h2>{isEditing ? t('pin.editPin') : t('pin.newPin')}</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="slide-over-body">
                    {/* Location Search */}
                    <div className="input-group" style={{ marginBottom: 20, position: 'relative' }}>
                        <label>📍 {t('pin.location')}</label>
                        <div style={{ position: 'relative' }}>
                            <MapPin size={16} style={{
                                position: 'absolute', left: 12, top: '50%',
                                transform: 'translateY(-50%)', color: 'var(--text-tertiary)',
                            }} />
                            <input
                                type="text"
                                className="input"
                                placeholder={t('pin.locationPlaceholder')}
                                value={locationSearch}
                                onChange={(e) => searchLocation(e.target.value)}
                                style={{ paddingLeft: 36 }}
                            />
                        </div>
                        {locationResults.length > 0 && (
                            <div style={{
                                position: 'absolute', top: '100%', left: 0, right: 0,
                                marginTop: 4, background: 'var(--bg-secondary)',
                                border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                                boxShadow: 'var(--shadow-lg)', zIndex: 10, maxHeight: 200, overflowY: 'auto',
                            }}>
                                {locationResults.map(r => (
                                    <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => selectLocation(r)}
                                        style={{
                                            display: 'block', width: '100%', padding: '10px 14px',
                                            border: 'none', background: 'transparent', textAlign: 'left',
                                            cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-primary)',
                                            borderBottom: '1px solid var(--border)',
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        {r.place_name}
                                    </button>
                                ))}
                            </div>
                        )}
                        {formData.lat !== 0 && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
                                {formData.city}{formData.country ? `, ${formData.country}` : ''} ({formData.lat.toFixed(4)}, {formData.lng.toFixed(4)})
                            </p>
                        )}
                    </div>

                    {/* Title */}
                    <div className="input-group" style={{ marginBottom: 20 }}>
                        <label>{t('pin.title')}</label>
                        <input
                            type="text"
                            className="input"
                            placeholder={t('pin.titlePlaceholder')}
                            value={formData.title}
                            onChange={(e) => update('title', e.target.value)}
                            required
                        />
                    </div>

                    {/* Pin Type */}
                    <div className="input-group" style={{ marginBottom: 20 }}>
                        <label>{t('pin.type')}</label>
                        <div className="pin-type-grid">
                            {Object.entries(PIN_TYPES).map(([key, { emoji }]) => (
                                <button
                                    key={key}
                                    type="button"
                                    className={`pin-type-option ${formData.type === key ? 'pin-type-option-active' : ''}`}
                                    onClick={() => update('type', key)}
                                >
                                    <span className="pin-type-emoji">{emoji}</span>
                                    {t(`pinType.${key}`)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Status */}
                    <div className="input-group" style={{ marginBottom: 20 }}>
                        <label>{t('pin.status')}</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {Object.entries(PIN_STATUSES).map(([key, { emoji }]) => (
                                <button
                                    key={key}
                                    type="button"
                                    className={`filter-chip ${formData.status === key ? 'filter-chip-active' : ''}`}
                                    onClick={() => update('status', key)}
                                    style={{ flex: 1, justifyContent: 'center' }}
                                >
                                    {emoji} {t(`pinStatus.${key}`)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Rating */}
                    <div className="input-group" style={{ marginBottom: 20 }}>
                        <label>{t('pin.rating')}</label>
                        <div className="stars">
                            {[1, 2, 3, 4, 5].map(n => (
                                <button
                                    key={n}
                                    type="button"
                                    className={`star ${formData.rating >= n ? 'star-filled' : ''}`}
                                    onClick={() => update('rating', formData.rating === n ? 0 : n)}
                                >
                                    <Star size={24} fill={formData.rating >= n ? '#FBBF24' : 'none'} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date */}
                    <div className="input-group" style={{ marginBottom: 20 }}>
                        <label>{t('pin.date')}</label>
                        <input
                            type="date"
                            className="input"
                            value={formData.date_visited}
                            onChange={(e) => update('date_visited', e.target.value)}
                        />
                    </div>

                    {/* Notes */}
                    <div className="input-group" style={{ marginBottom: 20 }}>
                        <label>{t('pin.notes')}</label>
                        <textarea
                            className="input"
                            placeholder={t('pin.notesPlaceholder')}
                            value={formData.notes}
                            onChange={(e) => update('notes', e.target.value)}
                            rows={3}
                        />
                    </div>

                    {/* Tags */}
                    <div className="input-group" style={{ marginBottom: 20 }}>
                        <label>{t('pin.tags')}</label>
                        <input
                            type="text"
                            className="input"
                            placeholder={t('pin.tagsPlaceholder')}
                            value={formData.tags}
                            onChange={(e) => update('tags', e.target.value)}
                        />
                    </div>

                    {/* Media Upload */}
                    <div className="input-group" style={{ marginBottom: 24 }}>
                        <label>{t('pin.media')}</label>
                        <div
                            className={`media-upload ${files.length > 0 ? 'media-upload-active' : ''}`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload size={32} style={{ color: 'var(--text-tertiary)', marginBottom: 8 }} />
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                {t('pin.uploadText')}
                            </p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                {t('pin.uploadHint')}
                            </p>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            onChange={handleFiles}
                            style={{ display: 'none' }}
                        />

                        {previews.length > 0 && (
                            <div className="media-preview-grid">
                                {previews.map((src, i) => (
                                    <div key={i} className="media-preview-item">
                                        {typeof src === 'string' && src.includes('video') ? (
                                            <video src={src} />
                                        ) : (
                                            <img src={src} alt="" />
                                        )}
                                        <button
                                            type="button"
                                            className="media-preview-remove"
                                            onClick={(e) => { e.stopPropagation(); removePreview(i) }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{
                            background: 'var(--error-bg)', color: 'var(--error)',
                            padding: '10px 14px', borderRadius: 10, fontSize: '0.875rem',
                            marginBottom: 16,
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        className="btn btn-primary btn-lg w-full"
                        disabled={loading}
                    >
                        {loading ? (
                            <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> {t('pin.saving')}</>
                        ) : (
                            isEditing ? t('pin.updatePin') : t('pin.createPin')
                        )}
                    </button>
                </form>
            </motion.div>
        </>
    )
}
