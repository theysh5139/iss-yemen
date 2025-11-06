// Mock email sender for development; logs the link to console.
export async function sendEmail({ to, subject, text, html }) {
  // eslint-disable-next-line no-console
  console.log('[MOCK EMAIL] To:', to);
  // eslint-disable-next-line no-console
  console.log('[MOCK EMAIL] Subject:', subject);
  // eslint-disable-next-line no-console
  console.log('[MOCK EMAIL] Text:', text);
  if (html) {
    // eslint-disable-next-line no-console
    console.log('[MOCK EMAIL] HTML:', html);
  }
  return true;
}


