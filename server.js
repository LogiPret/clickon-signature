import express from 'express'
import nodemailer from 'nodemailer'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

// Send email endpoint
app.post('/api/send-signature-email', async (req, res) => {
  try {
    const { clientData, pdfBase64 } = req.body

    if (!clientData || !pdfBase64) {
      return res.status(400).json({ error: 'Missing required data' })
    }

    const { firstName, lastName, email } = clientData

    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64')

    // Email to LogiPret
    const emailToLogipret = {
      from: process.env.GMAIL_USER,
      to: 'info@logipret.ca',
      subject: `Nouvelle signature de contrat - ${firstName} ${lastName}`,
      html: `
        <h2>Nouvelle signature de contrat</h2>
        <p>Un nouveau contrat a été signé par :</p>
        <ul>
          <li><strong>Nom complet:</strong> ${firstName} ${lastName}</li>
          <li><strong>Courriel:</strong> ${email}</li>
          <li><strong>Téléphone:</strong> ${clientData.phone}</li>
          <li><strong>Adresse:</strong> ${clientData.streetAddress}, ${clientData.city}, ${clientData.province} ${clientData.postalCode}</li>
        </ul>
        <p>Le contrat signé est joint à ce courriel.</p>
        <p><em>Date de signature: ${new Date().toLocaleString('fr-CA')}</em></p>
      `,
      attachments: [
        {
          filename: `Contrat_${lastName}_${firstName}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    }

    // Email to client
    const emailToClient = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Confirmation de signature - Votre contrat',
      html: `
        <h2>Confirmation de signature</h2>
        <p>Bonjour ${firstName} ${lastName},</p>
        <p>Nous vous confirmons que votre signature électronique a bien été enregistrée.</p>
        <p>Vous trouverez en pièce jointe une copie du contrat que vous avez signé.</p>
        <p>Si vous avez des questions ou besoin d'assistance, n'hésitez pas à nous contacter à <a href="mailto:info@logipret.ca">info@logipret.ca</a>.</p>
        <br>
        <p>Cordialement,</p>
        <p><strong>L'équipe LogiPret</strong></p>
        <br>
        <p><em>Ceci est un courriel automatique, veuillez ne pas y répondre directement.</em></p>
      `,
      attachments: [
        {
          filename: `Votre_Contrat_${lastName}_${firstName}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    }

    // Send both emails
    await Promise.all([
      transporter.sendMail(emailToLogipret),
      transporter.sendMail(emailToClient),
    ])

    res.json({ success: true, message: 'Emails sent successfully' })
  } catch (error) {
    console.error('Error sending emails:', error)
    res.status(500).json({ error: 'Failed to send emails', details: error.message })
  }
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Email server running on port ${PORT}`)
})
