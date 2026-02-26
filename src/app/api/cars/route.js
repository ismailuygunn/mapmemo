// Car rental search API — aggregates providers with deeplinks
import { NextResponse } from 'next/server'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const city = searchParams.get('city')
        const pickupDate = searchParams.get('pickup') || ''
        const dropoffDate = searchParams.get('dropoff') || ''

        if (!city) {
            return NextResponse.json({ error: 'City is required' }, { status: 400 })
        }

        // Return provider deeplinks with city + dates
        const providers = [
            {
                id: 'enterprise',
                name: 'Enterprise',
                logo: '🚗',
                color: '#007A33',
                url: `https://www.enterprise.com/en/reserve.html?pickupCity=${encodeURIComponent(city)}&pickupDate=${pickupDate}&returnDate=${dropoffDate}`,
                description: 'Global car rental leader',
            },
            {
                id: 'sixt',
                name: 'Sixt',
                logo: '🏎️',
                color: '#FF6600',
                url: `https://www.sixt.com/car-rental/${encodeURIComponent(city.toLowerCase().replace(/\s+/g, '-'))}/?pickup=${pickupDate}&return=${dropoffDate}`,
                description: 'Premium & sport cars',
            },
            {
                id: 'europcar',
                name: 'Europcar',
                logo: '🚙',
                color: '#00843D',
                url: `https://www.europcar.com/en-us/search?location=${encodeURIComponent(city)}&pickup=${pickupDate}&return=${dropoffDate}`,
                description: 'European coverage',
            },
            {
                id: 'budget',
                name: 'Budget',
                logo: '💰',
                color: '#FF6600',
                url: `https://www.budget.com/en/reservation?pickup_location=${encodeURIComponent(city)}&pickup_date=${pickupDate}&return_date=${dropoffDate}`,
                description: 'Affordable options',
            },
            {
                id: 'rentalcars',
                name: 'Rentalcars.com',
                logo: '🔍',
                color: '#003B71',
                url: `https://www.rentalcars.com/search-results?location=${encodeURIComponent(city)}&puDay=${pickupDate}&doDay=${dropoffDate}`,
                description: 'Compare all providers',
            },
            {
                id: 'kayak',
                name: 'Kayak',
                logo: '🔎',
                color: '#FF6900',
                url: `https://www.kayak.com/cars/${encodeURIComponent(city)}/${pickupDate}/${dropoffDate}`,
                description: 'Best price comparison',
            },
        ]

        return NextResponse.json({ providers, city })
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
