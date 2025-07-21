import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileInsert = Database['public']['Tables']['profiles']['Insert']

export async function createProfile(profileData: ProfileInsert): Promise<Profile> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .insert([profileData])
    .select()
    .single()
  
  if (error) {
    console.error('Error creating profile:', error)
    throw error
  }
  
  return data
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      // Profile not found
      return null
    }
    console.error('Error fetching profile:', error)
    throw error
  }
  
  return data
}

export async function ensureProfileExists(userId: string, email: string): Promise<Profile> {
  const existingProfile = await getProfile(userId)
  
  if (existingProfile) {
    return existingProfile
  }
  
  // Create profile if it doesn't exist
  const username = email.split('@')[0]
  const displayName = email.split('@')[0]
  
  const newProfile: ProfileInsert = {
    id: userId,
    username,
    display_name: displayName,
    role: 'user',
  }
  
  return await createProfile(newProfile)
}