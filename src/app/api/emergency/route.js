import { NextResponse } from 'next/server'

export async function POST(request) {
    try {
        const { city, country, locale } = await request.json()
        if (!city && !country) return NextResponse.json({ error: 'City or country required' }, { status: 400 })

        const geminiKey = process.env.GEMINI_API_KEY
        if (!geminiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 500 })

        const lang = locale === 'tr' ? 'Turkish' : 'English'
        const destination = city || country

        const prompt = `Provide comprehensive emergency and safety information for a traveler visiting ${destination}.

Respond in ${lang}. Return ONLY valid JSON:
{
  "emergencyNumbers": [
    { "service": "Polis / Police", "number": "155", "emoji": "🚔" },
    { "service": "Ambulans / Ambulance", "number": "112", "emoji": "🚑" },
    { "service": "İtfaiye / Fire", "number": "110", "emoji": "🚒" },
    { "service": "Turist Polis / Tourist Police", "number": "xxx", "emoji": "👮" }
  ],
  "hospitals": [
    {
      "name": "City Hospital Name",
      "address": "Full address",
      "phone": "+xx xxx xxx xxxx",
      "isPublic": true,
      "hasER": true,
      "googleMapsUrl": "https://maps.google.com/?q=Hospital+Name+City"
    }
  ],
  "embassy": {
    "name": "T.C. Büyükelçiliği / Turkish Embassy",
    "address": "Embassy address",
    "phone": "+xx xxx xxx xxxx",
    "website": "https://...",
    "googleMapsUrl": "https://maps.google.com/?q=Turkish+Embassy+City",
    "workingHours": "Mon-Fri 09:00-17:00"
  },
  "safeAreas": [
    { "name": "Area name", "description": "Why it's safe, good for tourists", "emoji": "✅" }
  ],
  "cautionAreas": [
    { "name": "Area name", "description": "What to watch for", "emoji": "⚠️" }
  ],
  "scamWarnings": [
    { "type": "Taxi scam", "description": "How it works and how to avoid", "emoji": "🚕" }
  ],
  "healthInfo": {
    "waterSafety": "Tap water is safe / not safe to drink",
    "vaccines": ["Recommended vaccines if any"],
    "pharmacyHours": "Most pharmacies open 09:00-19:00",
    "insuranceTip": "Travel insurance recommended, average ER visit costs..."
  },
  "localLaws": [
    { "topic": "Alcohol", "info": "Legal drinking age is 18, no public drinking", "emoji": "🍺" },
    { "topic": "Photography", "info": "No photos of military areas", "emoji": "📸" }
  ],
  "tipping": {
    "restaurants": "10-15% is customary",
    "hotels": "5-10 TRY per night for housekeeping",
    "taxis": "Round up to nearest lira",
    "guides": "50-100 TRY per day"
  },
  "generalTips": [
    "Keep copies of your passport separately",
    "Register with your embassy before travel"
  ]
}

Include REAL, ACCURATE information for ${destination}. Use actual emergency numbers, real hospital names.
Include the Turkish Embassy/Consulate with real address if available.
List 3-5 hospitals, 3-5 safe areas, 2-3 caution areas, 3-5 scam warnings.
Respond ONLY with valid JSON.`

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: 'You are a travel safety expert. Provide accurate emergency information. Always respond with valid JSON. Use real phone numbers and addresses when possible.' }] },
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.2, maxOutputTokens: 12288, responseMimeType: 'application/json' },
            }),
        })

        if (!response.ok) throw new Error(`Gemini error: ${await response.text()}`)

        const data = await response.json()
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (!content) throw new Error('Empty response')

        return NextResponse.json(JSON.parse(content))
    } catch (err) {
        console.error('Emergency API error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
