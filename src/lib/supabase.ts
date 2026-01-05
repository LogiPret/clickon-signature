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
  street_address: string
  city: string
  province: string
  postal_code: string
  acceptance_text: string
  accepted_contract: boolean
  pdf_url?: string
  ip_address?: string
  user_agent?: string
  signed_at: string
  created_at?: string
}

export async function uploadPdfToStorage(pdfBlob: Blob, fileName: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from('contract-pdfs')
      .upload(fileName, pdfBlob, {
        contentType: 'application/pdf',
        upsert: false
      })

    if (error) {
      console.error('Supabase storage error:', error)
      return { success: false, error: error.message }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('contract-pdfs')
      .getPublicUrl(data.path)

    return { success: true, url: publicUrl }
  } catch (err) {
    console.error('PDF upload error:', err)
    return { success: false, error: 'Une erreur est survenue lors du téléchargement du PDF.' }
  }
}

export async function submitSignature(signature: ContractSignature, pdfBlob?: Blob): Promise<{ success: boolean; pdfUrl?: string; error?: string }> {
  try {
    // Upload PDF first if provided
    let pdfUrl: string | undefined
    if (pdfBlob) {
      const fileName = `${signature.first_name}-${signature.last_name}-${Date.now()}.pdf`
      const uploadResult = await uploadPdfToStorage(pdfBlob, fileName)
      
      if (uploadResult.success && uploadResult.url) {
        pdfUrl = uploadResult.url
        signature.pdf_url = pdfUrl
      } else {
        console.error('PDF upload failed:', uploadResult.error)
        // Continue with submission even if PDF upload fails
      }
    }

    const { error } = await supabase
      .from('contract_signatures')
      .insert([signature])

    if (error) {
      console.error('Supabase error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, pdfUrl }
  } catch (err) {
    console.error('Submission error:', err)
    return { success: false, error: 'Une erreur est survenue lors de la soumission.' }
  }
}
