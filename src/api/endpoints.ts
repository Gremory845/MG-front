import { request, tokens } from './client'
import type {
  AttemptResult,
  LeaderboardEntry,
  LevelDetail,
  Scale,
  ScaleLevels,
  SubmitAttemptPayload,
  TokenPair,
} from './types'

export async function login(username: string, password: string): Promise<void> {
  const pair = await request<TokenPair>('/auth/login', { method: 'POST', body: { username, password } })
  tokens.setSession(pair.access_token, pair.refresh_token)
}

export async function register(email: string, username: string, password: string): Promise<void> {
  await request('/auth/register', { method: 'POST', body: { email, username, password } })
}

export const forgotPassword = (email: string) =>
  request<{ message: string }>('/auth/forgot-password', { method: 'POST', body: { email } })

export const verifyResetCode = (email: string, code: string) =>
  request<{ reset_token: string }>('/auth/verify-reset-code', { method: 'POST', body: { email, code } })

export const resetPassword = (resetToken: string, newPassword: string, confirmPassword: string) =>
  request<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: { reset_token: resetToken, new_password: newPassword, confirm_password: confirmPassword },
  })

export const getScales = () => request<Scale[]>('/scales')
export const getScaleLevels = (scaleId: string) => request<ScaleLevels>(`/scales/${scaleId}/levels`)
export const getLevel = (levelId: string) => request<LevelDetail>(`/levels/${levelId}`)
export const getLeaderboard = (levelId: string) => request<LeaderboardEntry[]>(`/leaderboard/${levelId}`)

export const submitAttempt = (payload: SubmitAttemptPayload) =>
  request<AttemptResult>('/attempts', { method: 'POST', body: payload, auth: true })
