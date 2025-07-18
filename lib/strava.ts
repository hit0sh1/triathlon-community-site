import { createClient } from '@/lib/supabase/client'
import { generatePKCEParams, storeCodeVerifier, retrieveCodeVerifier } from '@/lib/pkce'

export interface StravaConnection {
  id: string
  user_id: string
  strava_athlete_id: number
  access_token: string
  refresh_token: string
  expires_at: string
  scope: string
  athlete_data: any
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface StravaActivity {
  id: string
  user_id: string
  strava_activity_id: number
  activity_data: any
  activity_type: string
  start_date: string
  distance: number
  moving_time: number
  elapsed_time: number
  total_elevation_gain: number
  created_at: string
  updated_at: string
}

export interface StravaAthlete {
  id: number
  username: string
  firstname: string
  lastname: string
  city: string
  state: string
  country: string
  profile: string
  profile_medium: string
  created_at: string
  updated_at: string
}

export interface StravaActivityData {
  id: number
  name: string
  type: string
  start_date: string
  start_date_local: string
  distance: number
  moving_time: number
  elapsed_time: number
  total_elevation_gain: number
  sport_type: string
  average_speed: number
  max_speed: number
  average_heartrate?: number
  max_heartrate?: number
  elev_high?: number
  elev_low?: number
  location_city?: string
  location_state?: string
  location_country?: string
  map?: {
    id: string
    summary_polyline: string
    resource_state: number
  }
}

const STRAVA_API_BASE_URL = 'https://www.strava.com/api/v3'
const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize'

export class StravaAPI {
  private supabase = createClient()

  // OAuth認証URL生成（PKCE対応）
  async getAuthUrl(clientId: string, redirectUri: string, scope: string = 'read,activity:read_all'): Promise<string> {
    const { codeVerifier, codeChallenge, codeChallengeMethod } = await generatePKCEParams()
    
    // Code verifierをローカルストレージに保存
    storeCodeVerifier(codeVerifier)
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scope,
      approval_prompt: 'force',
      code_challenge: codeChallenge,
      code_challenge_method: codeChallengeMethod,
    })
    
    return `${STRAVA_AUTH_URL}?${params.toString()}`
  }

  // 認証コードでアクセストークンを取得（PKCE対応）
  async exchangeCodeForToken(code: string): Promise<{
    access_token: string
    refresh_token: string
    expires_at: number
    athlete: StravaAthlete
  }> {
    const codeVerifier = retrieveCodeVerifier()
    
    if (!codeVerifier) {
      throw new Error('Code verifier not found. Please restart the authorization flow.')
    }

    // Use API route for token exchange
    const response = await fetch('/api/auth/strava', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        codeVerifier,
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Strava token exchange error:', errorData)
      throw new Error(`Strava token exchange failed: ${errorData.error || 'Unknown error'}`)
    }

    const data = await response.json()
    return data
  }

  // リフレッシュトークンでアクセストークンを更新
  async refreshToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string
  ): Promise<{
    access_token: string
    refresh_token: string
    expires_at: number
  }> {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    })

    if (!response.ok) {
      throw new Error(`Strava token refresh failed: ${response.statusText}`)
    }

    return await response.json()
  }

  // Strava API呼び出し
  private async callStravaAPI(endpoint: string, accessToken: string): Promise<any> {
    const response = await fetch(`${STRAVA_API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Strava API call failed: ${response.statusText}`)
    }

    return await response.json()
  }

  // アクティビティ一覧取得
  async getActivities(
    accessToken: string,
    page: number = 1,
    perPage: number = 30
  ): Promise<StravaActivityData[]> {
    return await this.callStravaAPI(
      `/athlete/activities?page=${page}&per_page=${perPage}`,
      accessToken
    )
  }

  // 特定のアクティビティ取得
  async getActivity(activityId: number, accessToken: string): Promise<StravaActivityData> {
    return await this.callStravaAPI(`/activities/${activityId}`, accessToken)
  }

  // アスリート情報取得
  async getAthlete(accessToken: string): Promise<StravaAthlete> {
    return await this.callStravaAPI('/athlete', accessToken)
  }

  // データベースにStrava接続を保存
  async saveStravaConnection(
    userId: string,
    stravaAthleteId: number,
    accessToken: string,
    refreshToken: string,
    expiresAt: number,
    scope: string,
    athleteData: any
  ): Promise<StravaConnection> {
    const { data, error } = await this.supabase
      .from('strava_connections')
      .upsert({
        user_id: userId,
        strava_athlete_id: stravaAthleteId,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: new Date(expiresAt * 1000).toISOString(),
        scope: scope,
        athlete_data: athleteData,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving Strava connection:', error)
      throw error
    }

    // プロフィールテーブルも更新
    await this.supabase
      .from('profiles')
      .update({
        strava_connected: true,
        strava_athlete_id: stravaAthleteId
      })
      .eq('id', userId)

    return data
  }

  // ユーザーのStrava接続を取得
  async getStravaConnection(userId: string): Promise<StravaConnection | null> {
    const { data, error } = await this.supabase
      .from('strava_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Error fetching Strava connection:', error)
      throw error
    }

    return data
  }

  // トークンの有効性チェックと更新
  async ensureValidToken(userId: string, clientId: string, clientSecret: string): Promise<string> {
    const connection = await this.getStravaConnection(userId)
    if (!connection) {
      throw new Error('Strava connection not found')
    }

    const now = new Date()
    const expiresAt = new Date(connection.expires_at)

    // トークンがまだ有効な場合
    if (now < expiresAt) {
      return connection.access_token
    }

    // トークンをリフレッシュ
    const refreshedToken = await this.refreshToken(
      connection.refresh_token,
      clientId,
      clientSecret
    )

    // 新しいトークンを保存
    await this.supabase
      .from('strava_connections')
      .update({
        access_token: refreshedToken.access_token,
        refresh_token: refreshedToken.refresh_token,
        expires_at: new Date(refreshedToken.expires_at * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    return refreshedToken.access_token
  }

  // アクティビティをデータベースに保存
  async saveActivity(userId: string, activityData: StravaActivityData): Promise<void> {
    const { error } = await this.supabase
      .from('strava_activities')
      .upsert({
        user_id: userId,
        strava_activity_id: activityData.id,
        activity_data: activityData,
        activity_type: activityData.type,
        start_date: activityData.start_date,
        distance: activityData.distance,
        moving_time: activityData.moving_time,
        elapsed_time: activityData.elapsed_time,
        total_elevation_gain: activityData.total_elevation_gain || 0
      })

    if (error) {
      console.error('Error saving activity:', error)
      throw error
    }
  }

  // ユーザーのアクティビティを取得
  async getUserActivities(userId: string, limit: number = 10): Promise<StravaActivity[]> {
    const { data, error } = await this.supabase
      .from('strava_activities')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching user activities:', error)
      throw error
    }

    return data || []
  }

  // Strava接続を切断
  async disconnect(): Promise<void> {
    try {
      // API route for disconnect
      const response = await fetch('/api/auth/strava/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Disconnect failed: ${errorData.error || 'Unknown error'}`)
      }

    } catch (error) {
      console.error('Disconnect error:', error)
      throw error
    }
  }

  // 最新のアクティビティを同期
  async syncActivities(userId: string, clientId: string, clientSecret: string): Promise<void> {
    const accessToken = await this.ensureValidToken(userId, clientId, clientSecret)
    const activities = await this.getActivities(accessToken, 1, 50)

    for (const activity of activities) {
      await this.saveActivity(userId, activity)
    }
  }
}

// シングルトンインスタンス
export const stravaAPI = new StravaAPI()