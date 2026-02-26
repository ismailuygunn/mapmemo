// Weather API Proxy — OpenWeatherMap
// Provides 5-day forecast or current weather for trip planning
import { NextResponse } from 'next/server'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const city = searchParams.get('city')
        const lat = searchParams.get('lat')
        const lon = searchParams.get('lon')

        if (!city && (!lat || !lon)) {
            return NextResponse.json({ error: 'City or coordinates required' }, { status: 400 })
        }

        const apiKey = process.env.OPENWEATHER_API_KEY
        if (!apiKey) {
            // Return mock data when API key not configured
            return NextResponse.json({
                available: false,
                message: 'Weather API not configured',
                mock: true,
            })
        }

        // Build URL based on params
        const baseUrl = 'https://api.openweathermap.org/data/2.5/forecast'
        const lang = searchParams.get('lang') || 'tr'
        const params = new URLSearchParams({
            appid: apiKey,
            units: 'metric',
            cnt: 40, // 5 days × 8 (3-hour intervals)
            lang, // localized descriptions
        })

        if (city) params.append('q', city)
        else { params.append('lat', lat); params.append('lon', lon) }

        const res = await fetch(`${baseUrl}?${params}`)
        if (!res.ok) {
            const errBody = await res.text()
            console.error('OpenWeather error:', errBody)
            return NextResponse.json({ available: false, message: 'Weather lookup failed' })
        }

        const data = await res.json()

        // Simplify the response for the planner
        const dailyForecasts = {}
        data.list.forEach(item => {
            const day = item.dt_txt.split(' ')[0]
            if (!dailyForecasts[day]) {
                dailyForecasts[day] = {
                    date: day,
                    tempMin: item.main.temp_min,
                    tempMax: item.main.temp_max,
                    weather: item.weather[0].main,
                    description: item.weather[0].description,
                    icon: item.weather[0].icon,
                    humidity: item.main.humidity,
                    windSpeed: item.wind.speed,
                    pop: item.pop, // probability of precipitation
                }
            } else {
                dailyForecasts[day].tempMin = Math.min(dailyForecasts[day].tempMin, item.main.temp_min)
                dailyForecasts[day].tempMax = Math.max(dailyForecasts[day].tempMax, item.main.temp_max)
                dailyForecasts[day].pop = Math.max(dailyForecasts[day].pop, item.pop)
            }
        })

        return NextResponse.json({
            available: true,
            city: data.city.name,
            country: data.city.country,
            forecasts: Object.values(dailyForecasts),
        })
    } catch (err) {
        console.error('Weather API error:', err)
        return NextResponse.json({ available: false, message: 'Server error' }, { status: 500 })
    }
}
