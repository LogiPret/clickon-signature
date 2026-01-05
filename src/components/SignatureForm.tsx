import { useState, useEffect } from 'react'
import { PDFViewer } from './PDFViewer'
import { submitSignature, type ContractSignature } from '../lib/supabase'
import { CheckCircle, AlertCircle, Loader2, Send } from 'lucide-react'

const PDF_URL = '/contract.pdf'

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  streetAddress: string
  city: string
  province: string
  postalCode: string
  acceptanceText: string
  acceptedContract: boolean
}

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  streetAddress: '',
  city: '',
  province: '',
  postalCode: '',
  acceptanceText: '',
  acceptedContract: false,
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement
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
    formData.streetAddress.trim() !== '' &&
    formData.city.trim() !== '' &&
    formData.province.trim() !== '' &&
    formData.postalCode.trim() !== '' &&
    isAcceptanceValid &&
    formData.acceptedContract

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
      street_address: formData.streetAddress,
      city: formData.city,
      province: formData.province,
      postal_code: formData.postalCode,
      acceptance_text: formData.acceptanceText,
      accepted_contract: formData.acceptedContract,
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

  useEffect(() => {
    if (submitStatus === 'success') {
      const timer = setTimeout(() => {
        window.location.href = 'https://app.clickon.it.com/Account/SignIn?ReturnUrl=%2F'
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [submitStatus])

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
          <p className="text-sm text-gray-500 mt-4">
            Vous serez redirigé automatiquement dans 5 secondes...
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

              <div>
                <label htmlFor="streetAddress" className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="streetAddress"
                  name="streetAddress"
                  value={formData.streetAddress}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="123 rue Principale"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    Ville <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Montréal"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">
                    Province <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="province"
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Alberta">Alberta</option>
                    <option value="Colombie-Britannique">Colombie-Britannique</option>
                    <option value="Île-du-Prince-Édouard">Île-du-Prince-Édouard</option>
                    <option value="Manitoba">Manitoba</option>
                    <option value="Nouveau-Brunswick">Nouveau-Brunswick</option>
                    <option value="Nouvelle-Écosse">Nouvelle-Écosse</option>
                    <option value="Ontario">Ontario</option>
                    <option value="Québec">Québec</option>
                    <option value="Saskatchewan">Saskatchewan</option>
                    <option value="Terre-Neuve-et-Labrador">Terre-Neuve-et-Labrador</option>
                    <option value="Nunavut">Nunavut</option>
                    <option value="Territoires du Nord-Ouest">Territoires du Nord-Ouest</option>
                    <option value="Yukon">Yukon</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                    Code postal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="H2X 1Y4"
                    required
                  />
                </div>
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
                  En cochant cette case, j'accepte l'{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsPDFOpen(true)
                    }}
                    className="text-primary-600 hover:text-primary-800 underline font-medium hover:pointer"
                  >
                  entente de service
                  </button>
                  . <span className="text-red-500">*</span>
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
