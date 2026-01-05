# PDF Customization Guide

## Overview

The application now automatically fills your PDF contract template with client information (name and address) as they type in the form. The PDF is dynamically generated and shown to the user with their personalized information.

## How It Works

1. **Client enters their information** in the form (first name, last name, address, etc.)
2. **PDF is automatically filled** with their data using `pdf-lib`
3. **When they click "entente de service"**, they see the PDF with their name and address already inserted
4. **Form submission** saves their information to Supabase

## Two Approaches for PDF Filling

### Approach 1: Text Insertion at Coordinates (Current Implementation)

This approach draws text at specific X/Y coordinates on the PDF. You need to determine where you want the text to appear.

**File:** `src/lib/pdfFiller.ts` - function `fillPdfWithClientData()`

**How to customize positions:**

```typescript
const textPositions = [
  // Position 1: Name at top of document
  {
    text: fullName,
    x: 100,        // ← ADJUST: Horizontal position (pixels from left)
    y: height - 150, // ← ADJUST: Vertical position (pixels from bottom)
    size: 12,      // ← ADJUST: Font size
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
  // Add more positions as needed...
]
```

**How to find the right coordinates:**

1. **Open your PDF** in a PDF viewer and note where you want the text
2. **Measure the position** - PDF coordinates start from bottom-left:
   - `x: 0` is the left edge
   - `y: 0` is the bottom edge
   - `y: height` is the top edge
3. **Test and adjust** - modify the numbers and reload the page to see the changes

**Tips:**
- For top of page: `y: height - 100` (100 pixels from top)
- For middle: `y: height / 2`
- For bottom: `y: 100` (100 pixels from bottom)
- For left margin: `x: 50`
- For center: `x: width / 2`

### Approach 2: Fillable Form Fields (Recommended if your PDF has them)

If your PDF template has fillable form fields, use the `fillPdfFormFields()` function instead.

**File:** `src/lib/pdfFiller.ts` - function `fillPdfFormFields()`

**To use this approach:**

1. **Create a PDF with form fields** using Adobe Acrobat or similar
2. **Name your form fields** (e.g., "firstName", "lastName", "address")
3. **Update the SignatureForm.tsx** to use this function:

```typescript
// In src/components/SignatureForm.tsx, replace:
const filledPdfBlob = await fillPdfWithClientData(PDF_URL, {

// With:
const filledPdfBlob = await fillPdfFormFields(PDF_URL, {
```

4. **Update field names** in `pdfFiller.ts` to match your PDF:

```typescript
const firstNameField = form.getTextField('firstName') // ← Must match PDF field name
const lastNameField = form.getTextField('lastName')
// etc.
```

**How to find field names in your PDF:**
- Use Adobe Acrobat: Tools → Prepare Form → Click on fields to see names
- Use pdf-lib to list them:
  ```typescript
  const fields = form.getFields()
  fields.forEach(field => console.log(field.getName()))
  ```

## Customization Examples

### Example 1: Add name to signature area

```typescript
{
  text: `Signature: ${fullName}`,
  x: 50,
  y: 150,  // Bottom of page
  size: 14,
  font: boldFont,
}
```

### Example 2: Add date

```typescript
{
  text: `Date: ${new Date().toLocaleDateString('fr-CA')}`,
  x: 50,
  y: 130,
  size: 10,
  font: font,
}
```

### Example 3: Add text on multiple pages

```typescript
// After the textPositions drawing, add:
pages.forEach((page, index) => {
  if (index > 0) { // Skip first page if already done
    const { height } = page.getSize()
    page.drawText(fullName, {
      x: 100,
      y: height - 50,
      size: 10,
      font: font,
      color: rgb(0, 0, 0)
    })
  }
})
```

### Example 4: Split address into multiple lines

```typescript
// In pdfFiller.ts, instead of fullAddress:
const textPositions = [
  {
    text: `${clientData.firstName} ${clientData.lastName}`,
    x: 100, y: height - 150, size: 12, font: boldFont,
  },
  {
    text: clientData.streetAddress,
    x: 100, y: height - 170, size: 10, font: font,
  },
  {
    text: `${clientData.city}, ${clientData.province}`,
    x: 100, y: height - 185, size: 10, font: font,
  },
  {
    text: clientData.postalCode,
    x: 100, y: height - 200, size: 10, font: font,
  },
]
```

## Testing Your Changes

1. **Save your changes** to `pdfFiller.ts`
2. **Reload the page** in your browser
3. **Fill in the form** with test data
4. **Click "entente de service"** to view the PDF
5. **Check if text appears** in the right positions
6. **Adjust coordinates** and repeat

## Troubleshooting

**Text doesn't appear:**
- Check if coordinates are within PDF bounds
- Ensure text color is set (not white on white)
- Verify font is loaded correctly

**Text is cut off:**
- Reduce font size
- Increase available width
- Split into multiple lines

**Text overlaps existing content:**
- Adjust X/Y coordinates
- Use a smaller font size
- Consider using form fields instead

**PDF won't load:**
- Check browser console for errors
- Verify PDF_URL path is correct (`/public/contract.pdf`)
- Ensure PDF is not password-protected or corrupted

## Files Modified

- `src/lib/pdfFiller.ts` - PDF filling logic
- `src/components/SignatureForm.tsx` - Integration with form
- `package.json` - Added pdf-lib dependency

## Additional Resources

- [pdf-lib Documentation](https://pdf-lib.js.org/)
- [PDF Coordinate System](https://pdf-lib.js.org/docs/api/classes/pdfpage#drawtext)
- [Standard Fonts](https://pdf-lib.js.org/docs/api/enums/standardfonts)
