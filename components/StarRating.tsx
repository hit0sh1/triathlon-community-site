'use client'

import { Star } from 'lucide-react'
import { useState } from 'react'

interface StarRatingProps {
  rating: number
  onRatingChange?: (rating: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  className?: string
}

export default function StarRating({ 
  rating, 
  onRatingChange, 
  readonly = false, 
  size = 'md',
  showValue = false,
  className = ''
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }
  
  const starSize = sizeClasses[size]
  const displayRating = hoverRating || rating
  
  const handleStarClick = (starRating: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starRating)
    }
  }
  
  const handleStarHover = (starRating: number) => {
    if (!readonly) {
      setHoverRating(starRating)
    }
  }
  
  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0)
    }
  }
  
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center" onMouseLeave={handleMouseLeave}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => handleStarHover(star)}
          >
            <Star
              className={`${starSize} ${
                star <= displayRating
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300 dark:text-gray-600'
              } transition-colors`}
            />
          </button>
        ))}
      </div>
      
      {showValue && (
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 ml-2">
          {rating > 0 ? rating.toFixed(1) : '未評価'}
        </span>
      )}
    </div>
  )
}