'use client'

import { supabase } from '@/lib/supabase'

export default function Home() {

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    })
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <button
        onClick={handleGoogleLogin}
        className="bg-black text-white px-6 py-3 rounded-xl"
      >
        Entrar com Google
      </button>
    </div>
  )
}