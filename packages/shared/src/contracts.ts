import { z } from 'zod'

export const workerRoleSchema = z.enum(['worker', 'admin'])
export const planNameSchema = z.enum(['Basic', 'Standard', 'Pro'])

export const signupSchema = z.object({
  name: z.string().trim().min(2),
  email: z.union([z.string().trim().email(), z.literal('')]).optional(),
  phone: z.string().trim().min(6),
  platforms: z.array(z.string().trim().min(1)).min(1),
  city: z.string().trim().min(2),
  zone: z.string().trim().min(2),
  plan: planNameSchema,
  upi: z.string().trim().min(3),
})

export const loginSchema = z.object({
  identifier: z.string().trim().min(3).optional(),
  phone: z.string().trim().min(6).optional(),
  email: z.string().trim().email().optional(),
}).superRefine((value, ctx) => {
  if (!value.identifier && !value.phone && !value.email) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Phone number or email is required',
      path: ['identifier'],
    })
  }
})

export const otpRequestSchema = z.object({
  phone: z.string().trim().min(6),
  purpose: z.enum(['login', 'signup']),
  signup: signupSchema.optional(),
}).superRefine((value, ctx) => {
  if (value.purpose === 'signup' && !value.signup) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Signup details are required for signup OTP',
      path: ['signup'],
    })
  }
})

export const otpVerifySchema = z.object({
  challengeId: z.string().trim().min(1),
  phone: z.string().trim().min(6),
  code: z.string().trim().length(6),
})

export const profileSettingSchema = z.object({
  label: z.string().trim().min(1),
  value: z.string().trim().min(1),
  enabled: z.boolean(),
  kind: z.enum(['link']).optional(),
})

export const profileSettingsPayloadSchema = z.object({
  settings: z.array(profileSettingSchema),
})

export const payoutSimulationSchema = z.object({
  provider: z.enum(['upi_mock', 'razorpay_test', 'stripe_test']).default('upi_mock'),
})

export const supportRequestSchema = z.object({
  channel: z.enum(['callback', 'chat', 'phone']).default('callback'),
})

export const policyUpgradeSchema = z.object({
  plan: planNameSchema,
})

export const autopayManagementSchema = z.object({
  enabled: z.boolean(),
})

export const fraudReviewActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'escalate', 'resolve']),
})
