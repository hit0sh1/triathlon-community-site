import { supabase } from './supabase'
import type { Database } from './supabase'

export type Cafe = Database['public']['Tables']['cafes']['Row']

export async function getCafes(): Promise<Cafe[]> {
  const { data, error } = await supabase
    .from('cafes')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching cafes:', error)
    return []
  }

  return data || []
}

export async function getCafeById(id: string): Promise<Cafe | null> {
  const { data, error } = await supabase
    .from('cafes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching cafe:', error)
    return null
  }

  return data
}

export async function getCafesByArea(area: string): Promise<Cafe[]> {
  const { data, error } = await supabase
    .from('cafes')
    .select('*')
    .eq('area', area)
    .order('name')

  if (error) {
    console.error('Error fetching cafes by area:', error)
    return []
  }

  return data || []
}

export async function getCafeReviews(cafeId: string) {
  const { data, error } = await supabase
    .from('cafe_reviews')
    .select(`
      *,
      profiles (
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('cafe_id', cafeId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching cafe reviews:', error)
    return []
  }

  return data || []
}

export async function getCafeAverageRating(cafeId: string): Promise<{ averageRating: number; reviewCount: number }> {
  const { data, error } = await supabase
    .from('cafe_reviews')
    .select('rating')
    .eq('cafe_id', cafeId)

  if (error) {
    console.error('Error fetching cafe ratings:', error)
    return { averageRating: 0, reviewCount: 0 }
  }

  if (!data || data.length === 0) {
    return { averageRating: 0, reviewCount: 0 }
  }

  const totalRating = data.reduce((sum, review) => sum + review.rating, 0)
  const averageRating = totalRating / data.length

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    reviewCount: data.length
  }
}

export async function getCafePosts(cafeId: string) {
  const { data, error } = await supabase
    .from('cafe_posts')
    .select(`
      *,
      profiles (
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('cafe_id', cafeId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching cafe posts:', error)
    return []
  }

  return data || []
}