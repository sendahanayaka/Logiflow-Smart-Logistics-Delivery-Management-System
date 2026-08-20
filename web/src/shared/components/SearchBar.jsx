import { useId } from 'react'

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  label = 'Search',
  onClear,
}) {
  const inputId = useId()

  return (
    <div className="search-bar">
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <span className="search-bar__icon" aria-hidden="true">
        ⌕
      </span>
      <input
        id={inputId}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      {value && onClear && (
        <button type="button" onClick={onClear} aria-label="Clear search">
          ×
        </button>
      )}
    </div>
  )
}
