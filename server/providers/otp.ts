import { randomUUID } from 'node:crypto'
import type { OtpChallengeRecord, OtpPurpose, SignupInput } from '../types.js'

const OTP_TTL_MINUTES = 5

export type RequestedOtp = {
  challenge: OtpChallengeRecord
  delivery: 'mock' | 'sms' | 'whatsapp'
  maskedDestination: string
  resendAfterSeconds: number
  demoCode?: string
}

export function requestOtpChallenge(input: {
  phone: string
  purpose: OtpPurpose
  signupPayload?: SignupInput | null
}): RequestedOtp {
  const phoneNormalized = normalizePhone(input.phone)
  const code = buildMockCode(phoneNormalized)
  const createdAt = new Date().toISOString()
  const challenge: OtpChallengeRecord = {
    id: randomUUID(),
    phone: input.phone,
    phoneNormalized,
    purpose: input.purpose,
    code,
    signupPayload: input.signupPayload ?? null,
    createdAt,
    expiresAt: addMinutes(createdAt, OTP_TTL_MINUTES),
    attempts: 0,
    maxAttempts: 5,
    status: 'pending',
    verifiedAt: null,
  }

  const delivery = (process.env.OTP_DELIVERY ?? 'mock') as 'mock' | 'sms' | 'whatsapp'
  return {
    challenge,
    delivery,
    maskedDestination: maskPhone(input.phone),
    resendAfterSeconds: 30,
    demoCode: delivery === 'mock' ? code : undefined,
  }
}

export function verifyOtpChallenge(challenge: OtpChallengeRecord, code: string) {
  const now = new Date().toISOString()

  if (challenge.status !== 'pending') {
    return {
      ok: false,
      challenge: {
        ...challenge,
        status: challenge.status === 'verified' ? 'verified' : 'expired',
      } satisfies OtpChallengeRecord,
      errorCode: 'otp_unavailable',
      errorMessage: 'That verification code can no longer be used.',
    }
  }

  if (challenge.expiresAt <= now) {
    return {
      ok: false,
      challenge: { ...challenge, status: 'expired' } satisfies OtpChallengeRecord,
      errorCode: 'otp_expired',
      errorMessage: 'That verification code has expired.',
    }
  }

  const attempts = challenge.attempts + 1
  if (challenge.code !== code.trim()) {
    return {
      ok: false,
      challenge: {
        ...challenge,
        attempts,
        status: attempts >= challenge.maxAttempts ? 'expired' : challenge.status,
      } satisfies OtpChallengeRecord,
      errorCode: 'otp_invalid',
      errorMessage: 'The verification code is invalid.',
    }
  }

  return {
    ok: true,
    challenge: {
      ...challenge,
      attempts,
      status: 'verified',
      verifiedAt: now,
    } satisfies OtpChallengeRecord,
  }
}

function buildMockCode(phoneNormalized: string) {
  const suffix = phoneNormalized.slice(-5).padStart(5, '0')
  return `2${suffix}`
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '')
}

function maskPhone(phone: string) {
  const normalized = normalizePhone(phone)
  if (normalized.length <= 4) {
    return normalized
  }

  return `${'*'.repeat(Math.max(0, normalized.length - 4))}${normalized.slice(-4)}`
}

function addMinutes(isoDate: string, minutes: number) {
  const date = new Date(isoDate)
  date.setUTCMinutes(date.getUTCMinutes() + minutes)
  return date.toISOString()
}
