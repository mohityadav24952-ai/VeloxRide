// Display info for each vehicle type. Keys match the backend's vehicleType values.
export const VEHICLES = {
    car: { label: 'Velox Go', seats: 4, tagline: 'Affordable, compact rides', icon: 'ri-car-fill' },
    moto: { label: 'Velox Moto', seats: 1, tagline: 'Quick motorcycle rides', icon: 'ri-motorbike-fill' },
    auto: { label: 'Velox Auto', seats: 3, tagline: 'Everyday auto rides', icon: 'ri-taxi-fill' },
}

export const formatDistance = (meters) => {
    if (!Number.isFinite(meters)) return ''
    return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`
}

// "Clock Tower, Rajpur Road, Dehradun" -> title "Clock Tower", subtitle "Rajpur Road, Dehradun"
export const placeTitle = (address = '') => address.split(',')[ 0 ].trim()
export const placeSubtitle = (address = '') => address.split(',').slice(1).join(',').trim()

export const fullName = (person) =>
    [ person?.fullname?.firstname, person?.fullname?.lastname ].filter(Boolean).join(' ')
