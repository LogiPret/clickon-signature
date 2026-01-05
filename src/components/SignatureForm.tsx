import { useState, useEffect } from 'react'
import { PDFViewer, PDFButton } from './PDFViewer'
import { submitSignature, type ContractSignature } from '../lib/supabase'
import { CheckCircle, AlertCircle, Loader2, Send } from 'lucide-react'

const PDF_URL = '/contract.pdf'

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  acceptanceText: string
  acceptedTerms: boolean
  acceptedContract: boolean
  acceptedDataProcessing: boolean
}

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  acceptanceText: '',
  acceptedTerms: false,
  acceptedContract: false,
  acceptedDataProcessing: false,
}

export function SignatureForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isPDFOpen, setIsPDFOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [ipAddress, setIpAddress] = useState<string>('')

  useEffect(() => {
    // Fetch user's IP address
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setIpAddress(data.ip))
      .catch(() => setIpAddress('unknown'))
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const isAcceptanceValid = formData.acceptanceText.trim().length > 0
  
  const isFormValid = 
    formData.firstName.trim() !== '' &&
    formData.lastName.trim() !== '' &&
    formData.email.trim() !== '' &&
    formData.phone.trim() !== '' &&
    isAcceptanceValid &&
    formData.acceptedTerms &&
    formData.acceptedContract &&
    formData.acceptedDataProcessing

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid) return

    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    const signature: ContractSignature = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      acceptance_text: formData.acceptanceText,
      accepted_terms: formData.acceptedTerms,
      accepted_contract: formData.acceptedContract,
      accepted_data_processing: formData.acceptedDataProcessing,
      ip_address: ipAddress,
      user_agent: navigator.userAgent,
      signed_at: new Date().toISOString(),
    }

    const result = await submitSignature(signature)

    setIsSubmitting(false)

    if (result.success) {
      setSubmitStatus('success')
    } else {
      setSubmitStatus('error')
      setErrorMessage(result.error || 'Une erreur est survenue.')
    }
  }

  if (submitStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Merci !</h2>
          <p className="text-gray-600">
            Votre signature a été enregistrée avec succès. Vous recevrez une confirmation par courriel.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Signature de contrat</h1>
          <p className="text-gray-600">
            Veuillez lire attentivement le contrat et remplir le formulaire ci-dessous pour valider votre accord.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* PDF Section */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Document contractuel
              </label>
              <PDFButton onClick={() => setIsPDFOpen(true)} />
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Vos informations
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Jean"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Dupont"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse courriel <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="jean.dupont@exemple.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro de téléphone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="514-555-0123"
                  required
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Consentements requis
              </h3>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="acceptedContract"
                  checked={formData.acceptedContract}
                  onChange={handleInputChange}
                  className="checkbox-input"
                  required
                />
                <span className="text-sm text-gray-700">
                  Je déclare avoir lu et compris l'intégralité du contrat présenté ci-dessus et j'accepte d'être lié(e) par ses termes et conditions. <span className="text-red-500">*</span>
                </span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="acceptedTerms"
                  checked={formData.acceptedTerms}
                  onChange={handleInputChange}
                  className="checkbox-input"
                  required
                />
                <span className="text-sm text-gray-700">
                  Je reconnais que cette signature électronique a la même valeur juridique qu'une signature manuscrite conformément à la Loi concernant le cadre juridique des technologies de l'information (LCCJTI). <span className="text-red-500">*</span>
                </span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="acceptedDataProcessing"
                  checked={formData.acceptedDataProcessing}
                  onChange={handleInputChange}
                  className="checkbox-input"
                  required
                />
                <span className="text-sm text-gray-700">
                  J'accepte que mes données personnelles soient collectées et traitées aux fins d'exécution du présent contrat, conformément à notre politique de confidentialité. <span className="text-red-500">*</span>
                </span>
              </label>
            </div>

            {/* Acceptance Text */}
            <div className="space-y-2">
              <label htmlFor="acceptanceText" className="block text-sm font-medium text-gray-700">
                Pour confirmer votre accord, veuillez inscrire votre nom complet ou « j'accepte » ci-dessous <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="acceptanceText"
                name="acceptanceText"
                value={formData.acceptanceText}
                onChange={handleInputChange}
                className={`input-field ${
                  isAcceptanceValid 
                    ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                    : ''
                }`}
                placeholder="Votre signature"
                required
              />
              {isAcceptanceValid && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Signature enregistree
                </p>
              )}
            </div>

            {/* Error Message */}
            {submitStatus === 'error' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Signer et envoyer
                </>
              )}
            </button>

            {/* Legal Note */}
            <p className="text-xs text-gray-500 text-center">
              En cliquant sur « Signer et envoyer », vous acceptez de signer électroniquement ce contrat. 
              Cette action est juridiquement contraignante.
            </p>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Besoin d'aide ? Contactez-nous à support@exemple.com
        </p>
      </div>

      {/* PDF Modal */}
      <PDFViewer
        pdfUrl={PDF_URL}
        isOpen={isPDFOpen}
        onClose={() => setIsPDFOpen(false)}
      />
    </div>
  )
}
