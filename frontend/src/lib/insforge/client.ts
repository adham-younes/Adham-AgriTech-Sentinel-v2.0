/**
 * InsForge Client Configuration
 * Replaces Supabase for authentication and database operations
 */

// Safe access to NEXT_PUBLIC_* env vars in client
const getPublicEnv = (key: string, fallback: string): string => {
  if (typeof window === 'undefined') {
    return process.env[key] || fallback
  }
  // Client-side: NEXT_PUBLIC_* vars are available
  return process.env[key] || fallback
}

const INSFORGE_API_KEY = getPublicEnv('NEXT_PUBLIC_INSFORGE_API_KEY', 'ik_5e82d1f87f888ec913ceae583539cb85')
const INSFORGE_BASE_URL = getPublicEnv('NEXT_PUBLIC_INSFORGE_BASE_URL', 'https://9y7cy56f.us-east.insforge.app')

export interface InsForgeUser {
  id: string
  email: string
  name?: string
  created_at: string
  metadata?: Record<string, any>
}

export interface InsForgeAuthResponse {
  user: InsForgeUser | null
  session: {
    access_token: string
    refresh_token: string
    expires_at: number
  } | null
  error?: string
}

class InsForgeClient {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey
    this.baseUrl = baseUrl
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      ...options.headers,
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(error.message || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('[InsForge] Request failed:', error)
      throw error
    }
  }

  // Authentication methods
  auth = {
    signInWithPassword: async (credentials: { email: string; password: string }): Promise<InsForgeAuthResponse> => {
      try {
        const data = await this.request('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify(credentials),
        })
        
        // Store session in localStorage
        if (typeof window !== 'undefined' && data.session) {
          localStorage.setItem('insforge_session', JSON.stringify(data.session))
        }

        return { user: data.user, session: data.session }
      } catch (error) {
        return { 
          user: null, 
          session: null, 
          error: error instanceof Error ? error.message : 'Login failed' 
        }
      }
    },

    signUp: async (credentials: { email: string; password: string; name?: string }): Promise<InsForgeAuthResponse> => {
      try {
        const data = await this.request('/api/auth/signup', {
          method: 'POST',
          body: JSON.stringify(credentials),
        })

        return { user: data.user, session: data.session }
      } catch (error) {
        return { 
          user: null, 
          session: null, 
          error: error instanceof Error ? error.message : 'Signup failed' 
        }
      }
    },

    signOut: async () => {
      try {
        await this.request('/api/auth/logout', {
          method: 'POST',
        })

        if (typeof window !== 'undefined') {
          localStorage.removeItem('insforge_session')
        }

        return { error: null }
      } catch (error) {
        return { error: error instanceof Error ? error.message : 'Logout failed' }
      }
    },

    getUser: async (): Promise<{ data: { user: InsForgeUser | null }, error: string | null }> => {
      try {
        if (typeof window === 'undefined') {
          return { data: { user: null }, error: null }
        }

        const sessionStr = localStorage.getItem('insforge_session')
        if (!sessionStr) {
          return { data: { user: null }, error: null }
        }

        const session = JSON.parse(sessionStr)
        const data = await this.request('/api/auth/user', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })

        return { data: { user: data.user }, error: null }
      } catch (error) {
        return { 
          data: { user: null }, 
          error: error instanceof Error ? error.message : 'Failed to get user' 
        }
      }
    },

    getSession: async () => {
      try {
        if (typeof window === 'undefined') {
          return { data: { session: null }, error: null }
        }

        const sessionStr = localStorage.getItem('insforge_session')
        if (!sessionStr) {
          return { data: { session: null }, error: null }
        }

        const session = JSON.parse(sessionStr)
        
        // Check if session is expired
        if (session.expires_at && Date.now() > session.expires_at) {
          localStorage.removeItem('insforge_session')
          return { data: { session: null }, error: 'Session expired' }
        }

        return { data: { session }, error: null }
      } catch (error) {
        return { 
          data: { session: null }, 
          error: error instanceof Error ? error.message : 'Failed to get session' 
        }
      }
    },
  }

  // Database methods (simplified)
  from(table: string) {
    return {
      select: async (columns = '*') => {
        try {
          const data = await this.request(`/api/db/${table}?select=${columns}`)
          return { data, error: null }
        } catch (error) {
          return { data: null, error: error instanceof Error ? error.message : 'Query failed' }
        }
      },

      insert: async (values: any) => {
        try {
          const data = await this.request(`/api/db/${table}`, {
            method: 'POST',
            body: JSON.stringify(values),
          })
          return { data, error: null }
        } catch (error) {
          return { data: null, error: error instanceof Error ? error.message : 'Insert failed' }
        }
      },

      update: async (values: any) => {
        try {
          const data = await this.request(`/api/db/${table}`, {
            method: 'PATCH',
            body: JSON.stringify(values),
          })
          return { data, error: null }
        } catch (error) {
          return { data: null, error: error instanceof Error ? error.message : 'Update failed' }
        }
      },

      delete: async () => {
        try {
          const data = await this.request(`/api/db/${table}`, {
            method: 'DELETE',
          })
          return { data, error: null }
        } catch (error) {
          return { data: null, error: error instanceof Error ? error.message : 'Delete failed' }
        }
      },
    }
  }
}

// Create singleton instance
export const createInsForgeClient = () => {
  return new InsForgeClient(INSFORGE_API_KEY, INSFORGE_BASE_URL)
}

// Browser client
export const insforge = createInsForgeClient()
