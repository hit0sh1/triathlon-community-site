import { createClient } from './supabase/client'

export type GearReview = any
export type GearCategory = any
export type GearReviewPro = any
export type GearReviewCon = any

export interface GearReviewWithDetails extends GearReview {
  gear_categories: GearCategory | null
  gear_review_pros: GearReviewPro[]
  gear_review_cons: GearReviewCon[]
  profiles: {
    username: string
    display_name: string
    avatar_url: string | null
  } | null
}

export async function getGearCategories(): Promise<GearCategory[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('gear_categories')
    .select('*')
    .order('sort_order')

  if (error) {
    console.error('Error fetching gear categories:', error)
    return []
  }

  return data || []
}

export async function getGearReviews(categoryId?: string): Promise<GearReviewWithDetails[]> {
  const supabase = createClient()
  let query = supabase
    .from('gear_reviews')
    .select(`
      *,
      gear_categories (
        id,
        name,
        sort_order
      ),
      gear_review_pros (
        id,
        pro_point
      ),
      gear_review_cons (
        id,
        con_point
      ),
      profiles (
        username,
        display_name,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false })

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching gear reviews:', error)
    return []
  }

  return data || []
}

export async function getGearReviewById(id: string): Promise<GearReviewWithDetails | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('gear_reviews')
    .select(`
      *,
      gear_categories (
        id,
        name,
        sort_order
      ),
      gear_review_pros (
        id,
        pro_point
      ),
      gear_review_cons (
        id,
        con_point
      ),
      profiles (
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching gear review:', error)
    return null
  }

  return data
}

export async function createGearReview(reviewData: {
  categoryId: string
  userId: string
  productName: string
  brand?: string
  rating: number
  price?: string
  imageUrl?: string
  summary?: string
  detailedReview?: string
  pros: string[]
  cons: string[]
}): Promise<string | null> {
  try {
    const supabase = createClient()
    const { data: review, error: reviewError } = await supabase
      .from('gear_reviews')
      .insert({
        category_id: reviewData.categoryId,
        user_id: reviewData.userId,
        product_name: reviewData.productName,
        brand: reviewData.brand,
        rating: reviewData.rating,
        price: reviewData.price,
        image_url: reviewData.imageUrl,
        summary: reviewData.summary,
        detailed_review: reviewData.detailedReview,
      })
      .select('id')
      .single()

    if (reviewError) throw reviewError

    const reviewId = review.id

    // Insert pros
    if (reviewData.pros.length > 0) {
      const prosData = reviewData.pros
        .filter(pro => pro.trim())
        .map(pro => ({
          review_id: reviewId,
          pro_point: pro.trim()
        }))

      if (prosData.length > 0) {
        const { error: prosError } = await supabase
          .from('gear_review_pros')
          .insert(prosData)

        if (prosError) throw prosError
      }
    }

    // Insert cons
    if (reviewData.cons.length > 0) {
      const consData = reviewData.cons
        .filter(con => con.trim())
        .map(con => ({
          review_id: reviewId,
          con_point: con.trim()
        }))

      if (consData.length > 0) {
        const { error: consError } = await supabase
          .from('gear_review_cons')
          .insert(consData)

        if (consError) throw consError
      }
    }

    return reviewId
  } catch (error) {
    console.error('Error creating gear review:', error)
    return null
  }
}

export async function updateGearReview(
  reviewId: string,
  reviewData: {
    categoryId: string
    productName: string
    brand?: string
    rating: number
    price?: string
    imageUrl?: string
    summary?: string
    detailedReview?: string
    pros: string[]
    cons: string[]
  }
): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error: reviewError } = await supabase
      .from('gear_reviews')
      .update({
        category_id: reviewData.categoryId,
        product_name: reviewData.productName,
        brand: reviewData.brand,
        rating: reviewData.rating,
        price: reviewData.price,
        image_url: reviewData.imageUrl,
        summary: reviewData.summary,
        detailed_review: reviewData.detailedReview,
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewId)

    if (reviewError) throw reviewError

    // Delete existing pros and cons
    await supabase.from('gear_review_pros').delete().eq('review_id', reviewId)
    await supabase.from('gear_review_cons').delete().eq('review_id', reviewId)

    // Insert new pros
    if (reviewData.pros.length > 0) {
      const prosData = reviewData.pros
        .filter(pro => pro.trim())
        .map(pro => ({
          review_id: reviewId,
          pro_point: pro.trim()
        }))

      if (prosData.length > 0) {
        const { error: prosError } = await supabase
          .from('gear_review_pros')
          .insert(prosData)

        if (prosError) throw prosError
      }
    }

    // Insert new cons
    if (reviewData.cons.length > 0) {
      const consData = reviewData.cons
        .filter(con => con.trim())
        .map(con => ({
          review_id: reviewId,
          con_point: con.trim()
        }))

      if (consData.length > 0) {
        const { error: consError } = await supabase
          .from('gear_review_cons')
          .insert(consData)

        if (consError) throw consError
      }
    }

    return true
  } catch (error) {
    console.error('Error updating gear review:', error)
    return false
  }
}

export async function deleteGearReview(reviewId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('gear_reviews')
      .delete()
      .eq('id', reviewId)

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error deleting gear review:', error)
    return false
  }
}