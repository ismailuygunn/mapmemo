// SOS Plan — AI Meetup Plan Generator (Scenario-based)
import { NextResponse } from 'next/server'

// ── JSON Repair for truncated AI responses ──
function repairJSON(text) {
    if (!text) return null
    // Try direct parse first
    try { return JSON.parse(text) } catch (_) { }
    // Remove trailing incomplete entries
    let fixed = text.trim()
    // Remove trailing comma after last valid item
    fixed = fixed.replace(/,\s*$/, '')
    // Close unclosed strings
    const dq = (fixed.match(/"/g) || []).length
    if (dq % 2 !== 0) fixed += '"'
    // Close unclosed arrays and objects
    const opens = { '{': 0, '[': 0 }
    const closes = { '}': '{', ']': '[' }
    for (const ch of fixed) {
        if (ch in opens) opens[ch]++
        if (ch in closes) opens[closes[ch]]--
    }
    // Remove trailing comma before closing
    fixed = fixed.replace(/,\s*$/, '')
    for (let i = 0; i < opens['[']; i++) fixed += ']'
    for (let i = 0; i < opens['{']; i++) fixed += '}'
    try { return JSON.parse(fixed) } catch (_) { }
    // Last resort: find last valid closing brace
    const lastBrace = fixed.lastIndexOf('}')
    if (lastBrace > 0) {
        try { return JSON.parse(fixed.substring(0, lastBrace + 1)) } catch (_) { }
    }
    return null
}

// ── Scenario Definitions ──
const SCENARIOS = {
    anniversary: {
        persona: 'Sen dünyanın en romantik ve yaratıcı plan ustasısın. Her detayda aşk, sürpriz ve duygusallık olmalı.',
        tone: 'Romantik, samimi, duygusal ama pratik',
        focus: 'Romantik mekanlar, mum ışıklı akşam yemekleri, manzara noktaları, çiçekçiler, hediye fikirleri, fotoğraf noktaları',
        searchTerms: ['romantik restoran', 'fine dining', 'rooftop manzara', 'çiçekçi', 'şarap bar', 'butik otel'],
        mandatoryExtras: ['surpriseIdeas', 'messageDrafts', 'giftSuggestions'],
    },
    birthday: {
        persona: 'Sen sürpriz parti ve doğum günü planlama konusunda çılgın bir dehasın. Hediye koordinasyonu, zamanlama ve sürpriz unsuru senin süper gücün.',
        tone: 'Eğlenceli, enerjik, sürpriz dolu',
        focus: 'Pasta siparişi, balon süsleme, hediye koordinasyonu, sürpriz parti mekanları, eğlenceli aktiviteler',
        searchTerms: ['pasta pastane', 'parti mekan', 'eğlence merkezi', 'karaoke', 'restoran grup', 'bowling'],
        mandatoryExtras: ['surpriseIdeas', 'giftSuggestions', 'messageDrafts'],
    },
    friends: {
        persona: 'Sen şehrin en gizli, en çılgın, herkesin bilmediği ama aşırı eğlenceli mekanlarını bilen insider bir efsanesin. Sıra dışı öneriler, gizli cevherler, beklenmedik deneyimler senin işin.',
        tone: 'Enerjik, çılgın, insider bilgisi dolu, cesur',
        focus: 'Gizli barlar, escape room, rekabetçi aktiviteler, sokak yemeği turları, canlı müzik, rooftop, bilmece kulüpleri, retro oyun salonları',
        searchTerms: ['gizli bar speakeasy', 'escape room', 'bowling bilardo', 'canlı müzik mekan', 'sokak yemeği', 'rooftop bar', 'oyun kafesi board game'],
        mandatoryExtras: ['surpriseIdeas', 'groupChallenges'],
    },
    apology: {
        persona: 'Sen ilişki uzmanı ve gönül alma konusunda dahi bir stratejistsin. Samimi, düşünceli ve doğru zamanda doğru hamleyi yapan planlar üretirsin.',
        tone: 'Samimi, düşünceli, zarif ama içten',
        focus: 'Özel hediyeler, anlamlı mekanlar, çiçek, mektup/mesaj, favori yemek, ortak anı yerleri',
        searchTerms: ['çiçekçi', 'şık restoran', 'tatlıcı pastane', 'hediyelik eşya', 'sakin kafe', 'park manzara'],
        mandatoryExtras: ['messageDrafts', 'giftSuggestions', 'apologyStrategy'],
    },
    mood: {
        persona: 'Sen bir ruh hali terapisti ve iyi his planlayıcısısın. İnsanların moralini yükselten, pozitif enerji veren, küçük mutluluklar yaratan planlar üretirsin.',
        tone: 'Sıcak, pozitif, motive edici, neşeli',
        focus: 'Doğa yürüyüşü, spa/hamam, comfort food, komik film, alışveriş terapisi, hayvan cafe, yoga/meditasyon',
        searchTerms: ['spa hamam', 'kafe rahat', 'park yürüyüş', 'sinema', 'yoga meditasyon', 'tatlıcı', 'hayvan kafe kedikafe'],
        mandatoryExtras: ['selfCareChecklist', 'moodPlaylist'],
    },
}

export async function POST(request) {
    try {
        const body = await request.json()
        const { scenario, city, peopleCount, budget, extraNotes } = body

        if (!scenario || !city) {
            return NextResponse.json({ error: 'Senaryo ve şehir zorunlu' }, { status: 400 })
        }

        const scenarioConfig = SCENARIOS[scenario]
        if (!scenarioConfig) {
            return NextResponse.json({ error: 'Geçersiz senaryo' }, { status: 400 })
        }

        const geminiKey = process.env.GEMINI_API_KEY
        if (!geminiKey) {
            return NextResponse.json({ error: 'AI servisi yapılandırılmamış' }, { status: 500 })
        }

        // ── Fetch Google Places ──
        let placesContext = ''
        const googleApiKey = process.env.GOOGLE_PLACES_API_KEY
        if (googleApiKey) {
            try {
                const PLACES_BASE = 'https://maps.googleapis.com/maps/api/place'
                const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city + ', Turkey')}&key=${googleApiKey}`)
                const geoData = await geoRes.json()
                const coords = geoData.results?.[0]?.geometry?.location

                if (coords) {
                    const fetchPlaces = async (keyword) => {
                        const params = new URLSearchParams({
                            query: `${keyword} ${city}`,
                            key: googleApiKey,
                            language: 'tr',
                        })
                        const res = await fetch(`${PLACES_BASE}/textsearch/json?${params}`)
                        const data = await res.json()
                        return (data.results || [])
                            .filter(p => p.rating && p.user_ratings_total)
                            .sort((a, b) => (b.rating * Math.log10(b.user_ratings_total + 1)) - (a.rating * Math.log10(a.user_ratings_total + 1)))
                    }

                    const allResults = await Promise.all(
                        scenarioConfig.searchTerms.map(term => fetchPlaces(term))
                    )

                    const formatPlaces = (places, count = 8) => places.slice(0, count).map(p => {
                        const price = p.price_level != null ? ' | Fiyat: ' + '₺'.repeat(p.price_level || 1) : ''
                        return `  • ${p.name} — ⭐${p.rating} (${p.user_ratings_total} yorum)${price} | ${p.formatted_address || ''}`
                    }).join('\n')

                    placesContext = '\n\n═══ GOOGLE PLACES VERİLERİ (GERÇEK MEKANLAR — BUNLARI KULLAN!) ═══\n\n'
                    scenarioConfig.searchTerms.forEach((term, i) => {
                        if (allResults[i]?.length > 0) {
                            placesContext += `🔍 "${term}":\n${formatPlaces(allResults[i])}\n\n`
                        }
                    })

                    // Hidden gems
                    const allPlaces = allResults.flat()
                    const hiddenGems = allPlaces.filter(p => p.rating >= 4.4 && p.user_ratings_total < 500 && p.user_ratings_total >= 20)
                    if (hiddenGems.length > 0) {
                        placesContext += `\n💎 GİZLİ CEVHERLER (az bilinen ama çok iyi puan — kesinlikle 2-3 tane öner!):\n${formatPlaces(hiddenGems, 6)}\n`
                    }

                    placesContext += '\nKRİTİK: Yukarıdaki GERÇEK mekan isimlerini kullan. Rating ve yorum sayısını belirt.'
                }
            } catch (placesErr) {
                console.warn('Google Places fetch failed:', placesErr.message)
            }
        }

        // ── Budget mapping ──
        const budgetDesc = {
            'economic': 'EKONOMİK — Kişi başı ₺100-300. Ucuz ama kaliteli, sokak yemeği, park, ücretsiz.',
            'mid': 'ORTA — Kişi başı ₺300-600. Güzel restoranlar, rahat mekanlar.',
            'luxury': 'LÜKS — Kişi başı ₺600+. En iyi mekanlar, premium deneyimler.',
        }[budget] || 'ORTA — Kişi başı ₺300-600'

        // ── Scenario-specific extras ──
        const extrasFormat = []
        if (scenarioConfig.mandatoryExtras.includes('surpriseIdeas')) {
            extrasFormat.push(`"surpriseIdeas": ["3-5 sürpriz fikri — planın içine gizlenmiş, zamanlı, wow efekti yaratacak anlar"]`)
        }
        if (scenarioConfig.mandatoryExtras.includes('messageDrafts')) {
            extrasFormat.push(`"messageDrafts": [
    { "timing": "Planı başlatmadan önce gönderilebilir", "message": "WhatsApp/SMS mesaj taslağı — samimi, doğal, kopyala-yapıştır" },
    { "timing": "Gece sonunda", "message": "Kapanış mesajı" }
  ]`)
        }
        if (scenarioConfig.mandatoryExtras.includes('giftSuggestions')) {
            extrasFormat.push(`"giftSuggestions": [
    { "item": "Hediye adı", "where": "Nereden alınır", "priceRange": "₺XX-XX", "why": "Neden bu hediye" }
  ]`)
        }
        if (scenarioConfig.mandatoryExtras.includes('apologyStrategy')) {
            extrasFormat.push(`"apologyStrategy": {
    "openingMove": "İlk adım — nasıl yaklaşmalı",
    "keyPhrase": "Söylenmesi gereken anahtar cümle",
    "avoidList": ["Sakın yapma 1", "Sakın yapma 2"],
    "recoverySignals": ["İşe yarıyor sinyalleri"]
  }`)
        }
        if (scenarioConfig.mandatoryExtras.includes('groupChallenges')) {
            extrasFormat.push(`"groupChallenges": [
    { "challenge": "Grup challenge açıklaması", "reward": "Kazanana ne olur" }
  ]`)
        }
        if (scenarioConfig.mandatoryExtras.includes('selfCareChecklist')) {
            extrasFormat.push(`"selfCareChecklist": ["Yapılacak self-care adımı 1", "adım 2"]`)
        }
        if (scenarioConfig.mandatoryExtras.includes('moodPlaylist')) {
            extrasFormat.push(`"moodPlaylist": { "vibe": "Playlist tarzı açıklaması", "songs": ["Şarkı 1 - Sanatçı", "Şarkı 2 - Sanatçı"] }`)
        }

        // ── Build Mega Prompt ──
        const now = new Date()
        const currentHour = now.getHours()
        const currentTime = `${String(currentHour).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

        const prompt = `${scenarioConfig.persona}

═══ SOS PLAN TALEBİ ═══
🚨 SENARYO: ${scenario.toUpperCase()}
📍 Şehir: ${city}
👥 Kişi Sayısı: ${peopleCount || 2}
💰 Bütçe: ${budgetDesc}
🕐 Şu anki saat: ${currentTime} (planı ŞİMDİDEN itibaren yap!)
${extraNotes ? `📝 Ekstra Bilgi: ${extraNotes}` : ''}

═══ SENARYO ODAĞI ═══
Ton: ${scenarioConfig.tone}
Odak: ${scenarioConfig.focus}

═══ KRİTİK KURALLAR ═══

1. **ACELE ET AMA MANTIKLI OL**: Bu bir SOS plan — kullanıcı SON DAKİKA karar verdi. Plan ${currentTime}'dan itibaren başlamalı. Gerçekçi zamanlama yap.

2. **DELİRMECELİ AMA MANTIKLI**: Her adım "vay be bunu düşünmezdim" dedirtmeli ama aynı zamanda uygulanabilir olmalı. Hayal kurma, gerçekçi ol.

3. **GERÇEK MEKANLAR**: SADECE ${city}'da gerçekten var olan mekanları öner. İsim UYDURMA. Google Places verilerini kullan.

4. **İNCE DETAYLAR**:
   - Her adımda ne sipariş edileceğini bile söyle
   - Garsonlara ne denileceği, masa seçimi, oturma düzeni
   - Fotoğraf çektirme noktaları ve açıları
   - Müzik önerileri (Spotify linki değil ama tarz)

5. **SENARYO BAZLI ÖZEL İÇERİK**:
${scenario === 'anniversary' ? '   - Romantik sürprizler: çiçek nereden alınır, ne zaman verilir\n   - Hediye zamanlaması\n   - Göz göze anlar yaratacak mekan düzeni\n   - "İlk buluşma" havasını yeniden yaratma fikirleri' : ''}
${scenario === 'birthday' ? '   - Sürpriz koordinasyonu: kim ne yapar, zamanlama\n   - Pasta nereden alınır, mum üfleme anı\n   - Hediye presentasyonu anı\n   - Grup aktiviteleri' : ''}
${scenario === 'friends' ? '   - HERKESIN BİLMEDİĞİ ama AŞIRI EĞLENCELİ hidden gem mekanlar\n   - Grup challenge/yarışma fikirleri\n   - "Bu gece efsane olacak" hissini yaratacak geçişler\n   - Spontan sürpriz anlar' : ''}
${scenario === 'apology' ? '   - Zamanlama stratejisi: ne zaman ne söylenir\n   - Beden dili ve ton ipuçları\n   - Küçük ama anlamlı jestler\n   - "Affedilme anı" nasıl yaratılır' : ''}
${scenario === 'mood' ? '   - Endorfin yükselten aktiviteler\n   - Comfort food sıralaması\n   - Küçük mutluluklar: köpek sevme, güneş batımı izleme\n   - "Kendine gel" ritüelleri' : ''}

6. **B PLANI**: Her şey ters giderse alternatif senaryo hazırla.

7. **ULAŞIM**: Mekanlar arası yürüme süresi, taksi ücreti, toplu taşıma detayları.
${placesContext}

═══ YANIT FORMATI (SADECE JSON) ═══
{
  "planTitle": "Yaratıcı, çılgın plan başlığı (emoji ile, senaryo tonunda)",
  "planEmoji": "🔥",
  "vibeDescription": "2-3 cümle — planın ruhu ve neden özel olduğu. Samimi, heyecanlı yaz.",
  "urgencyNote": "Aciliyet notu — hemen yapılması gereken ilk şey (çiçek al, rezervasyon yap vs.)",
  "totalBudget": { "min": 500, "max": 1200, "perPerson": "₺250-600" },
  "steps": [
    {
      "time": "${currentTime}",
      "duration": "30-45 dk",
      "emoji": "🎯",
      "title": "Kısa, çekici başlık (3-5 kelime)",
      "placeName": "Gerçek mekan adı",
      "placeRating": 4.6,
      "placeReviews": 1200,
      "address": "Kısa adres",
      "detail": "Ne yapılacak, nasıl yapılacak. Sipariş önerisi, oturma yeri, atmosfer. 3-4 cümle, samimi yaz.",
      "proTip": "Insider bilgi — sipariş tavsiyesi, gizli menü, garson ipucu vs.",
      "estimatedCost": "₺XX/kişi",
      "transport": "Bir önceki yerden nasıl gelinir",
      "alternative": { "name": "Alternatif mekan", "reason": "Neden (dolu olursa vs.)" }
    }
  ],
  "planB": {
    "title": "B Planı başlığı",
    "description": "Yağmur yağarsa / mekan dolu olursa ne yapılır",
    "steps": ["Alternatif adım 1", "Alternatif adım 2"]
  },
  "whatToWear": "Kıyafet önerisi — gruba ve senaryoya uygun",
  "playlistVibe": "Müzik tarzı önerisi — bu akşamla uyumlu",
  ${extrasFormat.join(',\n  ')}
}

KRİTİK:
- Tüm metin TÜRKÇE olsun
- steps dizisinde en az 4, en fazla 8 adım olsun
- Saat ${currentTime}'dan başlayıp mantıklı ilerlesin
- SADECE geçerli JSON döndür, markdown veya yorum EKLEME`

        // ── Call Gemini ──
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`
        const geminiBody = {
            systemInstruction: {
                parts: [{ text: scenarioConfig.persona + ' Her zaman geçerli JSON ile yanıt ver. SADECE gerçek, var olan mekanları öner. Türkçe yaz.' }]
            },
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.85,
                maxOutputTokens: 12288,
                responseMimeType: 'application/json',
            },
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiBody),
        })

        if (!response.ok) {
            const errText = await response.text()
            console.error('SOS Plan Gemini 2.5 error:', response.status, errText.substring(0, 300))

            // Fallback to gemini-2.0-flash without systemInstruction
            const fallbackRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.85, maxOutputTokens: 12288, responseMimeType: 'application/json' },
                    }),
                }
            )
            if (!fallbackRes.ok) {
                const fallbackErr = await fallbackRes.text()
                console.error('SOS Plan Gemini 2.0 fallback error:', fallbackRes.status, fallbackErr.substring(0, 300))
                return NextResponse.json({ error: 'AI servisi yanıt vermedi. Lütfen tekrar deneyin.' }, { status: 500 })
            }
            const fallbackData = await fallbackRes.json()
            const fallbackContent = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text
            if (fallbackContent) {
                const result = repairJSON(fallbackContent)
                if (result) {
                    result._scenario = scenario
                    result._city = city
                    result._generatedAt = new Date().toISOString()
                    return NextResponse.json(result)
                }
            }
            return NextResponse.json({ error: 'AI boş yanıt döndü. Tekrar deneyin.' }, { status: 500 })
        }

        const data = await response.json()
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text

        if (!content) {
            console.error('SOS Plan: Empty Gemini response', JSON.stringify(data).substring(0, 300))
            return NextResponse.json({ error: 'AI boş yanıt döndü. Tekrar deneyin.' }, { status: 500 })
        }

        const result = repairJSON(content)
        if (!result) {
            console.error('SOS Plan: Failed to parse JSON', content.substring(0, 500))
            return NextResponse.json({ error: 'AI yanıtı işlenemedi. Tekrar deneyin.' }, { status: 500 })
        }
        result._scenario = scenario
        result._city = city
        result._generatedAt = new Date().toISOString()
        return NextResponse.json(result)

    } catch (err) {
        console.error('SOS Plan API error:', err)
        return NextResponse.json({ error: 'Sunucu hatası: ' + err.message }, { status: 500 })
    }
}

