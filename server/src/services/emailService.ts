// server/src/services/emailService.ts
import { Resend } from 'resend'
import { errorLogService } from './errorLogService.js'

// Lazy getter, not a module-scope `new Resend(...)` — RESEND_API_KEY isn't
// set in every environment (e.g. some scripts/tests), and building the
// client eagerly at import time would throw before those code paths ever
// call this. Mirrors googleOAuthService.ts's googleClient().
function resendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY must be set')
  }
  return new Resend(apiKey)
}

// Never throws — a failed reset email must not change the generic response
// POST /auth/forgot-password always gives (see auth.ts), so failures are
// logged here rather than propagated.
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const from = process.env.EMAIL_FROM
  if (!from) {
    errorLogService.record({ source: 'resend', message: 'EMAIL_FROM must be set', context: to })
    return
  }

  try {
    const { error } = await resendClient().emails.send({
      from,
      to,
      subject: 'Reset your P·Share password',
      text: `Someone requested a password reset for your P·Share account.\n\nReset your password: ${resetUrl}\n\nThis link expires in 3 days. If you didn't request this, you can ignore this email.`,
      html: `<p>Someone requested a password reset for your P&middot;Share account.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 3 days. If you didn't request this, you can ignore this email.</p>`,
    })
    // The Resend SDK does NOT throw for API-level failures (invalid key,
    // unverified domain, bad `from` address, rate limits, outages) — it
    // resolves with { data: null, error: {...} }. Only the resendClient()
    // getter's own throw (missing key) lands in the catch below.
    if (error) {
      errorLogService.record({ source: 'resend', message: error.message, context: to })
    }
  } catch (err) {
    errorLogService.record({ source: 'resend', message: (err as Error).message, context: to })
  }
}
