import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export interface ClientData {
  firstName: string
  lastName: string
  streetAddress: string
  city: string
  province: string
  postalCode: string
  phone: string
  email: string
}

/**
 * Fill a PDF template with client information
 * @param pdfUrl - URL or path to the template PDF
 * @param clientData - Client information to insert
 * @returns Blob of the filled PDF
 */
export async function fillPdfWithClientData(
  pdfUrl: string,
  clientData: ClientData
): Promise<Blob> {
  // Fetch the existing PDF
  const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer())

  // Load the PDF
  const pdfDoc = await PDFDocument.load(existingPdfBytes)

  // Embed a standard font
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Get the first page (you can modify this to target specific pages)
  const pages = pdfDoc.getPages()
  const firstPage = pages[0]
  const { height } = firstPage.getSize()

  const fullName = `${clientData.firstName} ${clientData.lastName}`
  const fullAddress = `${clientData.streetAddress}, ${clientData.city}, ${clientData.province} ${clientData.postalCode}`

  // Example positions - ADJUST THESE based on your PDF template
  // You'll need to determine the exact X, Y coordinates where you want the text
  const textPositions = [
    // Position 1: Name at top of document
    {
      text: fullName,
      x: 100,
      y: height - 150,
      size: 12,
      font: boldFont,
    },
    // Position 2: Address below name
    {
      text: fullAddress,
      x: 100,
      y: height - 170,
      size: 10,
      font: font,
    },
    // Position 3: Name in signature area (example)
    {
      text: fullName,
      x: 100,
      y: 100,
      size: 12,
      font: boldFont,
    },
    // Add more positions as needed
  ]

  // Draw text at each position
  textPositions.forEach((position) => {
    firstPage.drawText(position.text, {
      x: position.x,
      y: position.y,
      size: position.size,
      font: position.font,
      color: rgb(0, 0, 0),
    })
  })

  // If you need to add the same info on multiple pages:
  // pages.forEach((page, index) => {
  //   if (index > 0) { // Skip first page if already done
  //     page.drawText(fullName, { x: 100, y: height - 150, size: 12, font: boldFont, color: rgb(0, 0, 0) })
  //   }
  // })

  // Serialize the PDFDocument to bytes
  const pdfBytes = await pdfDoc.save()

  // Convert to Blob
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
}

/**
 * Alternative: If your PDF has form fields, you can fill them directly
 * This is more reliable if your PDF template has fillable form fields
 */
export async function fillPdfFormFields(
  pdfUrl: string,
  clientData: ClientData
): Promise<Blob> {
  const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer())
  const pdfDoc = await PDFDocument.load(existingPdfBytes)

  // Get the form
  const form = pdfDoc.getForm()

  const fullName = `${clientData.firstName} ${clientData.lastName}`
  const fullAddress = `${clientData.streetAddress}, ${clientData.city}, ${clientData.province} ${clientData.postalCode}`

  // Fill form fields based on your PDF template
  try {
    // Text1: Full name
    const text1 = form.getTextField('Text1')
    text1.setText(fullName)

    // Text2: Full name
    const text2 = form.getTextField('Text2')
    text2.setText(fullName)

    // Text3: Full name
    const text3 = form.getTextField('Text3')
    text3.setText(fullName)

    // Text4: Title (keep empty)
    const text4 = form.getTextField('Text4')
    text4.setText('')

    // Text5: Address
    const text5 = form.getTextField('Text5')
    text5.setText(fullAddress)

    // Text6: Phone
    const text6 = form.getTextField('Text6')
    text6.setText(clientData.phone)

    // Text7: Email
    const text7 = form.getTextField('Text7')
    text7.setText(clientData.email)

    // Flatten the form to make it non-editable
    form.flatten()
  } catch (error) {
    console.error('Error filling form fields:', error)
    throw new Error('PDF form fields not found. The PDF might not have fillable form fields.')
  }

  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
}

/**
 * Download the filled PDF
 */
export function downloadPdf(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
