'use client'

import React, { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, ChevronDown, X, XCircle } from 'lucide-react'
import Image from 'next/image'
import { searchGyms } from '@/lib/actions/public-gym'
import { motion, AnimatePresence } from 'framer-motion'

interface GymResult {
    id: string
    name: string
    slug: string
    city: string | null
    state: string | null
    logo_url: string | null
}

interface GymSwitcherProps {
    currentGymName: string
    currentGymSlug: string
}

export default function GymSwitcher({ currentGymName, currentGymSlug }: GymSwitcherProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<GymResult[]>([])
    const [loading, setLoading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Close on Escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false)
        }
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [])

    // Prevent scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
    }, [isOpen])

    // Load initial gyms when popup opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100)
            loadGyms('')
        }
    }, [isOpen])

    const loadGyms = async (q: string) => {
        setLoading(true)
        const { gyms } = await searchGyms(q || undefined)
        setResults(gyms as GymResult[])
        setLoading(false)
    }

    const handleSearch = (value: string) => {
        setQuery(value)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => loadGyms(value), 300)
    }

    const handleSelect = (slug: string) => {
        if (slug === currentGymSlug) {
            setIsOpen(false)
            return
        }

        startTransition(() => {
            setIsOpen(false)
            setQuery('')
            router.push(`/${slug}`)
        })
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-1.5 font-semibold text-foreground hover:text-primary transition-colors group px-2 py-1 rounded-md hover:bg-primary/5"
            >
                {currentGymName}
                <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-background/40 backdrop-blur-md shadow-2xl"
                        />

                        {/* Popup Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-border flex items-center justify-between">
                                <h2 className="text-lg font-bold">Select a Gym</h2>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                                >
                                    <XCircle className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Search */}
                            <div className="p-4 border-b border-border bg-muted/30">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        placeholder="Search by gym name or city..."
                                        value={query}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        className="w-full h-12 pl-12 pr-10 bg-background border-2 border-border/50 rounded-xl text-base placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                                    />
                                    {query && (
                                        <button
                                            onClick={() => { setQuery(''); loadGyms('') }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Results */}
                            <div className="max-h-[50vh] overflow-y-auto p-2 space-y-1">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                        <p className="text-sm text-muted-foreground">Searching gyms...</p>
                                    </div>
                                ) : results.length === 0 ? (
                                    <div className="py-12 text-center space-y-2">
                                        <p className="text-lg font-medium text-foreground">No gyms found</p>
                                        <p className="text-sm text-muted-foreground">
                                            Try searching with a different name or city
                                        </p>
                                    </div>
                                ) : (
                                    results.map((gym) => {
                                        const isCurrent = gym.slug === currentGymSlug
                                        const location = [gym.city, gym.state].filter(Boolean).join(', ')
                                        return (
                                            <button
                                                key={gym.id}
                                                onClick={() => handleSelect(gym.slug)}
                                                className={`w-full flex items-center gap-4 px-4 py-3 text-left rounded-xl transition-all group ${isCurrent ? 'bg-primary/5 ring-1 ring-primary/20' : 'hover:bg-muted'}`}
                                            >
                                                <div className="relative h-12 w-12 rounded-xl overflow-hidden flex-shrink-0 bg-muted border border-border/50 group-hover:scale-105 transition-transform shadow-sm">
                                                    {gym.logo_url ? (
                                                        <Image src={gym.logo_url} alt={gym.name} fill className="object-cover" />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-sm font-bold text-primary bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                                            {gym.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className={`font-semibold truncate ${isCurrent ? 'text-primary' : 'text-foreground'}`}>
                                                            {gym.name}
                                                        </p>
                                                        {isCurrent && (
                                                            <span className="text-[10px] uppercase tracking-wider text-primary font-bold px-1.5 py-0.5 bg-primary/10 rounded">
                                                                Current
                                                            </span>
                                                        )}
                                                    </div>
                                                    {location && (
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                                                            {location}
                                                        </p>
                                                    )}
                                                </div>
                                                <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary -rotate-90 hidden sm:block opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                                            </button>
                                        )
                                    })
                                )}
                            </div>

                            {/* Footer */}
                            {!loading && results.length > 0 && (
                                <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-center text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                                    Browse gyms by name or city
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    )
}

