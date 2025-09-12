import React from 'react'

interface ShimmerInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  isShimmering?: boolean
  type?: string
  name?: string
  id?: string
  required?: boolean
}

export function ShimmerInput({ 
  value, 
  onChange, 
  placeholder, 
  className = '', 
  disabled = false,
  isShimmering = false,
  type = 'text',
  name,
  id,
  required = false
}: ShimmerInputProps) {
  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        name={name}
        id={id}
        required={required}
        className={`
          w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-all duration-200
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          ${className}
        `}
      />
      {isShimmering && (
        <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-200/30 to-transparent animate-shimmer"></div>
        </div>
      )}
    </div>
  )
}

interface ShimmerTextareaProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  isShimmering?: boolean
  name?: string
  id?: string
  rows?: number
}

export function ShimmerTextarea({ 
  value, 
  onChange, 
  placeholder, 
  className = '', 
  disabled = false,
  isShimmering = false,
  name,
  id,
  rows = 3
}: ShimmerTextareaProps) {
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        name={name}
        id={id}
        rows={rows}
        className={`
          w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-all duration-200 resize-none
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          ${className}
        `}
      />
      {isShimmering && (
        <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-200/30 to-transparent animate-shimmer"></div>
        </div>
      )}
    </div>
  )
}
