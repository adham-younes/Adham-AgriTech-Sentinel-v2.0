import type { SupabaseClient, User } from "@supabase/supabase-js"

type ProfileRow = {
  id: string
  email?: string | null
  full_name?: string | null
  role?: string | null
  language?: string | null
  [key: string]: unknown
}

const DEFAULT_PROFILE: ProfileRow = {
  id: "00000000-0000-4000-8000-00000000DEMO",
  email: "demo@adham-agritech.com",
  full_name: "مزارع العرض التجريبي",
  role: "farmer",
  language: "ar",
}

function buildProfileFromUser(user: User): ProfileRow {
  return {
    id: user.id,
    email: user.email ?? DEFAULT_PROFILE.email,
    full_name: (user.user_metadata?.full_name as string) ?? DEFAULT_PROFILE.full_name,
    role: (user.user_metadata?.role as string) ?? DEFAULT_PROFILE.role,
    language: DEFAULT_PROFILE.language,
  }
}

function buildUserFromProfile(profile: ProfileRow): Partial<User> {
  return {
    id: profile.id,
    email: profile.email ?? DEFAULT_PROFILE.email ?? undefined,
    app_metadata: { provider: "demo" },
    user_metadata: {
      full_name: profile.full_name ?? DEFAULT_PROFILE.full_name,
      role: profile.role ?? DEFAULT_PROFILE.role,
    },
    aud: "authenticated",
  }
}

export async function resolveActiveProfile(
  supabase: SupabaseClient,
): Promise<{ user: Partial<User>; profile: ProfileRow }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user?.id) {
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()

    if (existingProfile) {
      return { user, profile: existingProfile as ProfileRow }
    }

    return { user, profile: buildProfileFromUser(user) }
  }

  const { data: fallbackProfile } = await supabase
    .from("profiles")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (fallbackProfile) {
    return {
      user: buildUserFromProfile(fallbackProfile as ProfileRow),
      profile: fallbackProfile as ProfileRow,
    }
  }

  return {
    user: buildUserFromProfile(DEFAULT_PROFILE),
    profile: DEFAULT_PROFILE,
  }
}
