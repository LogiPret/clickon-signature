import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

export interface ContractSignature {
  id?: string
  first_name: string
  last_name: string
  email: string
  phone: string
  acceptance_text: string
  accepted_terms: boolean
  accepted_contract: boolean
  accepted_data_processing: boolean
  ip_address?: string
  user_agent?: string
  signed_at: string
  created_at?: string
}

export async function submitSignature(signature: ContractSignature): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('contract_signatures')
      .insert([signature])

    if (error) {
      console.error('Supabase error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Submission error:', err)
    return { success: false, error: 'Une erreur est survenue lors de la soumission.' }
  }
}
