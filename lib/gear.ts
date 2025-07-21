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

  // deleted_atカラムが存在する場合のみフィルタリング
  try {
    query = query.is('deleted_at', null)
  } catch (error) {
    // deleted_atカラムが存在しない場合は無視
    console.log('deleted_at column not found, skipping filter')
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
    .eq('id', id)

  // deleted_atカラムが存在する場合のみフィルタリング
  try {
    query = query.is('deleted_at', null)
  } catch (error) {
    // deleted_atカラムが存在しない場合は無視
    console.log('deleted_at column not found, skipping filter')
  }

  const { data, error } = await query.single()

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
    
    // 現在のユーザーを取得
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('User authentication required')
      return false
    }

    // ユーザー削除: 論理削除のみ（自分のレビューのみ削除可能）
    const { error } = await supabase
      .from('gear_reviews')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', reviewId)
      .eq('user_id', user.id) // 自分のレビューのみ削除可能

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error deleting gear review:', error)
    return false
  }
}

export async function deleteGearReviewByAdmin(reviewId: string, deletionReason: string): Promise<boolean> {
  try {
    const supabase = createClient()
    
    // 現在のユーザー（管理者）を取得
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('User authentication required')
      return false
    }

    if (!deletionReason) {
      console.error('Deletion reason is required for admin deletion')
      return false
    }

    // レビューの詳細を取得（通知用）
    const { data: reviewToDelete, error: fetchError } = await supabase
      .from('gear_reviews')
      .select('product_name, user_id')
      .eq('id', reviewId)
      .single()

    if (fetchError || !reviewToDelete) {
      console.error('Gear review not found')
      return false
    }

    // 管理者削除: 論理削除 + 削除理由記録
    const { error } = await supabase
      .from('gear_reviews')
      .update({ 
        deleted_at: new Date().toISOString(),
        deletion_reason: deletionReason,
        deleted_by: user.id
      })
      .eq('id', reviewId)

    if (error) throw error

    // 投稿者が削除者と異なる場合のみ通知を送信
    if (reviewToDelete.user_id !== user.id) {
      try {
        const { notifyAdminDeletion } = await import('./notifications')
        
        // 管理者情報を取得
        const { data: adminProfile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single()

        await notifyAdminDeletion(
          reviewToDelete.user_id,
          'gear_review',
          reviewToDelete.product_name,
          adminProfile?.display_name || '管理者',
          deletionReason
        )
      } catch (notificationError) {
        console.error('Error sending deletion notification:', notificationError)
        // 通知エラーは削除処理を失敗させない
      }
    }

    return true
  } catch (error) {
    console.error('Error deleting gear review:', error)
    return false
  }
}