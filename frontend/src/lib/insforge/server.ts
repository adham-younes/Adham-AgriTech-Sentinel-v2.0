/**
 * InsForge Server Client
 * For server-side operations with cookies support
 */

import { cookies } from 'next/headers'

const INSFORGE_API_KEY = process.env.INSFORGE_API_KEY || process.env.NEXT_PUBLIC_INSFORGE_API_KEY || 'ik_5e82d1f87f888ec913ceae583539cb85'
const INSFORGE_BASE_URL = process.env.INSFORGE_BASE_URL || process.env.NEXT_PUBLIC_INSFORGE_BASE_URL || 'https://9y7cy56f.us-east.insforge.app'

export async function createServerInsForgeClient() {
  const cookieStore = await cookies()
  
  const sessionCookie = cookieStore.get('insforge_session')
  const session = sessionCookie ? JSON.parse(sessionCookie.value) : null

  const request = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${INSFORGE_BASE_URL}${endpoint}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${INSFORGE_API_KEY}`,
      ...((options.headers as Record<string, string>) || {}),
    }

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
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
      console.error('[InsForge Server] Request failed:', error)
      throw error
    }
  }

  return {
    auth: {
      getUser: async () => {
        try {
          if (!session) {
            return { data: { user: null }, error: null }
          }

          const data = await request('/api/auth/user')
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
          if (!session) {
            return { data: { session: null }, error: null }
          }

          // Check if session is expired
          if (session.expires_at && Date.now() > session.expires_at) {
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
    },

    from(table: string) {
      return {
        select: async (columns = '*') => {
          try {
            const data = await request(`/api/db/${table}?select=${columns}`)
            return { data, error: null }
          } catch (error) {
            return { data: null, error: error instanceof Error ? error.message : 'Query failed' }
          }
        },

        insert: async (values: any) => {
          try {
            const data = await request(`/api/db/${table}`, {
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
            const data = await request(`/api/db/${table}`, {
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
            const data = await request(`/api/db/${table}`, {
              method: 'DELETE',
            })
            return { data, error: null }
          } catch (error) {
            return { data: null, error: error instanceof Error ? error.message : 'Delete failed' }
          }
        },
      }
    },
  }
}
