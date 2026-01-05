export interface EmailData {
  firstName: string
  lastName: string
  email: string
  phone: string
  streetAddress: string
  city: string
  province: string
  postalCode: string
}

/**
 * Send signature emails to both LogiPret and the client
 * @param clientData - Client information
 * @param pdfBlob - The signed PDF as a Blob
 * @returns Promise with success status
 */
export async function sendSignatureEmails(
  clientData: EmailData,
  pdfBlob: Blob
): Promise<{ success: boolean; error?: string }> {
  try {
    // Convert Blob to base64
    const arrayBuffer = await pdfBlob.arrayBuffer()
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    )

    const response = await fetch('/api/send-signature-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientData,
        pdfBase64: base64,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to send emails')
    }

    return { success: true }
  } catch (error) {
    console.error('Error sending signature emails:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
