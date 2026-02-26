'use client'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSpace } from '@/context/SpaceContext'
import { useLanguage } from '@/context/LanguageContext'
import { Camera, MapPin, Star, Trash2, Upload, X, Loader2, Image } from 'lucide-react'

export default function TripGallery({ tripId, onCoverChange }) {
    const [photos, setPhotos] = useState([])
    const [uploading, setUploading] = useState(false)
    const [showUpload, setShowUpload] = useState(false)
    const [caption, setCaption] = useState('')
    const [locationName, setLocationName] = useState('')
    const [lat, setLat] = useState('')
    const [lng, setLng] = useState('')
    const fileRef = useRef(null)
    const { space } = useSpace()
    const { t } = useLanguage()
    const supabase = createClient()

    useEffect(() => { if (tripId && space) loadPhotos() }, [tripId, space])

    const loadPhotos = async () => {
        const { data } = await supabase
            .from('trip_photos')
            .select('*')
            .eq('trip_id', tripId)
            .order('created_at', { ascending: false })
        if (data) setPhotos(data)
    }

    const uploadPhoto = async (e) => {
        const file = e.target.files?.[0]
        if (!file || !space) return
        setUploading(true)

        try {
            // Upload to Supabase Storage
            const ext = file.name.split('.').pop()
            const fileName = `${space.id}/${tripId}/${Date.now()}.${ext}`
            const { data: uploadData, error: uploadErr } = await supabase.storage
                .from('trip-photos')
                .upload(fileName, file, { cacheControl: '3600', upsert: false })

            if (uploadErr) throw uploadErr

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('trip-photos')
                .getPublicUrl(fileName)

            // Insert photo record
            const photoData = {
                trip_id: tripId,
                space_id: space.id,
                photo_url: publicUrl,
                caption: caption || null,
                location_name: locationName || null,
                lat: lat ? parseFloat(lat) : null,
                lng: lng ? parseFloat(lng) : null,
                is_cover: photos.length === 0, // First photo is auto-cover
            }

            const { data: photo, error: insertErr } = await supabase
                .from('trip_photos')
                .insert(photoData)
                .select()
                .single()

            if (insertErr) throw insertErr

            setPhotos(prev => [photo, ...prev])
            if (photo.is_cover && onCoverChange) onCoverChange(photo.photo_url)

            // Reset form
            setCaption('')
            setLocationName('')
            setLat('')
            setLng('')
            setShowUpload(false)
        } catch (err) {
            console.error('Upload error:', err)
            alert(err.message)
        }
        setUploading(false)
    }

    const setCover = async (photo) => {
        // Remove current cover
        await supabase.from('trip_photos').update({ is_cover: false }).eq('trip_id', tripId)
        // Set new cover
        await supabase.from('trip_photos').update({ is_cover: true }).eq('id', photo.id)
        // Update trip cover
        await supabase.from('trips').update({ cover_photo_url: photo.photo_url }).eq('id', tripId)

        setPhotos(prev => prev.map(p => ({ ...p, is_cover: p.id === photo.id })))
        if (onCoverChange) onCoverChange(photo.photo_url)
    }

    const deletePhoto = async (id) => {
        await supabase.from('trip_photos').delete().eq('id', id)
        setPhotos(prev => prev.filter(p => p.id !== id))
    }

    return (
        <div className="planner-section" style={{ marginTop: 16 }}>
            <div className="planner-section-header" style={{ cursor: 'default' }}>
                <Camera size={18} /> {t('gallery.title')}
                <button className="btn btn-sm btn-primary" style={{ marginLeft: 'auto' }}
                    onClick={() => setShowUpload(!showUpload)}>
                    <Upload size={14} /> {t('gallery.upload')}
                </button>
            </div>
            <div className="planner-section-body">
                {/* Upload Form */}
                {showUpload && (
                    <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>{t('gallery.caption')}</label>
                                <input type="text" className="input" value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    placeholder="Ayasofya önünde..." />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>📍 {t('gallery.location')}</label>
                                <input type="text" className="input" value={locationName}
                                    onChange={(e) => setLocationName(e.target.value)}
                                    placeholder="Sultanahmet, Istanbul" />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>Lat</label>
                                <input type="number" step="any" className="input" value={lat}
                                    onChange={(e) => setLat(e.target.value)}
                                    placeholder="41.0082" />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>Lng</label>
                                <input type="number" step="any" className="input" value={lng}
                                    onChange={(e) => setLng(e.target.value)}
                                    placeholder="28.9784" />
                            </div>
                        </div>

                        <input type="file" ref={fileRef} accept="image/*" onChange={uploadPhoto}
                            style={{ display: 'none' }} />

                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button className="btn btn-primary" onClick={() => fileRef.current?.click()}
                                disabled={uploading}>
                                {uploading ? <Loader2 size={14} className="spin" /> : <Camera size={14} />}
                                {uploading ? 'Yükleniyor...' : t('gallery.upload')}
                            </button>
                            <button className="btn btn-ghost" onClick={() => setShowUpload(false)}>
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Photo Grid */}
                {photos.length > 0 ? (
                    <div className="gallery-grid">
                        {photos.map((photo) => (
                            <div key={photo.id} className="gallery-card">
                                {photo.is_cover && (
                                    <div style={{
                                        position: 'absolute', top: 8, left: 8, zIndex: 2,
                                        background: '#F59E0B', color: '#fff', padding: '2px 8px',
                                        borderRadius: 'var(--radius-full)', fontSize: '0.6875rem', fontWeight: 600
                                    }}>
                                        ⭐ Kapak
                                    </div>
                                )}
                                <img src={photo.photo_url} alt={photo.caption || 'Trip photo'} loading="lazy" />
                                <div className="gallery-card-info">
                                    {photo.caption && <div className="gallery-card-caption">{photo.caption}</div>}
                                    {photo.location_name && (
                                        <div className="gallery-card-loc">
                                            <MapPin size={10} /> {photo.location_name}
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                                        {!photo.is_cover && (
                                            <button className="btn btn-sm btn-ghost" onClick={() => setCover(photo)}
                                                title={t('gallery.setCover')}>
                                                <Star size={12} />
                                            </button>
                                        )}
                                        <button className="btn btn-sm btn-ghost" onClick={() => deletePhoto(photo.id)}
                                            style={{ color: '#EF4444' }}>
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="gallery-upload" onClick={() => setShowUpload(true)}>
                        <Image size={32} />
                        <span>{t('gallery.upload')}</span>
                        <span style={{ fontSize: '0.75rem' }}>Fotoğraflarınızı yükleyin ve anılarınızı kaydedin</span>
                    </div>
                )}
            </div>
        </div>
    )
}
