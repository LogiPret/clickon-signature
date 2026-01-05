# Email Configuration Guide

## Gmail Setup

To enable email sending functionality, you need to set up a Gmail account with an App Password:

### 1. Create or Use a Gmail Account

Use a dedicated Gmail account for sending emails (e.g., noreply@yourcompany.com).

### 2. Enable 2-Factor Authentication

1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to **Security**
3. Enable **2-Step Verification** if not already enabled

### 3. Generate an App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Select **Mail** as the app
3. Select **Other (Custom name)** as the device
4. Enter a name like "ClickOn Signature App"
5. Click **Generate**
6. Copy the 16-character password (it will look like: `xxxx xxxx xxxx xxxx`)

### 4. Update Your .env File

Update the `.env` file in the project root with your Gmail credentials:

```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
```

**Note:** Remove spaces from the app password if copying from Google.

## Running the Application

The application requires both the frontend (Vite) and backend (Express) servers to run:

```bash
# Install dependencies (if not already done)
npm install

# Run both servers concurrently
npm run dev
```

This will start:
- **Frontend (Vite)**: http://localhost:5173
- **Backend (Express)**: http://localhost:3001

### Individual Server Commands

If you need to run servers separately:

```bash
# Run only frontend
npm run dev:client

# Run only backend
npm run dev:server
```

## Email Functionality

When a user submits the signature form:

1. **Form data is saved** to Supabase database
2. **PDF is generated** with the user's information filled in
3. **Two emails are sent**:
   - To **info@logipret.ca** - with client details and signed contract
   - To **client's email** - confirmation email with their signed contract copy

### Email Content

**Email to LogiPret:**
- Subject: "Nouvelle signature de contrat - [Client Name]"
- Contains: Client's full details and signed PDF

**Email to Client:**
- Subject: "Confirmation de signature - Votre contrat"
- Contains: Confirmation message and their signed PDF copy

## Troubleshooting

### Emails not sending

1. **Check Gmail credentials** - Ensure GMAIL_USER and GMAIL_APP_PASSWORD are correct in `.env`
2. **Check server is running** - The Express server must be running on port 3001
3. **Check console** - Look for error messages in the terminal running the server
4. **Verify App Password** - Make sure you're using an App Password, not your regular Gmail password

### CORS Errors

If you see CORS errors in the browser console, ensure:
- The backend server is running
- Vite proxy is configured correctly in `vite.config.ts`

### Port Already in Use

If port 3001 is already in use:
1. Kill the process using port 3001, or
2. Change the port in `server.js` and update the proxy in `vite.config.ts`

## Production Deployment

For production deployment:

1. **Environment Variables**: Set `GMAIL_USER` and `GMAIL_APP_PASSWORD` in your hosting environment
2. **Backend Deployment**: Deploy `server.js` to a Node.js hosting service (Heroku, Render, Railway, etc.)
3. **Frontend Build**: Update API endpoint in production to point to your deployed backend
4. **Update Vite Config**: Remove proxy and use full backend URL in production

## Security Notes

- **Never commit** your `.env` file to version control
- Use `.env.example` as a template for other developers
- Keep your Gmail App Password secure
- Consider using a dedicated email service (SendGrid, AWS SES) for production
