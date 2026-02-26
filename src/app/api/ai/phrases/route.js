import { NextResponse } from 'next/server'

export async function POST(request) {
    try {
        const { city, country, locale } = await request.json()
        if (!city && !country) return NextResponse.json({ error: 'City or country required' }, { status: 400 })

        const geminiKey = process.env.GEMINI_API_KEY
        if (!geminiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 500 })

        const lang = locale === 'tr' ? 'Turkish' : 'English'
        const destination = city || country

        const prompt = `Create a travel phrasebook for a traveler visiting ${destination}.
The traveler speaks ${lang}. Detect the LOCAL language spoken in ${destination} and provide translations.

Respond ONLY with valid JSON:
{
  "localLanguage": "Greek",
  "localLanguageNative": "Ελληνικά",
  "categories": [
    {
      "name": "Selamlama",
      "nameEn": "Greetings",
      "emoji": "👋",
      "phrases": [
        {
          "original": "Merhaba / Hello",
          "translated": "Γεια σας",
          "pronunciation": "YA sas",
          "context": "Formal greeting, use with strangers"
        }
      ]
    }
  ],
  "culturalNotes": [
    "Greeks greet with a handshake, close friends may kiss on both cheeks",
    "Tipping 5-10% is customary in restaurants"
  ],
  "emergencyPhrases": [
    { "original": "Yardım / Help!", "translated": "Βοήθεια!", "pronunciation": "vo-EE-thya" },
    { "original": "Polis çağırın / Call the police", "translated": "Καλέστε την αστυνομία", "pronunciation": "ka-LES-te tin as-ti-no-MEE-a" }
  ]
}

Categories MUST include: Selamlama/Greetings, Yemek Sipariş/Ordering Food, Ulaşım/Transportation, Acil Durum/Emergency, Alışveriş/Shopping, Otel/Hotel, Genel/General, Yön Tarifi/Directions.
Include 6-8 phrases per category. Each MUST have pronunciation guide.
Respond ONLY with valid JSON.`

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: 'You are a multilingual travel language assistant. Always respond with valid JSON. Provide accurate translations and natural pronunciation guides.' }] },
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.3, maxOutputTokens: 12288, responseMimeType: 'application/json' },
            }),
        })

        if (!response.ok) throw new Error(`Gemini error: ${await response.text()}`)

        const data = await response.json()
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (!content) throw new Error('Empty response')

        return NextResponse.json(JSON.parse(content))
    } catch (err) {
        console.error('Phrases API error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
