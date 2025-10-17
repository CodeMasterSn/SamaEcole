import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ikwuxwlorkrtiirxqwph.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlrd3V4d2xvcmtydGlpcnhxd3BoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMzkwMTksImV4cCI6MjA3MzgxNTAxOX0.ctyUt8zRJH8keXAvW64aUiB0JRFm0y8cbXn88uOlnY0'

// Vérification des variables d'environnement
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variables d\'environnement Supabase manquantes')
}

// Client principal pour l'application
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'sama-ecole-auth',
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Types pour TypeScript (seront générés automatiquement plus tard)
export type Database = {
  public: {
    Tables: {
      // Tables seront ajoutées après création dans Supabase
    }
  }
}