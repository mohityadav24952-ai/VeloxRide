import React from 'react'

// Initials avatar, so we don't depend on stock photos.
const Avatar = ({ name = '', className = 'h-12 w-12 text-lg' }) => {
    const initials = name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[ 0 ].toUpperCase())
        .join('') || '?'

    return (
        <div className={`${className} rounded-full bg-gray-900 text-white font-semibold flex items-center justify-center shrink-0`}>
            {initials}
        </div>
    )
}

export default Avatar
