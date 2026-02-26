import { NextResponse } from 'next/server'

export async function POST(request) {
    try {
        const formData = await request.formData()
        const image = formData.get('image')
        const locale = formData.get('locale') || 'tr'

        if (!image) return NextResponse.json({ error: 'Image required' }, { status: 400 })

        const geminiKey = process.env.GEMINI_API_KEY
        if (!geminiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 500 })

        // Convert image to base64
        const bytes = await image.arrayBuffer()
        const base64 = Buffer.from(bytes).toString('base64')
        const mimeType = image.type || 'image/jpeg'

        const lang = locale === 'tr' ? 'Turkish' : 'English'

        const prompt = `Analyze this restaurant menu image. Extract all food items and translate them to ${lang}.

Respond ONLY with valid JSON:
{
  "restaurantType": "Italian / Turkish / Japanese / etc.",
  "detectedLanguage": "The language the menu is written in",
  "sections": [
    {
      "name": "Başlangıçlar / Starters",
      "emoji": "🥗",
      "items": [
        {
          "originalName": "Original menu item name",
          "translatedName": "Translated name",
          "description": "Brief description of the dish, main ingredients",
          "price": "₺120 or $15 (if visible)",
          "isVegetarian": false,
          "isVegan": false,
          "isSpicy": false,
          "allergens": ["gluten", "dairy"],
          "recommendation": "★★★★☆ Popular choice, great for first-timers"
        }
      ]
    }
  ],
  "topPicks": ["Item name 1", "Item name 2", "Item name 3"],
  "budgetTip": "Average meal costs around ₺200-300 per person"
}

Extract EVERY visible item. Group by menu sections if visible.
Mark allergens: gluten, dairy, nuts, seafood, eggs, soy.
Add ★ recommendations for standout dishes.
Respond ONLY with valid JSON.`

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: 'You are a food and menu translation expert. Extract all items from the menu image, translate accurately, and provide helpful descriptions. Always respond with valid JSON.' }] },
                contents: [{
                    parts: [
                        { inlineData: { mimeType, data: base64 } },
                        { text: prompt }
                    ]
                }],
                generationConfig: { temperature: 0.2, maxOutputTokens: 12288, responseMimeType: 'application/json' },
            }),
        })

        if (!response.ok) throw new Error(`Gemini error: ${await response.text()}`)

        const data = await response.json()
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (!content) throw new Error('Empty response')

        return NextResponse.json(JSON.parse(content))
    } catch (err) {
        console.error('Menu translate error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
