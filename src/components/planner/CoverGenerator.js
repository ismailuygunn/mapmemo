'use client'
import { useState, useRef } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { Loader2, Download, Star, Sparkles, Image } from 'lucide-react'

const COVER_STYLES = [
    { id: 'romantic', emoji: '💕', label: 'Romantik' },
    { id: 'adventure', emoji: '🏔️', label: 'Macera' },
    { id: 'vintage', emoji: '📷', label: 'Vintage' },
    { id: 'minimal', emoji: '🎨', label: 'Minimal' },
    { id: 'cinematic', emoji: '🎬', label: 'Sinematik' },
    { id: 'watercolor', emoji: '🖌️', label: 'Suluboya' },
    { id: 'neon', emoji: '🌃', label: 'Neon' },
    { id: 'dreamy', emoji: '✨', label: 'Rüya' },
]

export default function CoverGenerator({ city, startDate, endDate, onCoverSelect }) {
    const [selectedStyle, setSelectedStyle] = useState('romantic')
    const [generating, setGenerating] = useState(false)
    const [generatedImage, setGeneratedImage] = useState(null)
    const [referencePhoto, setReferencePhoto] = useState(null)
    const [referencePreview, setReferencePreview] = useState(null)
    const [error, setError] = useState('')
    const fileRef = useRef(null)
    const { t } = useLanguage()

    const handleReferenceUpload = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setReferencePhoto(file)
        const reader = new FileReader()
        reader.onload = (ev) => setReferencePreview(ev.target.result)
        reader.readAsDataURL(file)
    }

    const generateCover = async () => {
        if (!city) return
        setGenerating(true)
        setError('')

        try {
            const res = await fetch('/api/generate-cover', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    city,
                    style: selectedStyle,
                    startDate,
                    endDate,
                }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Generation failed')

            setGeneratedImage(data.imageUrl)
        } catch (err) {
            setError(err.message)
        }
        setGenerating(false)
    }

    const downloadCover = async () => {
        if (!generatedImage) return
        try {
            const res = await fetch(generatedImage)
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `mapmemo-${city.toLowerCase().replace(/\s+/g, '-')}-cover.png`
            a.click()
            URL.revokeObjectURL(url)
        } catch { /* silent */ }
    }

    const selectAsCover = () => {
        if (generatedImage && onCoverSelect) {
            onCoverSelect(generatedImage)
        }
    }

    return (
        <div className="planner-section" style={{ marginTop: 16 }}>
            <div className="planner-section-header" style={{ cursor: 'default' }}>
                <Sparkles size={18} /> {t('cover.title')}
            </div>
            <div className="planner-section-body">
                {/* Reference Photo Upload */}
                <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 8, display: 'block', color: 'var(--text-secondary)' }}>
                        📸 {t('cover.reference')}
                    </label>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        {referencePreview ? (
                            <div style={{ position: 'relative' }}>
                                <img src={referencePreview} alt="Reference"
                                    style={{ width: 80, height: 80, borderRadius: 'var(--radius-md)', objectFit: 'cover', border: '2px solid var(--primary-1)' }} />
                                <button onClick={() => { setReferencePhoto(null); setReferencePreview(null) }}
                                    style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#EF4444', color: '#fff', border: 'none', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <div onClick={() => fileRef.current?.click()}
                                style={{ width: 80, height: 80, borderRadius: 'var(--radius-md)', border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: '0.6875rem', gap: 4 }}>
                                <Image size={20} />
                                <span>Fotoğraf</span>
                            </div>
                        )}
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                            {t('cover.referenceHint')}
                        </div>
                    </div>
                    <input type="file" ref={fileRef} accept="image/*" onChange={handleReferenceUpload} style={{ display: 'none' }} />
                </div>

                {/* Style Selector */}
                <label style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 8, display: 'block', color: 'var(--text-secondary)' }}>
                    🎨 {t('cover.style')}
                </label>
                <div className="cover-styles-grid">
                    {COVER_STYLES.map((s) => (
                        <button key={s.id}
                            className={`cover-style-btn ${selectedStyle === s.id ? 'cover-style-active' : ''}`}
                            onClick={() => setSelectedStyle(s.id)}>
                            <span style={{ fontSize: '1.25rem' }}>{s.emoji}</span>
                            <span>{s.label}</span>
                        </button>
                    ))}
                </div>

                {/* Generate Button */}
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                    <button className="btn btn-primary" onClick={generateCover}
                        disabled={generating || !city} style={{ flex: 1 }}>
                        {generating ? (
                            <><Loader2 size={16} className="spin" /> {t('cover.generating')}</>
                        ) : (
                            <><Sparkles size={16} /> {t('cover.generate')}</>
                        )}
                    </button>
                </div>

                {error && <p style={{ color: '#EF4444', fontSize: '0.8125rem', marginTop: 8 }}>{error}</p>}

                {/* Generated Image Preview */}
                {generatedImage && (
                    <div style={{ marginTop: 16, textAlign: 'center' }}>
                        <div style={{
                            display: 'inline-block',
                            borderRadius: 'var(--radius-lg)',
                            overflow: 'hidden',
                            border: '2px solid var(--primary-1)',
                            boxShadow: '0 8px 32px rgba(139, 92, 246, 0.2)',
                            maxWidth: 300,
                        }}>
                            <img src={generatedImage} alt={`${city} cover`}
                                style={{ width: '100%', display: 'block' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
                            <button className="btn btn-primary" onClick={selectAsCover}>
                                <Star size={14} /> {t('cover.setAsCover')}
                            </button>
                            <button className="btn btn-secondary" onClick={downloadCover}>
                                <Download size={14} /> {t('cover.download')}
                            </button>
                            <button className="btn btn-ghost" onClick={generateCover} disabled={generating}>
                                🔄 {t('cover.regenerate')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
