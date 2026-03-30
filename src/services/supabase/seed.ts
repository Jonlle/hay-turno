import { getSupabaseBrowserClient } from './client';

const DEMO_ADMIN_EMAIL = 'admin@demo.com';
const DEMO_ADMIN_PASSWORD = 'demo1234';

let seeded = false;

/**
 * Seed demo environment for development.
 * 1. Checks for existing developer session (skips if logged in)
 * 2. Tries sign-in first (user exists? → get ID)
 * 3. If not, signs up (creates user)
 * 4. Calls seed_demo_admin RPC to create profile + membership
 *
 * Only runs in dev mode. Idempotent.
 */
export async function seedDemoEnvironment(): Promise<void> {
  if (!import.meta.env.DEV || seeded) return;

  const supabase = getSupabaseBrowserClient();

  // Don't disrupt an existing developer session
  const { data: existingSession } = await supabase.auth.getSession();
  if (existingSession?.session) {
    console.log('[seed] Active session found, skipping seed.');
    seeded = true;
    return;
  }

  console.log('[seed] Checking demo environment...');

  let userId: string | undefined;

  // 1. Try sign-in first (check if user exists)
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: DEMO_ADMIN_EMAIL,
    password: DEMO_ADMIN_PASSWORD,
  });

  if (signInData?.user) {
    // User exists
    userId = signInData.user.id;
    await supabase.auth.signOut();
    console.log('[seed] Admin user exists.');
  } else if (signInError?.code === 'invalid_credentials') {
    // User doesn't exist — create it
    console.log('[seed] Creating admin user...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: DEMO_ADMIN_EMAIL,
      password: DEMO_ADMIN_PASSWORD,
    });

    if (signUpError || !signUpData.user) {
      console.error('[seed] Sign up failed:', signUpError?.message);
      return;
    }

    userId = signUpData.user.id;
    await supabase.auth.signOut();
  } else {
    console.error('[seed] Unexpected auth error:', signInError?.code, signInError?.message);
    return;
  }

  if (!userId) {
    console.error('[seed] Could not resolve admin user ID.');
    return;
  }

  // 2. Create profile + membership via RPC
  const { error: rpcError } = await (supabase as any).rpc('seed_demo_admin', {
    admin_user_id: userId,
  });

  if (rpcError) {
    console.error('[seed] RPC failed:', rpcError.message);
    return;
  }

  console.log('[seed] Demo environment ready:', {
    email: DEMO_ADMIN_EMAIL,
    password: DEMO_ADMIN_PASSWORD,
    barbershop: 'demo',
  });

  // Only mark as seeded after success (allows retry on failure)
  seeded = true;
}
