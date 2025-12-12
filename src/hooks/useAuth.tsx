import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'

const supabaseUrl = 'https://gontpzroqbbrvibsqbmk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvbnRwenJvcWJicnZpYnNxYm1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTY2ODMsImV4cCI6MjA4MTAzMjY4M30.h9UeBKoMALM5CyuEK9ZVm72bV02zX-DEuK3h4mWRU-E'

export const supabase = createClient(supabaseUrl, supabaseKey)

export const useAuth = () => {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      data.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return { user, loading, signIn, signUp, signOut }
}