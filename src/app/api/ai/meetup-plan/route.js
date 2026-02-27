// AI Meetup Plan Generator — Personalized A-Z plans with Google Places
import { NextResponse } from 'next/server'

export async function POST(request) {
    try {
        const body = await request.json()
        const {
            city,           // string — selected city
            groupType,      // 'couple' | 'guys' | 'girls' | 'mixed' | 'solo'
            maleCount,      // number
            femaleCount,    // number
            ageRange,       // '18-25' | '25-35' | '35-45' | '45+'
            energyLevel,    // 'chill' | 'balanced' | 'active' | 'crazy'
            timeStart,      // string — '19:00'
            timeEnd,        // string — '02:00'
            budget,         // 'economic' | 'mid' | 'luxury' | 'unlimited'
            preferences,    // string[] — ['food','drinks','nature','culture','adventure','romantic','nightlife','sports','shopping','photo','music','experience']
            extraNotes,     // string — free text
        } = body

        if (!city) {
            return NextResponse.json({ error: 'Şehir seçilmedi' }, { status: 400 })
        }

        const geminiKey = process.env.GEMINI_API_KEY
        if (!geminiKey) {
            return NextResponse.json({ error: 'AI servisi yapılandırılmamış' }, { status: 500 })
        }

        // ── Fetch REAL Google Places data ──
        let placesContext = ''
        const googleApiKey = process.env.GOOGLE_PLACES_API_KEY
        if (googleApiKey) {
            try {
                const PLACES_BASE = 'https://maps.googleapis.com/maps/api/place'

                // Geocode the city
                const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city + ', Turkey')}&key=${googleApiKey}`)
                const geoData = await geoRes.json()
                const coords = geoData.results?.[0]?.geometry?.location

                if (coords) {
                    const fetchPlaces = async (type, keyword = '') => {
                        const params = new URLSearchParams({
                            location: `${coords.lat},${coords.lng}`,
                            radius: '8000', type, key: googleApiKey, language: 'tr',
                        })
                        if (keyword) params.append('keyword', keyword)
                        const res = await fetch(`${PLACES_BASE}/nearbysearch/json?${params}`)
                        const data = await res.json()
                        return (data.results || [])
                            .filter(p => p.rating && p.user_ratings_total)
                            .sort((a, b) => (b.rating * Math.log10(b.user_ratings_total + 1)) - (a.rating * Math.log10(a.user_ratings_total + 1)))
                    }

                    const fetchTextPlaces = async (query) => {
                        const params = new URLSearchParams({ query: `${query} ${city}`, key: googleApiKey, language: 'tr' })
                        const res = await fetch(`${PLACES_BASE}/textsearch/json?${params}`)
                        const data = await res.json()
                        return (data.results || []).filter(p => p.rating).sort((a, b) => (b.rating || 0) - (a.rating || 0))
                    }

                    // Build search queries based on preferences and group type
                    const searchQueries = []

                    // Always fetch restaurants and cafes
                    searchQueries.push(fetchPlaces('restaurant'))
                    searchQueries.push(fetchPlaces('cafe'))

                    // Conditional based on preferences
                    if (preferences?.includes('drinks') || preferences?.includes('nightlife')) {
                        searchQueries.push(fetchPlaces('bar', 'cocktail bar rooftop'))
                        searchQueries.push(fetchTextPlaces('gece hayatı club bar'))
                    }
                    if (preferences?.includes('culture')) {
                        searchQueries.push(fetchPlaces('museum'))
                        searchQueries.push(fetchPlaces('art_gallery'))
                    }
                    if (preferences?.includes('nature')) {
                        searchQueries.push(fetchTextPlaces('park bahçe doğa yürüyüş'))
                    }
                    if (preferences?.includes('adventure') || preferences?.includes('sports')) {
                        searchQueries.push(fetchTextPlaces('aktivite macera escape room bowling'))
                    }
                    if (preferences?.includes('shopping')) {
                        searchQueries.push(fetchPlaces('shopping_mall'))
                    }
                    if (preferences?.includes('music')) {
                        searchQueries.push(fetchTextPlaces('canlı müzik konser mekan'))
                    }
                    if (preferences?.includes('experience')) {
                        searchQueries.push(fetchTextPlaces('atölye workshop deneyim'))
                    }
                    if (preferences?.includes('romantic') || groupType === 'couple') {
                        searchQueries.push(fetchTextPlaces('romantik mekan manzara günbatımı'))
                    }
                    if (preferences?.includes('food')) {
                        searchQueries.push(fetchTextPlaces('sokak yemeği yerel mutfak lezzet'))
                    }

                    const allResults = await Promise.all(searchQueries)

                    const formatPlaces = (places, count = 10) => places.slice(0, count).map(p => {
                        const price = p.price_level != null ? ' | Fiyat: ' + '₺'.repeat(p.price_level || 1) : ''
                        return `  • ${p.name} — ⭐${p.rating} (${p.user_ratings_total} yorum)${price} | ${p.vicinity || p.formatted_address || ''}`
                    }).join('\n')

                    const labels = ['🍽️ RESTORANLAR', '☕ KAFELER']
                    if (preferences?.includes('drinks') || preferences?.includes('nightlife')) labels.push('🍸 BARLAR', '🌙 GECE HAYATI')
                    if (preferences?.includes('culture')) labels.push('🏛️ MÜZELER', '🎨 GALERİ')
                    if (preferences?.includes('nature')) labels.push('🌳 DOĞA')
                    if (preferences?.includes('adventure') || preferences?.includes('sports')) labels.push('🎯 AKTİVİTELER')
                    if (preferences?.includes('shopping')) labels.push('🛍️ ALIŞVERİŞ')
                    if (preferences?.includes('music')) labels.push('🎵 MÜZİK MEKANLARI')
                    if (preferences?.includes('experience')) labels.push('🎨 DENEYİMLER')
                    if (preferences?.includes('romantic') || groupType === 'couple') labels.push('💕 ROMANTİK')
                    if (preferences?.includes('food')) labels.push('🍖 YEREL LEZZETLER')

                    placesContext = '\n\n═══ GOOGLE PLACES GERÇEK VERİLER (BUNLARI KULLAN!) ═══\nAşağıdaki mekanlar Google Maps\'ten gerçek veriler. Plan yaparken BUNLARI öncelikli kullan.\n\n'
                    allResults.forEach((places, i) => {
                        if (places.length > 0 && labels[i]) {
                            placesContext += `${labels[i]}:\n${formatPlaces(places, 8)}\n\n`
                        }
                    })

                    // Hidden gems
                    const allPlaces = allResults.flat()
                    const hiddenGems = allPlaces.filter(p => p.rating >= 4.4 && p.user_ratings_total < 500 && p.user_ratings_total >= 20)
                    if (hiddenGems.length > 0) {
                        placesContext += `\n💎 GİZLİ CEVHERLER (yüksek puan, az yorum — kesinlikle 2-3 tane öner!):\n${formatPlaces(hiddenGems, 6)}\n`
                    }

                    placesContext += '\nÖNEMLİ: Yukarıdaki GERÇEK mekan isimlerini kullan. Rating ve yorum sayısını da belirt. Her öneride neden o mekanı seçtiğini açıkla.'
                }
            } catch (placesErr) {
                console.warn('Google Places fetch failed:', placesErr.message)
            }
        }

        // ── Build the group description ──
        const totalPeople = (maleCount || 0) + (femaleCount || 0)
        const groupDesc = {
            'couple': `Başbaşa romantik buluşma (1 çift)`,
            'guys': `${totalPeople || 'birkaç'} kişilik erkek grubu (agalar)`,
            'girls': `${totalPeople || 'birkaç'} kişilik kız grubu (kız kıza)`,
            'mixed': `Karma grup — ${maleCount || '?'} erkek, ${femaleCount || '?'} kız (toplam ${totalPeople})`,
            'solo': `Tek kişi — solo macera`,
        }[groupType] || `${totalPeople || 'birkaç'} kişilik grup`

        const energyDesc = {
            'chill': 'Sakin, rahat, sohbet ağırlıklı. Oturma mekanları, manzara noktaları, sessiz kafeler.',
            'balanced': 'Dengeli tempoda. Hem oturmalı hem yürüyüşlü aktiviteler karıştır.',
            'active': 'Hareketli! Yürüyüş, keşif, aktiviteler, enerji dolu mekanlar.',
            'crazy': 'DELİLİK! Adrenalin, macera, dans, parti, beklenmedik anlar. Sıra dışı deneyimler!'
        }[energyLevel] || 'Dengeli tempo'

        const budgetDesc = {
            'economic': 'EKONOMİK — Ucuz ama kaliteli mekanlar. Sokak yemeği, park, ücretsiz aktiviteler. Kişi başı ₺100-300.',
            'mid': 'ORTA — Güzel restoranlar, rahat mekanlar. Kişi başı ₺300-600.',
            'luxury': 'LÜKS — En iyi restoranlar, rooftop barlar, premium deneyimler. Kişi başı ₺600-1500.',
            'unlimited': 'SINIR YOK — En iyi mekanlar, VIP deneyimler, özel hizmetler.'
        }[budget] || 'Orta bütçe'

        const prefLabels = {
            'food': 'Yemek & Lezzetler', 'drinks': 'İçki & Kokteyl', 'nature': 'Doğa & Açık Hava',
            'culture': 'Kültür & Tarih', 'adventure': 'Macera & Adrenalin', 'romantic': 'Romantik & Özel',
            'nightlife': 'Gece Hayatı', 'sports': 'Spor & Aktivite', 'shopping': 'Alışveriş',
            'photo': 'Fotoğraf Noktaları', 'music': 'Müzik & Konser', 'experience': 'Deneyim & Atölye'
        }
        const prefText = preferences?.length > 0 ? preferences.map(p => prefLabels[p] || p).join(', ') : 'Genel'

        // ── Build Mega-Prompt ──
        const prompt = `Sen dünyanın en yaratıcı ve bilgili buluşma planlayıcısısın. ${city} şehrinde, aşağıdaki detaylara göre A'dan Z'ye, adım adım bir buluşma planı oluştur.

═══ BULUŞMA DETAYLARI ═══
📍 Şehir: ${city}
👥 Grup: ${groupDesc}
${maleCount != null ? `   Erkek: ${maleCount}, Kız: ${femaleCount}` : ''}
🎂 Yaş Aralığı: ${ageRange || '25-35'}
⚡ Enerji Seviyesi: ${energyDesc}
🕐 Saat Aralığı: ${timeStart || '19:00'} — ${timeEnd || '00:00'}
💰 Bütçe: ${budgetDesc}
🎯 Tercihler: ${prefText}
${extraNotes ? `📝 Ekstra Not: ${extraNotes}` : ''}

═══ KRİTİK KURALLAR ═══

1. **GERÇEK MEKANLAR**: SADECE ${city}'da gerçekten var olan mekanları öner. Google Places verilerini kullan. İsim uyduRMA!

2. **GOOGLE'DA BULUNAMAYAN ÖNERİLER**: Planın başka hiçbir yerde bulunamayacak kadar özel ve kişiye özel olmalı. Genel "bar'a git" deme — spesifik mekan, sipariş önerisi, oturma yeri bile söyle.

3. **SAAT BAZLI DETAY**: ${timeStart || '19:00'}'dan ${timeEnd || '00:00'}'a kadar her 30-60 dakikayı planla. Boş zaman bırakma. Her adımda ulaşım detayı ver.

4. **KİŞİYE ÖZEL**: 
   - Grup tipi "${groupType}" — buna göre mekan seç (${groupType === 'couple' ? 'romantik, başbaşa, özel mekanlar' : groupType === 'guys' ? 'eğlenceli, rekabetçi, rahat ortamlar' : groupType === 'girls' ? 'şık, Instagramlık, güvenli mekanlar' : 'herkesin eğlenebileceği karma ortamlar'})
   - Yaş ${ageRange} — müzik, mekan tarzı, enerji buna uygun olsun
   - Enerji "${energyLevel}" — ${energyLevel === 'crazy' ? 'SÜRPRİZLER, beklenmedik anlar, cesur öneriler ekle!' : energyLevel === 'chill' ? 'sakin, rahat, konforlu mekanlar' : 'dengeli tempo'}

5. **PRO TIPS**: Her adımda bir "pro tip" ver — sipariş önerisi, oturma yeri, fotoğraf açısı, garson tavsiyesi gibi. Gerçek bir insider bilgisi olsun.

6. **ALTERNATİFLER**: Her ana mekan için 1 alternatif mekan öner (dolu olursa / beğenmezlerse).

7. **GEÇİŞLER**: Mekanlar arası ulaşımı detaylı ver (yürüme süresi, taksi ücreti, toplu taşıma).
${placesContext}

═══ YANIT FORMATI (SADECE JSON) ═══
{
  "planTitle": "Yaratıcı, eğlenceli plan başlığı (emoji ile)",
  "planEmoji": "🔥",
  "vibeDescription": "2-3 cümle — planın genel ruhu ve neden özel olduğu",
  "totalBudget": "₺XXX–XXX/kişi",
  "groupSummary": "Grup için kısa açıklama",
  "steps": [
    {
      "time": "19:00",
      "duration": "1-1.5 saat",
      "emoji": "🍖",
      "action": "Kısa aksiyon başlığı (3-4 kelime)",
      "placeName": "Gerçek mekan adı",
      "placeRating": 4.6,
      "placeReviews": 12000,
      "address": "Tam adres",
      "googleMapsUrl": "https://maps.google.com/?q=mekan+adı+şehir",
      "detail": "Detaylı açıklama — neden burası, ne yapılacak, ne sipariş edilecek. 3-4 cümle, gerçek bir arkadaş gibi yaz.",
      "proTip": "Pro tip — insider bilgi, sipariş tavsiyesi, oturma yeri vs.",
      "estimatedCost": "₺XXX/kişi",
      "transportNote": "Bir önceki yerden nasıl gelinir (yürüme/taksi/metro)",
      "alternative": {
        "name": "Alternatif mekan",
        "reason": "Neden alternatif (dolu olursa, farklı bir tarz isterlerse)"
      }
    }
  ],
  "proTips": [
    "Genel pro tip 1 — planla ilgili önemli bilgi",
    "Genel pro tip 2",
    "Genel pro tip 3"
  ],
  "whatToWear": "Kıyafet önerisi — gruba ve mekanlara uygun",
  "playlistVibe": "Spotify playlist önerisi — bu geceyle uyumlu müzik türü/tarzı",
  "emergencyPlan": "Yağmur/soğuk/beklenmedik durum planı — alternatif iç mekan"
}

KIRITIK:
- Tüm metin TÜRKÇE olsun
- steps dizisinde en az 5, en fazla 10 adım olsun
- Her adımda placeName GERÇEK bir mekan olsun
- proTip her adımda farklı ve gerçekten faydalı olsun
- Saat aralığı ${timeStart} — ${timeEnd} dışına ÇIKMA
- SADECE geçerli JSON döndür, markdown veya yorum EKLEME`

        // ── Call Gemini ──
        const models = ['gemini-2.0-flash', 'gemini-1.5-flash']

        for (const model of models) {
            try {
                const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        systemInstruction: {
                            parts: [{
                                text: 'Sen uzman bir buluşma ve eğlence planlayıcısısın. Her zaman geçerli JSON ile yanıt ver. SADECE gerçek, var olan mekanları öner. Yaratıcı, kişiye özel ve başka yerde bulunamayacak planlar üret. Türkçe yaz.'
                            }]
                        },
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 16384,
                            responseMimeType: 'application/json',
                        },
                    }),
                })

                if (!response.ok) {
                    console.error(`Gemini ${model} error:`, response.status)
                    continue
                }

                const data = await response.json()
                const content = data.candidates?.[0]?.content?.parts?.[0]?.text

                if (!content) continue

                const result = JSON.parse(content)
                return NextResponse.json(result)
            } catch (err) {
                console.error(`Gemini ${model} error:`, err.message)
                continue
            }
        }

        return NextResponse.json({ error: 'AI servisi şu anda meşgul. Tekrar deneyin.' }, { status: 500 })

    } catch (err) {
        console.error('Meetup plan API error:', err)
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    }
}
