/**
 * Farm Context
 * 
 * React Context for managing farm and field state across the application.
 * Provides centralized state management for farms and fields.
 * 
 * @module contexts/farm-context
 * 
 * @example
 * ```tsx
 * <FarmProvider userId={user.id}>
 *   <YourComponent />
 * </FarmProvider>
 * 
 * // In component:
 * const { farms, selectedFarm, refreshFarms } = useFarmContext()
 * ```
 * 
 * @author Adham AgriTech
 * @since 1.0.0
 */

'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FarmService } from '@/lib/services/core/farm-service'
import type { Farm } from '@/lib/services/core/farm-service'

// ============================================================================
// Types
// ============================================================================

interface FarmContextValue {
  farms: Farm[]
  selectedFarm: Farm | null
  loading: boolean
  error: Error | null
  setSelectedFarm: (farm: Farm | null) => void
  refreshFarms: () => Promise<void>
  getFarmById: (farmId: string) => Farm | null
}

// ============================================================================
// Context
// ============================================================================

const FarmContext = createContext<FarmContextValue | undefined>(undefined)

// ============================================================================
// Provider Component
// ============================================================================

interface FarmProviderProps {
  children: React.ReactNode
  userId?: string
}

export function FarmProvider({ children, userId }: FarmProviderProps) {
  const [farms, setFarms] = useState<Farm[]>([])
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = useMemo(() => createClient(), [])
  const farmService = useMemo(() => new FarmService(supabase), [supabase])

  /**
   * Fetch farms for the current user
   */
  const refreshFarms = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const userFarms = await farmService.getFarmsForUser(userId)
      setFarms(userFarms)
      
      // If no farm is selected and we have farms, select the first one
      if (!selectedFarm && userFarms.length > 0) {
        setSelectedFarm(userFarms[0])
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch farms')
      setError(error)
      console.error('[FarmContext] Error fetching farms:', error)
    } finally {
      setLoading(false)
    }
  }, [userId, farmService, selectedFarm])

  /**
   * Get farm by ID
   */
  const getFarmById = useCallback((farmId: string): Farm | null => {
    return farms.find(farm => farm.id === farmId) || null
  }, [farms])

  /**
   * Set selected farm
   */
  const handleSetSelectedFarm = useCallback((farm: Farm | null) => {
    setSelectedFarm(farm)
  }, [])

  // Fetch farms on mount and when userId changes
  useEffect(() => {
    refreshFarms()
  }, [refreshFarms])

  const value: FarmContextValue = useMemo(
    () => ({
      farms,
      selectedFarm,
      loading,
      error,
      setSelectedFarm: handleSetSelectedFarm,
      refreshFarms,
      getFarmById,
    }),
    [farms, selectedFarm, loading, error, handleSetSelectedFarm, refreshFarms, getFarmById]
  )

  return <FarmContext.Provider value={value}>{children}</FarmContext.Provider>
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access farm context
 * 
 * @throws {Error} If used outside FarmProvider
 */
export function useFarmContext(): FarmContextValue {
  const context = useContext(FarmContext)
  if (context === undefined) {
    throw new Error('useFarmContext must be used within a FarmProvider')
  }
  return context
}

