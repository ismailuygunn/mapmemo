'use client'
import { useState, useRef } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import { Loader2, Download, Star, Sparkles, Image, RefreshCw, Wand2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const COVER_STYLES = [
    { id: 'romantic', emoji: '💕', label: 'Romantik' },
    { id: 'adventure', emoji: '🏔️', label: 'Macera' },
    { id: 'vintage', emoji: '📷', label: 'Vintage' },
    { id: 'minimal', emoji: '🎨', label: 'Minimal' },
    { id: 'cinematic', emoji: '🎬', label: 'Sinematik' },
    { id: 'watercolor', emoji: '🖌️', label: 'Suluboya' },
    { id: 'neon', emoji: '🌃', label: 'Neon' },
    { id: 'dreamy', emoji: '✨', label: 'Rüya' },
    { id: 'polaroid', emoji: '📸', label: 'Polaroid' },
    { id: 'editorial', emoji: '👗', label: 'Editorial' },
    { id: 'sunset', emoji: '🌅', label: 'Gün Batımı' },
    { id: 'noir', emoji: '🖤', label: 'Film Noir' },
]

export default function CoverGenerator({ city, startDate, endDate, onCoverSelect }) {
    const [selectedStyle, setSelectedStyle] = useState('cinematic')
    const [generating, setGenerating] = useState(false)
    const [generatedImage, setGeneratedImage] = useState(null)
    const [referencePhoto, setReferencePhoto] = useState(null)
    const [referencePreview, setReferencePreview] = useState(null)
    const [referenceBase64, setReferenceBase64] = useState(null)
    const [error, setError] = useState('')
    const [progress, setProgress] = useState(0)
    const fileRef = useRef(null)
    const { t } = useLanguage()
    const { toast } = useToast()

    const handleReferenceUpload = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setReferencePhoto(file)
        const reader = new FileReader()
        reader.onload = (ev) => {
            setReferencePreview(ev.target.result)
            setReferenceBase64(ev.target.result) // data:image/...;base64,...
        }
        reader.readAsDataURL(file)
    }

    const clearReference = () => {
        setReferencePhoto(null)
        setReferencePreview(null)
        setReferenceBase64(null)
    }

    const generateCover = async () => {
        if (!city) return
        setGenerating(true)
        setError('')
        setProgress(0)

        // Simulate progress for UX
        const progressInterval = setInterval(() => {
            setProgress(prev => Math.min(prev + Math.random() * 15, 90))
        }, 800)

        try {
            const res = await fetch('/api/generate-cover', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    city,
                    style: selectedStyle,
                    startDate,
                    endDate,
                    referenceImage: referenceBase64 || undefined,
                }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Generation failed')

            setProgress(100)
            setGeneratedImage(data.imageUrl)
            toast.success('Kapak görseli oluşturuldu ✨')
        } catch (err) {
            setError(err.message)
            toast.error('Oluşturma başarısız: ' + err.message)
        }
        clearInterval(progressInterval)
        setProgress(0)
        setGenerating(false)
    }

    const downloadCover = async () => {
        if (!generatedImage) return
        try {
            let url = generatedImage
            // If base64, create blob
            if (generatedImage.startsWith('data:')) {
                const res = await fetch(generatedImage)
                const blob = await res.blob()
                url = URL.createObjectURL(blob)
            }
            const a = document.createElement('a')
            a.href = url
            a.download = `mapmemo-${city.toLowerCase().replace(/\s+/g, '-')}-${selectedStyle}-cover.png`
            a.click()
            if (!generatedImage.startsWith('data:')) URL.revokeObjectURL(url)
            toast.success('İndiriliyor...')
        } catch { /* silent */ }
    }

    const selectAsCover = () => {
        if (generatedImage && onCoverSelect) {
            onCoverSelect(generatedImage)
            toast.success('Kapak görseli ayarlandı ✅')
        }
    }

    return (
        <div className="planner-section" style={{ marginTop: 16 }}>
            <div className="planner-section-header" style={{ cursor: 'default' }}>
                <Wand2 size={18} /> {t('cover.title')} <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: 8 }}>Gemini AI</span>
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
                                <button onClick={clearReference}
                                    style={{
                                        position: 'absolute', top: -6, right: -6, width: 20, height: 20,
                                        borderRadius: '50%', background: '#EF4444', color: '#fff', border: 'none',
                                        fontSize: '0.75rem', cursor: 'pointer', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                    }}>
                                    <X size={12} />
                                </button>
                            </div>
                        ) : (
                            <div onClick={() => fileRef.current?.click()}
                                style={{
                                    width: 80, height: 80, borderRadius: 'var(--radius-md)',
                                    border: '2px dashed var(--border)', display: 'flex',
                                    flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: '0.6875rem',
                                    gap: 4, transition: 'border-color 0.2s',
                                }}
                                onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary-1)'}
                                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
                            >
                                <Image size={20} />
                                <span>Referans</span>
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
                        <motion.button key={s.id}
                            className={`cover-style-btn ${selectedStyle === s.id ? 'cover-style-active' : ''}`}
                            onClick={() => setSelectedStyle(s.id)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span style={{ fontSize: '1.25rem' }}>{s.emoji}</span>
                            <span>{s.label}</span>
                        </motion.button>
                    ))}
                </div>

                {/* Generate Button */}
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                    <button className="btn btn-primary" onClick={generateCover}
                        disabled={generating || !city} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                        {generating ? (
                            <>
                                <Loader2 size={16} className="spin" /> {t('cover.generating')}
                                {/* Progress bar inside button */}
                                <motion.div
                                    style={{
                                        position: 'absolute', bottom: 0, left: 0, height: 3,
                                        background: 'rgba(255,255,255,0.5)', borderRadius: 2,
                                    }}
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </>
                        ) : (
                            <><Sparkles size={16} /> {generatedImage ? t('cover.regenerate') : t('cover.generate')}</>
                        )}
                    </button>
                </div>

                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                        style={{ color: '#EF4444', fontSize: '0.8125rem', marginTop: 8 }}>
                        ⚠️ {error}
                    </motion.p>
                )}

                {/* Generated Image Preview */}
                <AnimatePresence>
                    {generatedImage && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            style={{ marginTop: 20, textAlign: 'center' }}
                        >
                            <div className="cover-preview-container">
                                <img src={generatedImage} alt={`${city} cover`}
                                    className="cover-preview-image" />
                                {/* Overlay gradient for text readability */}
                                <div className="cover-preview-overlay">
                                    <span className="cover-preview-city">{city}</span>
                                    {startDate && endDate && (
                                        <span className="cover-preview-date">{startDate} → {endDate}</span>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
                                <button className="btn btn-primary" onClick={selectAsCover}>
                                    <Star size={14} /> {t('cover.setAsCover')}
                                </button>
                                <button className="btn btn-secondary" onClick={downloadCover}>
                                    <Download size={14} /> {t('cover.download')}
                                </button>
                                <button className="btn btn-ghost" onClick={generateCover} disabled={generating}>
                                    <RefreshCw size={14} /> {t('cover.regenerate')}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
        </div>
    )
}
