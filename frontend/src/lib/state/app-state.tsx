"use client"

import { createContext, useContext, useReducer, useEffect, ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"

// Types
export interface User {
  id: string
  email: string
  name?: string
  role: "farmer" | "admin" | "technician"
  created_at: string
}

export interface Farm {
  id: string
  name: string
  user_id: string
  latitude: number
  longitude: number
  area: number
  created_at: string
}

export interface Field {
  id: string
  name: string
  farm_id: string
  area: number
  crop_type: string
  latitude: number
  longitude: number
  created_at: string
}

interface AppState {
  user: User | null
  farms: Farm[]
  fields: Field[]
  activeFarm: Farm | null
  activeField: Field | null
  isLoading: boolean
  error: string | null
}

type AppAction =
  | { type: "SET_USER"; payload: User | null }
  | { type: "SET_FARMS"; payload: Farm[] }
  | { type: "SET_FIELDS"; payload: Field[] }
  | { type: "SET_ACTIVE_FARM"; payload: Farm | null }
  | { type: "SET_ACTIVE_FIELD"; payload: Field | null }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "ADD_FARM"; payload: Farm }
  | { type: "UPDATE_FARM"; payload: { id: string; data: Partial<Farm> } }
  | { type: "DELETE_FARM"; payload: string }
  | { type: "ADD_FIELD"; payload: Field }
  | { type: "UPDATE_FIELD"; payload: { id: string; data: Partial<Field> } }
  | { type: "DELETE_FIELD"; payload: string }
  | { type: "RESET_STATE" }

// Initial state
const initialState: AppState = {
  user: null,
  farms: [],
  fields: [],
  activeFarm: null,
  activeField: null,
  isLoading: false,
  error: null
}

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload }
    
    case "SET_FARMS":
      return { ...state, farms: action.payload }
    
    case "SET_FIELDS":
      return { ...state, fields: action.payload }
    
    case "SET_ACTIVE_FARM":
      return { ...state, activeFarm: action.payload }
    
    case "SET_ACTIVE_FIELD":
      return { ...state, activeField: action.payload }
    
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }
    
    case "SET_ERROR":
      return { ...state, error: action.payload }
    
    case "ADD_FARM":
      return { ...state, farms: [...state.farms, action.payload] }
    
    case "UPDATE_FARM":
      return {
        ...state,
        farms: state.farms.map(farm =>
          farm.id === action.payload.id ? { ...farm, ...action.payload.data } : farm
        )
      }
    
    case "DELETE_FARM":
      return {
        ...state,
        farms: state.farms.filter(farm => farm.id !== action.payload),
        activeFarm: state.activeFarm?.id === action.payload ? null : state.activeFarm
      }
    
    case "ADD_FIELD":
      return { ...state, fields: [...state.fields, action.payload] }
    
    case "UPDATE_FIELD":
      return {
        ...state,
        fields: state.fields.map(field =>
          field.id === action.payload.id ? { ...field, ...action.payload.data } : field
        )
      }
    
    case "DELETE_FIELD":
      return {
        ...state,
        fields: state.fields.filter(field => field.id !== action.payload),
        activeField: state.activeField?.id === action.payload ? null : state.activeField
      }
    
    case "RESET_STATE":
      return initialState
    
    default:
      return state
  }
}

// Context
interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  // Actions
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loadUserData: () => Promise<void>
  createFarm: (farmData: Omit<Farm, "id" | "user_id" | "created_at">) => Promise<void>
  updateFarm: (id: string, data: Partial<Farm>) => Promise<void>
  deleteFarm: (id: string) => Promise<void>
  createField: (fieldData: Omit<Field, "id" | "created_at">) => Promise<void>
  updateField: (id: string, data: Partial<Field>) => Promise<void>
  deleteField: (id: string) => Promise<void>
  setActiveFarm: (farm: Farm | null) => void
  setActiveField: (field: Field | null) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// Provider
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  const supabase = createClient()

  // Login action
  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true })
      dispatch({ type: "SET_ERROR", payload: null })

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      if (data.user) {
        const userData: User = {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name || undefined,
          role: data.user.user_metadata?.role || "farmer",
          created_at: data.user.created_at
        }

        dispatch({ type: "SET_USER", payload: userData })
        await loadUserData()
      }
    } catch (error: any) {
      dispatch({ type: "SET_ERROR", payload: error.message })
      throw error
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

  // Logout action
  const logout = async () => {
    try {
      await supabase.auth.signOut()
      dispatch({ type: "RESET_STATE" })
    } catch (error: any) {
      console.error("Logout error:", error)
      dispatch({ type: "RESET_STATE" })
    }
  }

  // Load user data
  const loadUserData = async () => {
    if (!state.user) return

    try {
      dispatch({ type: "SET_LOADING", payload: true })

      // Load farms
      const { data: farms, error: farmsError } = await supabase
        .from("farms")
        .select("*")
        .eq("user_id", state.user.id)
        .order("created_at", { ascending: false })

      if (farmsError) throw farmsError

      dispatch({ type: "SET_FARMS", payload: farms || [] })

      // Load fields for all farms
      if (farms && farms.length > 0) {
        const farmIds = farms.map(farm => farm.id)
        const { data: fields, error: fieldsError } = await supabase
          .from("fields")
          .select("*")
          .in("farm_id", farmIds)
          .order("created_at", { ascending: false })

        if (fieldsError) throw fieldsError

        dispatch({ type: "SET_FIELDS", payload: fields || [] })
      }
    } catch (error: any) {
      console.error("Error loading user data:", error)
      dispatch({ type: "SET_ERROR", payload: error.message })
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

  // Create farm
  const createFarm = async (farmData: Omit<Farm, "id" | "user_id" | "created_at">) => {
    if (!state.user) throw new Error("User not authenticated")

    try {
      const { data, error } = await supabase
        .from("farms")
        .insert({
          ...farmData,
          user_id: state.user.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      dispatch({ type: "ADD_FARM", payload: data })
    } catch (error: any) {
      dispatch({ type: "SET_ERROR", payload: error.message })
      throw error
    }
  }

  // Update farm
  const updateFarm = async (id: string, data: Partial<Farm>) => {
    try {
      const { error } = await supabase
        .from("farms")
        .update(data)
        .eq("id", id)

      if (error) throw error

      dispatch({ type: "UPDATE_FARM", payload: { id, data } })
    } catch (error: any) {
      dispatch({ type: "SET_ERROR", payload: error.message })
      throw error
    }
  }

  // Delete farm
  const deleteFarm = async (id: string) => {
    try {
      const { error } = await supabase
        .from("farms")
        .delete()
        .eq("id", id)

      if (error) throw error

      dispatch({ type: "DELETE_FARM", payload: id })
    } catch (error: any) {
      dispatch({ type: "SET_ERROR", payload: error.message })
      throw error
    }
  }

  // Create field
  const createField = async (fieldData: Omit<Field, "id" | "created_at">) => {
    try {
      const { data, error } = await supabase
        .from("fields")
        .insert({
          ...fieldData,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      dispatch({ type: "ADD_FIELD", payload: data })
    } catch (error: any) {
      dispatch({ type: "SET_ERROR", payload: error.message })
      throw error
    }
  }

  // Update field
  const updateField = async (id: string, data: Partial<Field>) => {
    try {
      const { error } = await supabase
        .from("fields")
        .update(data)
        .eq("id", id)

      if (error) throw error

      dispatch({ type: "UPDATE_FIELD", payload: { id, data } })
    } catch (error: any) {
      dispatch({ type: "SET_ERROR", payload: error.message })
      throw error
    }
  }

  // Delete field
  const deleteField = async (id: string) => {
    try {
      const { error } = await supabase
        .from("fields")
        .delete()
        .eq("id", id)

      if (error) throw error

      dispatch({ type: "DELETE_FIELD", payload: id })
    } catch (error: any) {
      dispatch({ type: "SET_ERROR", payload: error.message })
      throw error
    }
  }

  // Set active farm
  const setActiveFarm = (farm: Farm | null) => {
    dispatch({ type: "SET_ACTIVE_FARM", payload: farm })
    // Clear active field when switching farms
    if (farm && state.activeField?.farm_id !== farm.id) {
      dispatch({ type: "SET_ACTIVE_FIELD", payload: null })
    }
  }

  // Set active field
  const setActiveField = (field: Field | null) => {
    dispatch({ type: "SET_ACTIVE_FIELD", payload: field })
  }

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          const userData: User = {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.name || undefined,
            role: session.user.user_metadata?.role || "farmer",
            created_at: session.user.created_at
          }

          dispatch({ type: "SET_USER", payload: userData })
          await loadUserData()
        }
      } catch (error: any) {
        console.error("Session check error:", error)
      }
    }

    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const userData: User = {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.name || undefined,
            role: session.user.user_metadata?.role || "farmer",
            created_at: session.user.created_at
          }

          dispatch({ type: "SET_USER", payload: userData })
          await loadUserData()
        } else if (event === 'SIGNED_OUT') {
          dispatch({ type: "RESET_STATE" })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const value: AppContextType = {
    state,
    dispatch,
    login,
    logout,
    loadUserData,
    createFarm,
    updateFarm,
    deleteFarm,
    createField,
    updateField,
    deleteField,
    setActiveFarm,
    setActiveField
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

// Hook
export function useAppState() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useAppState must be used within an AppStateProvider")
  }
  return context
}

// Selectors
export function useUser() {
  const { state } = useAppState()
  return state.user
}

export function useFarms() {
  const { state } = useAppState()
  return {
    farms: state.farms,
    activeFarm: state.activeFarm,
    setActiveFarm: (farm: Farm | null) => {
      const { setActiveFarm } = useAppState()
      setActiveFarm(farm)
    }
  }
}

export function useFields() {
  const { state } = useAppState()
  return {
    fields: state.fields.filter(field => 
      state.activeFarm ? field.farm_id === state.activeFarm.id : true
    ),
    activeField: state.activeField,
    setActiveField: (field: Field | null) => {
      const { setActiveField } = useAppState()
      setActiveField(field)
    }
  }
}

export function useAppStateLoading() {
  const { state } = useAppState()
  return state.isLoading
}

export function useAppStateError() {
  const { state, dispatch } = useAppState()
  
  const clearError = () => {
    dispatch({ type: "SET_ERROR", payload: null })
  }

  return {
    error: state.error,
    clearError
  }
}
