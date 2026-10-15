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

export async function login(email: string, password: string): Promise<void> {
  const pair = await request<TokenPair>('/auth/login', { method: 'POST', body: { email, password } })
  tokens.setSession(pair.access_token, pair.refresh_token)
}

export async function register(email: string, username: string, password: string): Promise<void> {
  await request('/auth/register', { method: 'POST', body: { email, username, password } })
}

export const getScales = () => request<Scale[]>('/scales')
export const getScaleLevels = (scaleId: string) => request<ScaleLevels>(`/scales/${scaleId}/levels`)
export const getLevel = (levelId: string) => request<LevelDetail>(`/levels/${levelId}`)
export const getLeaderboard = (levelId: string) => request<LeaderboardEntry[]>(`/leaderboard/${levelId}`)

export const submitAttempt = (payload: SubmitAttemptPayload) =>
  request<AttemptResult>('/attempts', { method: 'POST', body: payload, auth: true })
