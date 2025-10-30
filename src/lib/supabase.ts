import { createBrowserClient } from '@supabase/ssr'

// Client principal pour l'application (côté navigateur)
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Types pour TypeScript (seront générés automatiquement plus tard)
export type Database = {
  public: {
    Tables: {
      // Tables seront ajoutées après création dans Supabase
    }
  }
}