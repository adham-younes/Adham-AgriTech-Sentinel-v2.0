/**
 * Vercel API Manager
 * 
 * Script to manage Vercel deployments and environment variables via API
 * Usage: npx tsx scripts/vercel-api-manager.ts
 */

import { config } from "dotenv"

config()

const VERCEL_API_TOKEN = process.env.VERCEL_TOKEN || process.env.VERCEL_API_TOKEN
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID || "prj_adham-agritech"

const VERCEL_API_BASE = "https://api.vercel.com"

interface VercelEnvVar {
  type: "system" | "secret" | "encrypted"
  id: string
  key: string
  value?: string
  target?: ("production" | "preview" | "development")[]
  gitBranch?: string
  configurationId?: string | null
  updatedAt?: number
  createdAt?: number
}

interface VercelDeployment {
  uid: string
  name: string
  url: string
  state: "BUILDING" | "ERROR" | "INITIALIZING" | "QUEUED" | "READY" | "CANCELED"
  createdAt: number
  buildingAt?: number
  readyAt?: number
}

class VercelAPIManager {
  private token: string
  private teamId?: string
  private projectId: string

  constructor(token: string, projectId: string, teamId?: string) {
    this.token = token
    this.projectId = projectId
    this.teamId = teamId
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${VERCEL_API_BASE}${endpoint}${this.teamId ? `?teamId=${this.teamId}` : ""}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Vercel API Error: ${response.status} ${error}`)
    }

    return response.json()
  }

  /**
   * List all environment variables
   */
  async listEnvVars(): Promise<{ envs: VercelEnvVar[] }> {
    return this.request<{ envs: VercelEnvVar[] }>(
      `/v10/projects/${this.projectId}/env`
    )
  }

  /**
   * Add or update environment variable
   */
  async setEnvVar(
    key: string,
    value: string,
    targets: ("production" | "preview" | "development")[] = ["production", "preview"]
  ): Promise<VercelEnvVar> {
    // Check if exists
    const { envs } = await this.listEnvVars()
    const existing = envs.find((e) => e.key === key)

    if (existing) {
      // Update existing
      return this.request<VercelEnvVar>(
        `/v10/projects/${this.projectId}/env/${existing.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            value,
            target: targets,
          }),
        }
      )
    } else {
      // Create new
      return this.request<VercelEnvVar>(
        `/v10/projects/${this.projectId}/env`,
        {
          method: "POST",
          body: JSON.stringify({
            key,
            value,
            target: targets,
            type: key.startsWith("NEXT_PUBLIC_") ? "plain" : "encrypted",
          }),
        }
      )
    }
  }

  /**
   * Create a new deployment
   */
  async createDeployment(
    gitRef: string = "main",
    force: boolean = false
  ): Promise<VercelDeployment> {
    return this.request<VercelDeployment>(
      `/v13/deployments`,
      {
        method: "POST",
        body: JSON.stringify({
          name: this.projectId,
          project: this.projectId,
          gitSource: {
            type: "github",
            repo: "adhamlouxors-projects/adham-agritech",
            ref: gitRef,
          },
          target: "production",
          force,
        }),
      }
    )
  }

  /**
   * List recent deployments
   */
  async listDeployments(limit: number = 10): Promise<{ deployments: VercelDeployment[] }> {
    return this.request<{ deployments: VercelDeployment[] }>(
      `/v6/deployments?projectId=${this.projectId}&limit=${limit}`
    )
  }

  /**
   * Redeploy latest deployment
   */
  async redeploy(deploymentId: string): Promise<VercelDeployment> {
    return this.request<VercelDeployment>(
      `/v13/deployments/${deploymentId}`,
      {
        method: "POST",
        body: JSON.stringify({
          target: "production",
        }),
      }
    )
  }

  /**
   * Get deployment logs
   */
  async getDeploymentLogs(deploymentId: string): Promise<any> {
    return this.request(
      `/v2/deployments/${deploymentId}/events`
    )
  }
}

// Main execution
async function main() {
  if (!VERCEL_API_TOKEN) {
    console.error("❌ VERCEL_TOKEN or VERCEL_API_TOKEN not found in environment")
    console.log("\n📝 To get your Vercel token:")
    console.log("   1. Go to https://vercel.com/account/tokens")
    console.log("   2. Create a new token")
    console.log("   3. Add it to .env: VERCEL_TOKEN=your_token_here")
    process.exit(1)
  }

  const manager = new VercelAPIManager(
    VERCEL_API_TOKEN,
    VERCEL_PROJECT_ID,
    VERCEL_TEAM_ID
  )

  try {
    console.log("🔍 Checking Vercel environment variables...\n")

    // List current env vars
    const { envs } = await manager.listEnvVars()
    console.log(`📦 Found ${envs.length} environment variables:\n`)
    
    envs.forEach((env) => {
      console.log(`  ${env.key}: ${env.target?.join(", ") || "N/A"}`)
    })

    // Check for required variables
    const required = [
      "GOOGLE_AI_API_KEY",
      "EOSDA_API_KEY",
      "NEXT_PUBLIC_EOSDA_API_KEY",
      "NEXT_PUBLIC_EOSDA_API_URL",
      "NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN",
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ]

    console.log("\n✅ Required variables check:\n")
    const missing = required.filter(
      (key) => !envs.some((e) => e.key === key)
    )

    if (missing.length > 0) {
      console.log(`⚠️  Missing variables: ${missing.join(", ")}`)
      console.log("\n💡 To add missing variables, use:")
      console.log(`   manager.setEnvVar("KEY", "value", ["production", "preview"])`)
    } else {
      console.log("✅ All required variables are present!")
    }

    // List recent deployments
    console.log("\n🚀 Recent deployments:\n")
    const { deployments } = await manager.listDeployments(5)
    deployments.forEach((deployment) => {
      const date = new Date(deployment.createdAt).toLocaleString()
      console.log(
        `  ${deployment.state.padEnd(12)} ${deployment.url.padEnd(40)} ${date}`
      )
    })

    console.log("\n✅ Vercel API connection successful!")
  } catch (error) {
    console.error("❌ Error:", error)
    process.exit(1)
  }
}

// Run if executed directly
if (require.main === module) {
  main()
}

export { VercelAPIManager }

