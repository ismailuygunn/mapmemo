'use client'
import { useState, useRef } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import { Loader2, Download, Star, Sparkles, Image as ImageIcon, RefreshCw, Wand2, X, Plus } from 'lucide-react'
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
    const [slogan, setSlogan] = useState('')
    const [referencePhotos, setReferencePhotos] = useState([]) // Multiple reference photos
    const [error, setError] = useState('')
    const [progress, setProgress] = useState(0)
    const [usedModel, setUsedModel] = useState('')
    const fileRef = useRef(null)
    const { t, locale } = useLanguage()
    const { toast } = useToast()

    // Handle reference photo upload (supports multiple)
    const handleReferenceUpload = (e) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        files.forEach(file => {
            const reader = new FileReader()
            reader.onload = (ev) => {
                setReferencePhotos(prev => [...prev, {
                    id: Date.now() + Math.random(),
                    name: file.name,
                    preview: ev.target.result,
                    base64: ev.target.result,
                }])
            }
            reader.readAsDataURL(file)
        })
        // Reset input so same file can be re-uploaded
        e.target.value = ''
    }

    const removePhoto = (id) => {
        setReferencePhotos(prev => prev.filter(p => p.id !== id))
    }

    const generateCover = async () => {
        if (!city) return
        setGenerating(true)
        setError('')
        setProgress(0)
        setSlogan('')

        const progressInterval = setInterval(() => {
            setProgress(prev => Math.min(prev + Math.random() * 12, 90))
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
                    referenceImages: referencePhotos.map(p => p.base64),
                    locale: locale || 'tr',
                    includeSlogan: true,
                }),
            })

            const data = await res.json()

            if (data.fallbackGradient) {
                // Generate a gradient cover with slogan instead
                setSlogan(data.slogan || `${city} seni bekliyor ✨`)
                setGeneratedImage(null)
                setError(locale === 'tr'
                    ? 'Görsel oluşturma şu an kullanılamıyor. Billing\'i aktif et: ai.dev/projects'
                    : 'Image generation unavailable. Enable billing: ai.dev/projects')
            } else if (data.imageUrl) {
                setProgress(100)
                setGeneratedImage(data.imageUrl)
                setSlogan(data.slogan || '')
                setUsedModel(data.model || '')
                toast.success('Kapak görseli oluşturuldu ✨')
            } else if (data.error) {
                throw new Error(data.error)
            }
        } catch (err) {
            setError(err.message)
            toast.error('Oluşturma hatası: ' + err.message)
        }
        clearInterval(progressInterval)
        setProgress(0)
        setGenerating(false)
    }

    const downloadCover = async () => {
        if (!generatedImage) return
        try {
            let url = generatedImage
            if (generatedImage.startsWith('data:')) {
                const res = await fetch(generatedImage)
                const blob = await res.blob()
                url = URL.createObjectURL(blob)
            }
            const a = document.createElement('a')
            a.href = url
            a.download = `umae-${city.toLowerCase().replace(/\s+/g, '-')}-${selectedStyle}-cover.png`
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
                <Wand2 size={18} /> {locale === 'tr' ? '🎨 Kapak Görseli Oluştur' : '🎨 Generate Cover'}
                <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginLeft: 8 }}>AI Powered</span>
            </div>
            <div className="planner-section-body">
                {/* ── Reference Photos (Multiple) ── */}
                <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 8, display: 'block', color: 'var(--text-secondary)' }}>
                        📸 {locale === 'tr' ? 'Referans Fotoğraflar' : 'Reference Photos'}
                        <span style={{ fontWeight: 400, fontSize: '0.72rem', color: 'var(--text-tertiary)', marginLeft: 6 }}>
                            {locale === 'tr' ? '(İsteğe bağlı — karakterlerini kapağa ekle)' : '(Optional — add your characters to cover)'}
                        </span>
                    </label>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Uploaded photos */}
                        {referencePhotos.map((photo) => (
                            <motion.div
                                key={photo.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{ position: 'relative' }}
                            >
                                <img
                                    src={photo.preview}
                                    alt="Reference"
                                    style={{
                                        width: 72, height: 72, borderRadius: 12,
                                        objectFit: 'cover', border: '2px solid var(--primary-1)',
                                    }}
                                />
                                <button
                                    onClick={() => removePhoto(photo.id)}
                                    style={{
                                        position: 'absolute', top: -6, right: -6,
                                        width: 20, height: 20, borderRadius: '50%',
                                        background: '#EF4444', color: '#fff', border: 'none',
                                        fontSize: '0.7rem', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}
                                >
                                    <X size={11} />
                                </button>
                            </motion.div>
                        ))}

                        {/* Add photo button (+) */}
                        <motion.div
                            onClick={() => fileRef.current?.click()}
                            whileHover={{ scale: 1.05, borderColor: 'var(--primary-1)' }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                width: 72, height: 72, borderRadius: 12,
                                border: '2px dashed var(--border-primary)', display: 'flex',
                                flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: '0.65rem',
                                gap: 3, transition: 'all 200ms', background: 'var(--bg-secondary)',
                            }}
                        >
                            <Plus size={22} strokeWidth={1.5} />
                            <span>{locale === 'tr' ? 'Ekle' : 'Add'}</span>
                        </motion.div>
                    </div>
                    <input
                        type="file"
                        ref={fileRef}
                        accept="image/*"
                        multiple
                        onChange={handleReferenceUpload}
                        style={{ display: 'none' }}
                    />
                    {referencePhotos.length > 0 && (
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 6 }}>
                            {locale === 'tr'
                                ? `${referencePhotos.length} fotoğraf eklendi — AI bu karakterleri kapağa yerleştirecek`
                                : `${referencePhotos.length} photo(s) added — AI will place these characters on the cover`}
                        </p>
                    )}
                </div>

                {/* ── Style Selector ── */}
                <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 8, display: 'block', color: 'var(--text-secondary)' }}>
                    🎨 {locale === 'tr' ? 'Stil Seç' : 'Choose Style'}
                </label>
                <div className="cover-styles-grid">
                    {COVER_STYLES.map((s) => (
                        <motion.button key={s.id}
                            className={`cover-style-btn ${selectedStyle === s.id ? 'cover-style-active' : ''}`}
                            onClick={() => setSelectedStyle(s.id)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span style={{ fontSize: '1.2rem' }}>{s.emoji}</span>
                            <span>{s.label}</span>
                        </motion.button>
                    ))}
                </div>

                {/* ── Generate Button ── */}
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                    <button className="btn btn-primary" onClick={generateCover}
                        disabled={generating || !city} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                        {generating ? (
                            <>
                                <Loader2 size={16} className="spin" />
                                {locale === 'tr' ? 'Oluşturuluyor...' : 'Generating...'}
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
                            <>
                                <Sparkles size={16} />
                                {generatedImage
                                    ? (locale === 'tr' ? 'Yeniden Oluştur' : 'Regenerate')
                                    : (locale === 'tr' ? 'Kapak Oluştur' : 'Generate Cover')}
                            </>
                        )}
                    </button>
                </div>

                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                        style={{ color: '#F59E0B', fontSize: '0.78rem', marginTop: 8, padding: '8px 12px', background: '#F59E0B11', borderRadius: 8, border: '1px solid #F59E0B33' }}>
                        ⚠️ {error}
                    </motion.p>
                )}

                {/* ── Generated Image Preview with Slogan ── */}
                <AnimatePresence>
                    {generatedImage && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            style={{ marginTop: 20, textAlign: 'center' }}
                        >
                            <div className="cover-preview-container" style={{ position: 'relative' }}>
                                <img src={generatedImage} alt={`${city} cover`}
                                    className="cover-preview-image" />
                                {/* Overlay with city name + slogan */}
                                <div className="cover-preview-overlay" style={{
                                    position: 'absolute', bottom: 0, left: 0, right: 0,
                                    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                                    padding: '40px 20px 20px', borderRadius: '0 0 12px 12px',
                                }}>
                                    <span className="cover-preview-city" style={{
                                        fontSize: '1.4rem', fontWeight: 800, color: 'white',
                                        display: 'block', textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                                    }}>{city}</span>
                                    {slogan && (
                                        <span style={{
                                            fontSize: '0.82rem', color: 'rgba(255,255,255,0.85)',
                                            display: 'block', marginTop: 4, fontStyle: 'italic',
                                            textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                                        }}>"{slogan}"</span>
                                    )}
                                    {startDate && endDate && (
                                        <span className="cover-preview-date" style={{
                                            fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)',
                                            display: 'block', marginTop: 4,
                                        }}>{startDate} → {endDate}</span>
                                    )}
                                </div>
                                {/* Model badge */}
                                {usedModel && (
                                    <div style={{
                                        position: 'absolute', top: 10, right: 10,
                                        background: 'rgba(0,0,0,0.5)', color: '#fff',
                                        padding: '2px 8px', borderRadius: 20, fontSize: '0.6rem',
                                        backdropFilter: 'blur(4px)',
                                    }}>
                                        {usedModel === 'unsplash' ? '📷 Unsplash' : `✨ ${usedModel}`}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
                                <button className="btn btn-primary" onClick={selectAsCover}>
                                    <Star size={14} /> {locale === 'tr' ? 'Kapak Olarak Kullan' : 'Set as Cover'}
                                </button>
                                <button className="btn btn-secondary" onClick={downloadCover}>
                                    <Download size={14} /> {locale === 'tr' ? 'İndir' : 'Download'}
                                </button>
                                <button className="btn btn-ghost" onClick={generateCover} disabled={generating}>
                                    <RefreshCw size={14} /> {locale === 'tr' ? 'Yenile' : 'Regenerate'}
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
