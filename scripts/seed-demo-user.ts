import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const demoEmail = process.env.DEMO_USER_EMAIL
const demoPassword = process.env.DEMO_USER_PASSWORD
const demoFullName = process.env.DEMO_USER_FULL_NAME ?? "Demo Farmer"
const demoRole = process.env.DEMO_USER_ROLE ?? "demo"

async function main() {
  if (!supabaseUrl || !serviceKey) {
    console.error("[seed-demo-user] Missing Supabase configuration.")
    process.exit(1)
  }
  if (!demoEmail || !demoPassword) {
    console.error("[seed-demo-user] DEMO_USER_EMAIL and DEMO_USER_PASSWORD are required.")
    process.exit(1)
  }

  const admin = createClient(supabaseUrl, serviceKey)
  console.info("[seed-demo-user] Ensuring demo user exists", { demoEmail })

  const { data: users, error: fetchError } = await admin.auth.admin.listUsers()
  if (fetchError) {
    console.error("[seed-demo-user] Failed to list users", fetchError)
    process.exit(1)
  }

  const existingUser = users.users.find((u) => u.email === demoEmail)

  if (existingUser) {
    console.info("[seed-demo-user] Updating existing demo account", { userId: existingUser.id })
    const { error: updateError } = await admin.auth.admin.updateUserById(existingUser.id, {
      password: demoPassword,
      user_metadata: {
        full_name: demoFullName,
        role: demoRole,
      },
    })
    if (updateError) {
      console.error("[seed-demo-user] Unable to update demo user", updateError)
      process.exit(1)
    }
    console.info("[seed-demo-user] Demo user updated successfully.")
    return
  }

  const { error: createError } = await admin.auth.admin.createUser({
    email: demoEmail,
    password: demoPassword,
    email_confirm: true,
    user_metadata: {
      full_name: demoFullName,
      role: demoRole,
    },
  })

  if (createError) {
    console.error("[seed-demo-user] Unable to create demo user", createError)
    process.exit(1)
  }

  console.info("[seed-demo-user] Demo user created successfully.")
}

main().catch((error) => {
  console.error("[seed-demo-user] Unexpected failure", error)
  process.exit(1)
})
