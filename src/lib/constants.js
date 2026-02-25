// Pin types with emoji and colors
export const PIN_TYPES = {
    food: { emoji: '🍽️', label: 'Food', color: '#EF4444' },
    view: { emoji: '🏔️', label: 'View', color: '#3B82F6' },
    activity: { emoji: '🎯', label: 'Activity', color: '#10B981' },
    hotel: { emoji: '🏨', label: 'Hotel', color: '#8B5CF6' },
    memory: { emoji: '💑', label: 'Memory', color: '#EC4899' },
    photospot: { emoji: '📸', label: 'Photo Spot', color: '#F59E0B' },
    transport: { emoji: '🚆', label: 'Transport', color: '#6366F1' },
    warning: { emoji: '⚠️', label: 'Warning', color: '#F97316' },
}

// Pin status options
export const PIN_STATUSES = {
    visited: { label: 'Visited', color: '#10B981', emoji: '✅' },
    planned: { label: 'Planned', color: '#3B82F6', emoji: '📅' },
    wishlist: { label: 'Wishlist', color: '#F59E0B', emoji: '⭐' },
}

// Trip tempo options
export const TRIP_TEMPOS = [
    { value: 'relaxed', label: '🧘 Relaxed — no rush, sleep in' },
    { value: 'moderate', label: '🚶 Moderate — balanced sightseeing & rest' },
    { value: 'active', label: '🏃 Active — pack it all in!' },
]

// Budget levels
export const BUDGET_LEVELS = [
    { value: 'budget', label: '💰 Budget-friendly' },
    { value: 'moderate', label: '💳 Moderate' },
    { value: 'luxury', label: '💎 Luxury' },
]

// Interest categories for AI planner
export const INTERESTS = [
    'History & Culture',
    'Food & Restaurants',
    'Nature & Parks',
    'Art & Museums',
    'Shopping',
    'Nightlife',
    'Photography',
    'Architecture',
    'Street Food',
    'Beaches',
    'Adventure',
    'Romantic',
    'Local Life',
]

// Mapbox styles
export const MAP_STYLES = {
    dark: 'mapbox://styles/mapbox/dark-v11',
    light: 'mapbox://styles/mapbox/light-v11',
}
