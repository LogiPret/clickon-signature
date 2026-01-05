import { useState, useEffect, useRef } from 'react'
import { PDFViewer } from './PDFViewer'
import { submitSignature, type ContractSignature } from '../lib/supabase'
import { fillPdfFormFields } from '../lib/pdfFiller'
import { CheckCircle, AlertCircle, Loader2, Send } from 'lucide-react'

const PDF_URL = '/contrat-template.pdf'
const N8N_WEBHOOK_URL = 'https://n8n-wwfb.onrender.com/webhook/384f4150-da78-4dd8-afc9-68bc80ffa6c3'

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
  const [filledPdfUrl, setFilledPdfUrl] = useState<string>('')
  const [filledPdfBlob, setFilledPdfBlob] = useState<Blob | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [ipAddress, setIpAddress] = useState<string>('')
  const [highlightMissing, setHighlightMissing] = useState(false)
  const firstMissingFieldRef = useRef<HTMLElement | null>(null)

  const setFirstMissingFieldRefCallback = (el: HTMLElement | null) => {
    firstMissingFieldRef.current = el
  }

  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '')
    // Ensure it starts with 1 and has 11 digits total
    if (digits.length === 10) {
      return '1' + digits
    }
    if (digits.length === 11 && digits.startsWith('1')) {
      return digits
    }
    // If it doesn't match expected format, just return digits with 1 prefix
    return '1' + digits.slice(-10)
  }

  useEffect(() => {
    // Fetch user's IP address
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setIpAddress(data.ip))
      .catch(() => setIpAddress('unknown'))
  }, [])

  // Generate filled PDF when user data is available
  useEffect(() => {
    const generateFilledPdf = async () => {
      // Only generate if we have at least first and last name
      if (formData.firstName && formData.lastName) {
        try {
          const blob = await fillPdfFormFields(PDF_URL, {
            firstName: formData.firstName,
            lastName: formData.lastName,
            streetAddress: formData.streetAddress,
            city: formData.city,
            province: formData.province,
            postalCode: formData.postalCode,
            phone: formData.phone,
            email: formData.email,
          })
          
          // Store blob for email sending
          setFilledPdfBlob(blob)
          
          // Create URL from blob and clean up previous one
          if (filledPdfUrl) {
            URL.revokeObjectURL(filledPdfUrl)
          }
          const url = URL.createObjectURL(blob)
          setFilledPdfUrl(url)
        } catch (error) {
          console.error('Error generating filled PDF:', error)
          // Fall back to original PDF if filling fails
          setFilledPdfUrl(PDF_URL)
          setFilledPdfBlob(null)
        }
      } else {
        // Use original PDF if no client data
        setFilledPdfUrl(PDF_URL)
        setFilledPdfBlob(null)
      }
    }

    generateFilledPdf()

    // Cleanup: revoke object URL when component unmounts
    return () => {
      if (filledPdfUrl && filledPdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(filledPdfUrl)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.firstName, formData.lastName, formData.streetAddress, formData.city, formData.province, formData.postalCode, formData.phone, formData.email])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Clear highlight when user starts typing
    if (highlightMissing) {
      setHighlightMissing(false)
    }
  }

  const isFormDataComplete = 
    formData.firstName.trim() !== '' &&
    formData.lastName.trim() !== '' &&
    formData.email.trim() !== '' &&
    formData.phone.trim() !== '' &&
    formData.streetAddress.trim() !== '' &&
    formData.city.trim() !== '' &&
    formData.province.trim() !== ''

  const handlePDFClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isFormDataComplete) {
      setHighlightMissing(true)
      // Scroll to first missing field
      setTimeout(() => {
        if (firstMissingFieldRef.current) {
          firstMissingFieldRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
          firstMissingFieldRef.current.focus()
        }
      }, 100)
      return
    }
    
    setIsPDFOpen(true)
  }

  const getFieldClass = (fieldName: keyof FormData) => {
    const isEmpty = !formData[fieldName] || formData[fieldName].toString().trim() === ''
    if (highlightMissing && isEmpty) {
      return 'input-field border-red-500 bg-red-50'
    }
    return 'input-field'
  }

  const isFirstMissingField = (fieldName: keyof FormData) => {
    const missingFields: (keyof FormData)[] = []
    const fieldsToCheck: (keyof FormData)[] = ['firstName', 'lastName', 'email', 'phone', 'streetAddress', 'city', 'province', 'postalCode']
    
    fieldsToCheck.forEach(field => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        missingFields.push(field)
      }
    })
    
    return missingFields.length > 0 && missingFields[0] === fieldName
  }

  const isAcceptanceValid = formData.acceptanceText.trim().toLowerCase() === "j'accepte"
  
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

    const formattedPhone = formatPhoneNumber(formData.phone)
    const consolidatedAddress = `${formData.streetAddress}, ${formData.city}, ${formData.province} ${formData.postalCode}`

    const signature: ContractSignature = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      phone: formattedPhone,
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

    // Submit to Supabase (includes PDF upload)
    const result = await submitSignature(signature, filledPdfBlob || undefined)

    if (result.success) {
      // Send all data to n8n webhook for Monday integration
      try {
        const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formattedPhone,
            email: formData.email,
            signedAt: new Date().toISOString().split('T')[0],
            address: consolidatedAddress,
            acceptanceText: formData.acceptanceText,
            ipAddress: ipAddress,
            pdfUrl: result.pdfUrl,
          }),
        })

        if (!n8nResponse.ok) {
          console.error('n8n webhook failed:', await n8nResponse.text())
          // Don't fail the whole submission if webhook fails
        }
      } catch (error) {
        console.error('Error sending to n8n:', error)
        // Don't fail the whole submission if webhook fails
      }

      setSubmitStatus('success')
    } else {
      setSubmitStatus('error')
      setErrorMessage(result.error || 'Une erreur est survenue.')
    }

    setIsSubmitting(false)
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-gray-100">
          <div className="w-16 h-16 bg-[#fbb624] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-[#fbb624]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Merci !</h2>
          <p className="text-gray-600">
            Votre signature a été enregistrée avec succès.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Vous serez redirigé automatiquement dans 5 secondes...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img 
            src="https://www.clickon.solutions/clickon-logo.png" 
            alt="ClickOn Logo" 
            className="h-8 md:h-12"
          />
        </div>
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Onboarding ClickOn</h1>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b-2 border-gray-100 pb-2">
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
                    ref={isFirstMissingField('firstName') ? setFirstMissingFieldRefCallback : null}
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={getFieldClass('firstName')}
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
                    ref={isFirstMissingField('lastName') ? setFirstMissingFieldRefCallback : null}
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={getFieldClass('lastName')}
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
                  ref={isFirstMissingField('email') ? setFirstMissingFieldRefCallback : null}
                  value={formData.email}
                  onChange={handleInputChange}
                  className={getFieldClass('email')}
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
                  ref={isFirstMissingField('phone') ? setFirstMissingFieldRefCallback : null}
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={getFieldClass('phone')}
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
                  ref={isFirstMissingField('streetAddress') ? setFirstMissingFieldRefCallback : null}
                  value={formData.streetAddress}
                  onChange={handleInputChange}
                  className={getFieldClass('streetAddress')}
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
                    ref={isFirstMissingField('city') ? setFirstMissingFieldRefCallback : null}
                    className={getFieldClass('city')}
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
                    ref={isFirstMissingField('province') ? setFirstMissingFieldRefCallback : null}
                    className={getFieldClass('province')}
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
                    ref={isFirstMissingField('postalCode') ? setFirstMissingFieldRefCallback : null}
                    className={getFieldClass('postalCode')}
                    placeholder="H2X 1Y4"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b-2 border-gray-100 pb-2">
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
                    onClick={handlePDFClick}
                    className="text-[#fbb624] hover:text-[#e5a520] underline font-semibold hover:pointer"
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
                Pour confirmer votre accord, veuillez inscrire « j'accepte » ci-dessous <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="acceptanceText"
                name="acceptanceText"
                value={formData.acceptanceText}
                onChange={handleInputChange}
                className={`input-field ${
                  isAcceptanceValid 
                    ? 'border-[#fbb624] focus:ring-[#fbb624] focus:border-[#fbb624]'
                    : ''
                }`}
                placeholder="j'accepte"
                required
              />
              {isAcceptanceValid && (
                <p className="text-sm text-[#fbb624] flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Signature enregistree
                </p>
              )}
              {formData.acceptanceText.trim().length > 0 && !isAcceptanceValid && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Veuillez inscrire exactement « j'accepte »
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

      </div>

      {/* PDF Modal */}
      <PDFViewer
        pdfUrl={filledPdfUrl || PDF_URL}
        isOpen={isPDFOpen}
        onClose={() => setIsPDFOpen(false)}
      />
    </div>
  )
}
