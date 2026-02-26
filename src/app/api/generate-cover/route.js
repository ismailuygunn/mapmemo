// AI Cover Image Generator — Creates story-format trip covers using DALL-E
import { NextResponse } from 'next/server'

export async function POST(request) {
    try {
        const { city, style, startDate, endDate } = await request.json()

        if (!city) {
            return NextResponse.json({ error: 'City is required' }, { status: 400 })
        }

        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey) {
            return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
        }

        // Style descriptions for different cover themes
        const styleDescriptions = {
            romantic: 'romantic couple silhouette, golden hour light, dreamy bokeh, warm tones, love hearts in sky',
            adventure: 'epic landscape view, bold dramatic lighting, mountain peaks or ocean vista, adventurous mood',
            vintage: 'vintage film grain, retro color palette, old postcard style, nostalgic warm sepia tones',
            minimal: 'clean minimalist design, geometric shapes, pastel colors, modern typography style',
            cinematic: 'cinematic wide shot, moody dramatic lighting, film color grading, ultra wide angle',
            watercolor: 'beautiful watercolor painting style, soft flowing colors, artistic brushstrokes, dreamy',
            neon: 'neon city lights, cyberpunk vibe, glowing signs, nighttime urban atmosphere',
            dreamy: 'soft pastel dreamscape, floating clouds, magical golden particles, ethereal atmosphere',
        }

        const styleDesc = styleDescriptions[style] || styleDescriptions.romantic
        const dateRange = startDate && endDate ? `${startDate} - ${endDate}` : ''

        const prompt = `Create a stunning vertical travel poster for ${city}. 
Style: ${styleDesc}
The image should feature the most iconic landmark or scenery of ${city}.
Include beautiful sky and atmospheric lighting.
This is a mobile story format cover image (portrait orientation 1024x1792).
The image should be photorealistic and breathtaking, suitable as a trip memory cover.
DO NOT include any text, words, or typography in the image.
Make it look like a professional travel magazine cover photo.`

        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'dall-e-3',
                prompt,
                n: 1,
                size: '1024x1792', // Story format (portrait)
                quality: 'standard',
                response_format: 'url',
            }),
        })

        if (!response.ok) {
            const errText = await response.text()
            console.error('DALL-E error:', errText)
            return NextResponse.json({ error: 'Image generation failed' }, { status: 500 })
        }

        const data = await response.json()
        const imageUrl = data.data?.[0]?.url

        if (!imageUrl) {
            return NextResponse.json({ error: 'No image generated' }, { status: 500 })
        }

        return NextResponse.json({
            imageUrl,
            prompt,
            city,
            style: style || 'romantic',
        })
    } catch (err) {
        console.error('Cover generation error:', err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
