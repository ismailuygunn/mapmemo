// UMAE – constants (i18n-ready, labels via translation keys)

// ============================
// PIN TYPES & STATUSES
// ============================
export const PIN_TYPES = {
    food: { emoji: '🍕', labelKey: 'pinType.food', color: '#F97316' },
    view: { emoji: '🌅', labelKey: 'pinType.view', color: '#3B82F6' },
    activity: { emoji: '🎯', labelKey: 'pinType.activity', color: '#10B981' },
    hotel: { emoji: '🏨', labelKey: 'pinType.hotel', color: '#8B5CF6' },
    memory: { emoji: '💕', labelKey: 'pinType.memory', color: '#EC4899' },
    photospot: { emoji: '📸', labelKey: 'pinType.photospot', color: '#FBBF24' },
    transport: { emoji: '🚇', labelKey: 'pinType.transport', color: '#6366F1' },
    warning: { emoji: '⚠️', labelKey: 'pinType.warning', color: '#EF4444' },
}

export const PIN_STATUSES = {
    visited: { emoji: '✅', labelKey: 'pinStatus.visited' },
    planned: { emoji: '📌', labelKey: 'pinStatus.planned' },
    wishlist: { emoji: '💭', labelKey: 'pinStatus.wishlist' },
}

// ============================
// TRIP PLANNER — BASIC
// ============================
export const TRIP_TEMPOS = [
    { value: 'relaxed', labelKey: 'tempo.relaxed' },
    { value: 'moderate', labelKey: 'tempo.moderate' },
    { value: 'active', labelKey: 'tempo.active' },
]

export const BUDGET_LEVELS = [
    { value: 'budget', labelKey: 'budget.budget' },
    { value: 'moderate', labelKey: 'budget.moderate' },
    { value: 'luxury', labelKey: 'budget.luxury' },
]

export const INTERESTS = [
    { key: 'historyculture', labelKey: 'interest.historyculture' },
    { key: 'foodrestaurants', labelKey: 'interest.foodrestaurants' },
    { key: 'natureparks', labelKey: 'interest.natureparks' },
    { key: 'artmuseums', labelKey: 'interest.artmuseums' },
    { key: 'shopping', labelKey: 'interest.shopping' },
    { key: 'nightlife', labelKey: 'interest.nightlife' },
    { key: 'photography', labelKey: 'interest.photography' },
    { key: 'architecture', labelKey: 'interest.architecture' },
    { key: 'streetfood', labelKey: 'interest.streetfood' },
    { key: 'beaches', labelKey: 'interest.beaches' },
    { key: 'adventure', labelKey: 'interest.adventure' },
    { key: 'romantic', labelKey: 'interest.romantic' },
    { key: 'locallife', labelKey: 'interest.locallife' },
]

// ============================
// TRANSPORT MODES
// ============================
export const TRANSPORT_MODES = [
    { value: 'public', emoji: '🚌', labelKey: 'transport.public' },
    { value: 'taxi', emoji: '🚕', labelKey: 'transport.taxi' },
    { value: 'walk', emoji: '🚶', labelKey: 'transport.walk' },
    { value: 'mixed', emoji: '🔀', labelKey: 'transport.mixed' },
]

// ============================
// PRIORITIES
// ============================
export const PRIORITIES = [
    { value: 'cheap', emoji: '💰', labelKey: 'priority.cheap' },
    { value: 'fast', emoji: '⚡', labelKey: 'priority.fast' },
    { value: 'comfortable', emoji: '🛋️', labelKey: 'priority.comfortable' },
]

// ============================
// MEAL PREFERENCES
// ============================
export const MEAL_STYLES = [
    { value: 'local', emoji: '🏠', labelKey: 'meal.local' },
    { value: 'fineDining', emoji: '🍽️', labelKey: 'meal.fineDining' },
    { value: 'streetFood', emoji: '🥙', labelKey: 'meal.streetFood' },
    { value: 'cafe', emoji: '☕', labelKey: 'meal.cafe' },
]

export const DIET_OPTIONS = [
    { value: 'none', emoji: '🍴', labelKey: 'diet.none' },
    { value: 'vegan', emoji: '🌱', labelKey: 'diet.vegan' },
    { value: 'vegetarian', emoji: '🥗', labelKey: 'diet.vegetarian' },
    { value: 'halal', emoji: '🕌', labelKey: 'diet.halal' },
    { value: 'glutenFree', emoji: '🚫', labelKey: 'diet.glutenFree' },
]

// ============================
// TOUR BUILDER
// ============================
export const TOUR_GROUP_TYPES = [
    { value: 'group', emoji: '👥', labelKey: 'tour.group' },
    { value: 'private', emoji: '💎', labelKey: 'tour.private' },
]

export const WALKING_LEVELS = [
    { value: 'light', emoji: '🚶', labelKey: 'tour.walkLight' },
    { value: 'medium', emoji: '🥾', labelKey: 'tour.walkMedium' },
    { value: 'hard', emoji: '🏔️', labelKey: 'tour.walkHard' },
]

export const PHOTO_STOP_OPTIONS = [
    { value: 'few', labelKey: 'tour.photoFew' },
    { value: 'normal', labelKey: 'tour.photoNormal' },
    { value: 'many', labelKey: 'tour.photoMany' },
]

export const SHOPPING_STOP_OPTIONS = [
    { value: 'no', emoji: '❌', labelKey: 'tour.shopNo' },
    { value: 'optional', emoji: '🤷', labelKey: 'tour.shopOptional' },
    { value: 'yes', emoji: '🛍️', labelKey: 'tour.shopYes' },
]

export const ACCESSIBILITY_OPTIONS = [
    { value: 'childFriendly', emoji: '👶', labelKey: 'tour.childFriendly' },
    { value: 'pregnantFriendly', emoji: '🤰', labelKey: 'tour.pregnantFriendly' },
    { value: 'wheelchairAccessible', emoji: '♿', labelKey: 'tour.wheelchairAccessible' },
]

export const CURRENCIES = [
    { value: 'TRY', symbol: '₺', label: 'TRY (₺)' },
    { value: 'EUR', symbol: '€', label: 'EUR (€)' },
    { value: 'USD', symbol: '$', label: 'USD ($)' },
    { value: 'GBP', symbol: '£', label: 'GBP (£)' },
]

// ============================
// MAP STYLES
// ============================
export const MAP_STYLES = {
    dark: 'mapbox://styles/mapbox/dark-v11',
    light: 'mapbox://styles/mapbox/light-v11',
}
