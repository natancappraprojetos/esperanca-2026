'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { trackEvent } from '@/lib/tracking/events'
import type { City, Campaign } from '@/types/database'
import type { FunnelData } from '../FunnelPage'

interface CityStepProps {
  campaign: Campaign
  onSelect: (city: City) => void
  data: FunnelData
}

export default function CityStep({ campaign, onSelect, data }: CityStepProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<City[]>([])
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const [locating, setLocating] = useState(false)

  useEffect(() => {
    trackEvent('LeadFormViewed', { 
      campaign_id: campaign.id,
      step: 'city',
      session_token: data.sessionToken,
    })
    inputRef.current?.focus()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const searchCities = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/cities/search?q=${encodeURIComponent(q)}&campaign_id=${campaign.id}`)
      const json = await res.json()
      setResults(json.cities || [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [campaign.id])

  async function handleUseLocation() {
    setErrorMsg(null)
    if (!navigator.geolocation) {
      setErrorMsg('Seu navegador não suporta geolocalização.')
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
          const data = await res.json()
          
          const cityName = data.address?.city || data.address?.town || data.address?.village || data.address?.municipality
          if (cityName) {
            setQuery(cityName)
            searchCities(cityName)
          } else {
            setErrorMsg('Não foi possível identificar sua cidade automaticamente.')
          }
        } catch (error) {
          console.error(error)
          setErrorMsg('Erro ao buscar localização.')
        } finally {
          setLocating(false)
        }
      },
      (error) => {
        console.error(error)
        setLocating(false)
        if (error.code === error.PERMISSION_DENIED) {
          setErrorMsg('Localização bloqueada pelo navegador. Libere o acesso nas configurações ou digite acima.')
        } else {
          setErrorMsg('Não foi possível obter sua localização. Por favor, tente digitar a cidade.')
        }
      },
      { timeout: 10000 }
    )
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    setHighlightedIndex(-1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchCities(val), 250)
  }

  function handleSelect(city: City) {
    trackEvent('CitySelected', {
      campaign_id: campaign.id,
      city_id: city.id,
      city_name: city.name,
      session_token: data.sessionToken,
    })
    onSelect(city)
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
      handleSelect(results[highlightedIndex])
    } else if (e.key === 'Escape') {
      setResults([])
      setFocused(false)
    }
  }

  const showDropdown = focused && (results.length > 0 || (query.length >= 2 && !loading))

  return (
    <div className="min-h-svh flex flex-col items-center" style={{ paddingTop: '5rem' }}>
      <div 
        className="container-narrow w-full flex flex-col gap-8 md:gap-10 mt-4 md:mt-12 bg-white/95 backdrop-blur-2xl border border-gray-100 px-6 sm:px-12 rounded-[32px] shadow-2xl"
        style={{ paddingTop: '2.5rem', paddingBottom: '2.5rem' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-3 text-center"
        >
          <h2 className="text-heading-2" style={{ color: 'var(--gray-900)' }}>
            Em qual cidade você está?
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="relative"
        >
          <div className="form-group">
            <label htmlFor="city-search" className="form-label sr-only">
              Nome da cidade
            </label>
            <div className="relative z-20">
              <input
                id="city-search"
                ref={inputRef}
                type="text"
                className="form-input"
                placeholder="Digite o nome da sua cidade..."
                value={query}
                onChange={handleInput}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 150)}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                spellCheck={false}
                aria-autocomplete="list"
                aria-controls="city-results"
                aria-expanded={showDropdown}
                style={{ 
                  paddingLeft: '3rem', 
                  fontSize: '1.0625rem',
                  borderColor: focused ? 'var(--gray-400)' : 'var(--gray-200)',
                  boxShadow: 'none',
                  outline: 'none'
                }}
              />
              {/* Search icon */}
              <div 
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              >
                {loading ? (
                  <div className="spinner" style={{ width: 18, height: 18 }} />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style={{ color: 'var(--gray-400)' }}>
                    <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2"/>
                    <path d="M14 14l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                )}
              </div>

              {/* Dropdown */}
              {showDropdown && (
                <div 
                  id="city-results"
                  className="autocomplete-dropdown absolute left-0 right-0 top-full mt-1"
                  role="listbox"
                  aria-label="Cidades encontradas"
                >
                  {results.length > 0 ? (
                    results.map((city, i) => (
                      <button
                        key={city.id}
                        role="option"
                        aria-selected={i === highlightedIndex}
                        className={`autocomplete-item w-full text-left ${i === highlightedIndex ? 'highlighted' : ''}`}
                        onMouseEnter={() => setHighlightedIndex(i)}
                        onMouseDown={() => handleSelect(city)}
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ color: 'var(--gray-400)', flexShrink: 0 }}>
                          <path d="M10 2C7.24 2 5 4.24 5 7c0 4.25 5 11 5 11s5-6.75 5-11c0-2.76-2.24-5-5-5zm0 6.5c-.83 0-1.5-.67-1.5-1.5S9.17 5.5 10 5.5s1.5.67 1.5 1.5S10.83 8.5 10 8.5z" fill="currentColor"/>
                        </svg>
                        <div className="flex flex-col">
                          <span style={{ fontWeight: 500, color: 'var(--gray-900)' }}>{city.name}</span>
                          <span className="text-caption" style={{ color: 'var(--gray-400)' }}>
                            Rio Grande do Sul
                          </span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="autocomplete-item" style={{ cursor: 'default' }}>
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ color: 'var(--gray-300)' }}>
                        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2"/>
                        <path d="M10 7v3m0 3h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <span style={{ color: 'var(--gray-500)' }}>
                        Nenhuma cidade encontrada para &ldquo;{query}&rdquo;
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Location Button */}
            <div className="flex items-center gap-4 my-2 relative z-10">
              <div style={{ flex: 1, height: 1, backgroundColor: 'var(--gray-200)' }} />
              <span className="text-caption" style={{ color: 'var(--gray-400)', textTransform: 'uppercase' }}>ou</span>
              <div style={{ flex: 1, height: 1, backgroundColor: 'var(--gray-200)' }} />
            </div>

            <button
              type="button"
              onClick={handleUseLocation}
              disabled={locating}
              className="btn btn-secondary w-full flex items-center justify-center gap-2 relative z-10"
              style={{ 
                padding: '0.875rem', 
                fontSize: '0.9375rem', 
                color: 'var(--gray-700)',
                borderRadius: 'var(--radius-md)' // Match the input border radius
              }}
            >
              {locating ? (
                <div className="spinner" style={{ width: 18, height: 18, borderTopColor: 'var(--gray-700)' }} />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              )}
              <span>{locating ? 'Buscando sua localização...' : 'Usar minha localização atual'}</span>
            </button>
          </div>
        </motion.div>

        {/* Suggestion note */}
      </div>
    </div>
  )
}
