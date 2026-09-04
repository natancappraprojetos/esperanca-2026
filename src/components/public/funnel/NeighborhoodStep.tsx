'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { trackEvent } from '@/lib/tracking/events'
import type { City, Neighborhood, Church, Campaign } from '@/types/database'
import type { FunnelData } from '../FunnelPage'

interface NeighborhoodStepProps {
  city: City
  campaign: Campaign
  onSelect: (neighborhood: Neighborhood, church: Church | null, method: string, pixels?: any[]) => void
  data: FunnelData
}

type SearchResult = {
  neighborhood: Neighborhood
  score: number
}

export default function NeighborhoodStep({ city, campaign, onSelect, data }: NeighborhoodStepProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [suggestions, setSuggestions] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [notFound, setNotFound] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    trackEvent('NeighborhoodSearch', {
      campaign_id: campaign.id,
      city_id: city.id,
      session_token: data.sessionToken,
    })
    inputRef.current?.focus()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const searchNeighborhoods = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([])
      setNotFound(false)
      return
    }
    setLoading(true)
    setNotFound(false)
    try {
      const res = await fetch(
        `/api/neighborhoods/search?city_id=${city.id}&q=${encodeURIComponent(q)}`
      )
      const json = await res.json()
      const found = json.results || []
      setResults(found)
      if (found.length === 0 && q.length >= 3) {
        // Get suggestions for "did you mean"
        const sugRes = await fetch(
          `/api/neighborhoods/search?city_id=${city.id}&q=${encodeURIComponent(q)}&suggest=1`
        )
        const sugJson = await sugRes.json()
        setSuggestions(sugJson.results || [])
        setNotFound(true)
      }
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [city.id])

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    setHighlightedIndex(-1)
    setNotFound(false)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchNeighborhoods(val), 280)
  }

  async function handleSelect(neighborhood: Neighborhood) {
    trackEvent('NeighborhoodSelected', {
      campaign_id: campaign.id,
      city_id: city.id,
      neighborhood_id: neighborhood.id,
      neighborhood_name: neighborhood.name,
      session_token: data.sessionToken,
    })

    setLoading(true)
    try {
      const res = await fetch(
        `/api/geo/find-church?neighborhood_id=${neighborhood.id}&city_id=${city.id}&campaign_id=${campaign.id}`
      )
      const json = await res.json()
      const church = json.church || null
      const method = json.method || 'fallback'
      const pixels = json.pixels || []

      if (church) {
        trackEvent('ChurchMatched', {
          campaign_id: campaign.id,
          city_id: city.id,
          neighborhood_id: neighborhood.id,
          church_id: church.id,
          method,
          session_token: data.sessionToken,
        })
      }

      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Search', {
          search_string: neighborhood.name
        })
      }

      onSelect(neighborhood, church, method, pixels)
    } catch {
      onSelect(neighborhood, null, 'error', [])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!results.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault()
      handleSelect(results[highlightedIndex].neighborhood)
    }
  }

  const showDropdown = focused && results.length > 0

  return (
    <div className="min-h-svh flex flex-col" style={{ paddingTop: '4rem' }}>
      <div className="container-narrow flex flex-col gap-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3"
        >
          <div className="flex items-center gap-2">
            <span 
              className="badge badge-gray"
              style={{ fontSize: '0.8125rem' }}
            >
              📍 {city.name}
            </span>
          </div>
          <span className="text-overline" style={{ color: 'var(--red)' }}>
            Passo 2 de 3
          </span>
          <h2 className="text-heading-2" style={{ color: 'var(--gray-900)' }}>
            Qual é o seu bairro ou região?
          </h2>
          <p className="text-body" style={{ color: 'var(--gray-500)' }}>
            Encontraremos a programação mais próxima de você.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative"
        >
          <div className="form-group">
            <label htmlFor="neighborhood-search" className="sr-only">
              Nome do bairro
            </label>
            <div className="relative">
              <input
                id="neighborhood-search"
                ref={inputRef}
                type="text"
                className="form-input"
                placeholder="Digite seu bairro, rua ou região..."
                value={query}
                onChange={handleInput}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 150)}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                spellCheck={false}
                aria-autocomplete="list"
                aria-expanded={showDropdown}
                style={{ paddingLeft: '3rem', fontSize: '1.0625rem' }}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                {loading ? (
                  <div className="spinner" style={{ width: 18, height: 18 }} />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style={{ color: 'var(--gray-400)' }}>
                    <path d="M10 2C7.24 2 5 4.24 5 7c0 4.25 5 11 5 11s5-6.75 5-11c0-2.76-2.24-5-5-5zm0 6.5c-.83 0-1.5-.67-1.5-1.5S9.17 5.5 10 5.5s1.5.67 1.5 1.5S10.83 8.5 10 8.5z" fill="currentColor"/>
                  </svg>
                )}
              </div>
            </div>

            {showDropdown && (
              <div 
                className="autocomplete-dropdown absolute left-0 right-0 top-full mt-1"
                role="listbox"
              >
                {results.map((r, i) => (
                  <button
                    key={r.neighborhood.id}
                    role="option"
                    aria-selected={i === highlightedIndex}
                    className={`autocomplete-item w-full text-left ${i === highlightedIndex ? 'highlighted' : ''}`}
                    onMouseEnter={() => setHighlightedIndex(i)}
                    onMouseDown={() => handleSelect(r.neighborhood)}
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ color: 'var(--gray-400)', flexShrink: 0 }}>
                      <path d="M10 2C7.24 2 5 4.24 5 7c0 4.25 5 11 5 11s5-6.75 5-11c0-2.76-2.24-5-5-5zm0 6.5c-.83 0-1.5-.67-1.5-1.5S9.17 5.5 10 5.5s1.5.67 1.5 1.5S10.83 8.5 10 8.5z" fill="currentColor"/>
                    </svg>
                    <span style={{ fontWeight: 500, color: 'var(--gray-900)' }}>
                      {r.neighborhood.name}
                    </span>
                    {r.score < 0.7 && (
                      <span className="text-caption ml-auto" style={{ color: 'var(--gray-400)' }}>
                        similar
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Not found state */}
        {notFound && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-soft p-5 flex flex-col gap-4"
          >
            <p style={{ color: 'var(--gray-700)', fontWeight: 500 }}>
              Não encontramos o bairro &ldquo;{query}&rdquo;.
            </p>

            {suggestions.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-small" style={{ color: 'var(--gray-500)' }}>
                  Talvez você quis dizer:
                </p>
                <div className="flex flex-col gap-2">
                  {suggestions.map(s => (
                    <button
                      key={s.neighborhood.id}
                      onClick={() => handleSelect(s.neighborhood)}
                      className="flex items-center gap-2 text-left p-3 rounded-lg border border-gray-200 hover:border-red-500 hover:bg-red-50 transition-all"
                      style={{ color: 'var(--gray-900)' }}
                    >
                      <span>📍</span>
                      <span style={{ fontWeight: 500 }}>{s.neighborhood.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div 
              className="flex flex-col gap-2 pt-2"
              style={{ borderTop: '1px solid var(--gray-100)' }}
            >
              <button
                onClick={() => {
                  handleSelect({
                    id: 'custom-' + query,
                    name: query,
                    name_normalized: query,
                    latitude: null,
                    longitude: null,
                    city_id: city.id,
                    status: 'active'
                  })
                }}
                className="btn btn-primary"
                style={{ alignSelf: 'flex-start' }}
              >
                Usar bairro &ldquo;{query}&rdquo;
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
