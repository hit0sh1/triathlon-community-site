import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type UserAchievement = Database['public']['Tables']['user_achievements']['Row']
type UserAchievementInsert = Database['public']['Tables']['user_achievements']['Insert']
type Profile = Database['public']['Tables']['profiles']['Row']

export interface AchievementTemplate {
  title: string
  description: string
  icon: string
  category: 'posts' | 'comments' | 'training' | 'community' | 'races'
  threshold?: number
  checkFunction?: (userStats: UserStats) => boolean
}

export interface UserStats {
  postCount: number
  commentCount: number
  totalDistance: number
  membershipMonths: number
  raceCount: number
  achievementCount: number
  joinedDate: string
  stravaConnected: boolean
}

// Predefined achievement templates
export const ACHIEVEMENT_TEMPLATES: AchievementTemplate[] = [
  // Post achievements
  {
    title: '初投稿',
    description: 'コミュニティに初めて投稿しました',
    icon: '📝',
    category: 'posts',
    threshold: 1,
    checkFunction: (stats) => stats.postCount >= 1
  },
  {
    title: 'アクティブメンバー',
    description: 'コミュニティに5回投稿しました',
    icon: '✍️',
    category: 'posts',
    threshold: 5,
    checkFunction: (stats) => stats.postCount >= 5
  },
  {
    title: 'ストーリーテラー',
    description: 'コミュニティに10回投稿しました',
    icon: '📚',
    category: 'posts',
    threshold: 10,
    checkFunction: (stats) => stats.postCount >= 10
  },
  {
    title: 'コンテンツクリエイター',
    description: 'コミュニティに20回投稿しました',
    icon: '🎬',
    category: 'posts',
    threshold: 20,
    checkFunction: (stats) => stats.postCount >= 20
  },
  {
    title: 'コミュニティリーダー',
    description: 'コミュニティに50回投稿しました',
    icon: '👑',
    category: 'posts',
    threshold: 50,
    checkFunction: (stats) => stats.postCount >= 50
  },

  // Comment achievements
  {
    title: 'サポーター',
    description: '10個の役に立つコメントをしました',
    icon: '💬',
    category: 'comments',
    threshold: 10,
    checkFunction: (stats) => stats.commentCount >= 10
  },
  {
    title: 'コミュニティサポーター',
    description: '25個の役に立つコメントをしました',
    icon: '🤝',
    category: 'comments',
    threshold: 25,
    checkFunction: (stats) => stats.commentCount >= 25
  },
  {
    title: 'コミュニティメンター',
    description: '50個の役に立つコメントをしました',
    icon: '🏆',
    category: 'comments',
    threshold: 50,
    checkFunction: (stats) => stats.commentCount >= 50
  },

  // Training achievements
  {
    title: '初ワークアウト',
    description: '初めてのトレーニングを記録しました',
    icon: '🏃',
    category: 'training',
    checkFunction: (stats) => stats.totalDistance > 0
  },
  {
    title: '100kmクラブ',
    description: '累計100kmを達成しました',
    icon: '🎯',
    category: 'training',
    threshold: 100,
    checkFunction: (stats) => stats.totalDistance >= 100
  },
  {
    title: '500kmウォリアー',
    description: '累計500kmを達成しました',
    icon: '⚡',
    category: 'training',
    threshold: 500,
    checkFunction: (stats) => stats.totalDistance >= 500
  },
  {
    title: '1000km伝説',
    description: '累計1000kmを達成しました',
    icon: '🔥',
    category: 'training',
    threshold: 1000,
    checkFunction: (stats) => stats.totalDistance >= 1000
  },
  {
    title: 'Strava連携',
    description: 'Stravaアカウントを連携しました',
    icon: '📱',
    category: 'training',
    checkFunction: (stats) => stats.stravaConnected
  },

  // Community achievements
  {
    title: '新メンバー',
    description: 'コミュニティへようこそ！',
    icon: '🎉',
    category: 'community',
    checkFunction: (stats) => stats.membershipMonths >= 0
  },
  {
    title: '1ヶ月メンバー',
    description: '1ヶ月間メンバーです',
    icon: '📅',
    category: 'community',
    threshold: 1,
    checkFunction: (stats) => stats.membershipMonths >= 1
  },
  {
    title: '6ヶ月ベテラン',
    description: '6ヶ月間メンバーです',
    icon: '🗓️',
    category: 'community',
    threshold: 6,
    checkFunction: (stats) => stats.membershipMonths >= 6
  },
  {
    title: '1年記念',
    description: '1年間メンバーです',
    icon: '🎂',
    category: 'community',
    threshold: 12,
    checkFunction: (stats) => stats.membershipMonths >= 12
  },

  // Race achievements
  {
    title: 'レース初参加',
    description: '初めてレースに参加しました',
    icon: '🏁',
    category: 'races',
    threshold: 1,
    checkFunction: (stats) => stats.raceCount >= 1
  },
  {
    title: 'レース完走者',
    description: '3回のレースを完走しました',
    icon: '🥉',
    category: 'races',
    threshold: 3,
    checkFunction: (stats) => stats.raceCount >= 3
  },
  {
    title: 'レース愛好家',
    description: '5回のレースを完走しました',
    icon: '🥈',
    category: 'races',
    threshold: 5,
    checkFunction: (stats) => stats.raceCount >= 5
  },
  {
    title: 'レースマスター',
    description: '10回のレースを完走しました',
    icon: '🥇',
    category: 'races',
    threshold: 10,
    checkFunction: (stats) => stats.raceCount >= 10
  }
]

/**
 * Add a new achievement for a user
 */
export async function addAchievement(
  userId: string, 
  achievement: Omit<UserAchievementInsert, 'user_id'>
): Promise<UserAchievement> {
  const supabase = createClient()
  
  const achievementData: UserAchievementInsert = {
    ...achievement,
    user_id: userId,
    achievement_date: achievement.achievement_date || new Date().toISOString(),
  }
  
  const { data, error } = await supabase
    .from('user_achievements')
    .insert([achievementData])
    .select()
    .single()
  
  if (error) {
    console.error('Error adding achievement:', error)
    throw error
  }

  // Update achievement count in profile
  await updateAchievementCount(userId)
  
  return data
}

/**
 * Delete an achievement
 */
export async function deleteAchievement(achievementId: string): Promise<void> {
  const supabase = createClient()
  
  // Get the achievement first to get the user_id
  const { data: achievement, error: fetchError } = await supabase
    .from('user_achievements')
    .select('user_id')
    .eq('id', achievementId)
    .single()
  
  if (fetchError) {
    console.error('Error fetching achievement:', fetchError)
    throw fetchError
  }
  
  const { error } = await supabase
    .from('user_achievements')
    .delete()
    .eq('id', achievementId)
  
  if (error) {
    console.error('Error deleting achievement:', error)
    throw error
  }

  // Update achievement count in profile
  if (achievement) {
    await updateAchievementCount(achievement.user_id)
  }
}

/**
 * Get all achievements for a user
 */
export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', userId)
    .order('achievement_date', { ascending: false })
  
  if (error) {
    console.error('Error fetching user achievements:', error)
    throw error
  }
  
  return data || []
}

/**
 * Get available achievement templates
 */
export function getAvailableAchievements(): AchievementTemplate[] {
  return ACHIEVEMENT_TEMPLATES
}

/**
 * Get user statistics for achievement checking
 */
export async function getUserStats(userId: string): Promise<UserStats> {
  const supabase = createClient()
  
  // Get profile data
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (profileError) {
    console.error('Error fetching profile:', profileError)
    throw profileError
  }

  // Get race participation count from event reviews
  const { data: raceParticipation, error: raceError } = await supabase
    .from('event_reviews')
    .select('id')
    .eq('user_id', userId)
  
  if (raceError) {
    console.error('Error fetching race participation:', raceError)
    throw raceError
  }

  // Calculate membership months
  const joinedDate = new Date(profile.joined_date || profile.created_at || new Date())
  const now = new Date()
  const membershipMonths = Math.floor((now.getTime() - joinedDate.getTime()) / (1000 * 60 * 60 * 24 * 30))

  return {
    postCount: profile.post_count || 0,
    commentCount: profile.comment_count || 0,
    totalDistance: profile.total_distance || 0,
    membershipMonths,
    raceCount: raceParticipation?.length || 0,
    achievementCount: profile.achievement_count || 0,
    joinedDate: joinedDate.toISOString(),
    stravaConnected: profile.strava_connected || false
  }
}

/**
 * Check and automatically grant achievements based on user activity
 */
export async function checkAndGrantAchievements(userId: string): Promise<UserAchievement[]> {
  try {
    const userStats = await getUserStats(userId)
    const currentAchievements = await getUserAchievements(userId)
    const currentAchievementTitles = new Set(currentAchievements.map(a => a.title))
    
    const newAchievements: UserAchievement[] = []
    
    for (const template of ACHIEVEMENT_TEMPLATES) {
      // Skip if user already has this achievement
      if (currentAchievementTitles.has(template.title)) {
        continue
      }
      
      // Check if user qualifies for this achievement
      if (template.checkFunction && template.checkFunction(userStats)) {
        try {
          const newAchievement = await addAchievement(userId, {
            title: template.title,
            description: template.description,
            icon: template.icon,
            achievement_date: new Date().toISOString()
          })
          newAchievements.push(newAchievement)
        } catch (error) {
          console.error(`Error granting achievement "${template.title}":`, error)
          // Continue with other achievements even if one fails
        }
      }
    }
    
    return newAchievements
  } catch (error) {
    console.error('Error checking and granting achievements:', error)
    throw error
  }
}

/**
 * Update achievement count in user profile
 */
async function updateAchievementCount(userId: string): Promise<void> {
  const supabase = createClient()
  
  // Count achievements for the user
  const { data, error: countError } = await supabase
    .from('user_achievements')
    .select('id')
    .eq('user_id', userId)
  
  if (countError) {
    console.error('Error counting achievements:', countError)
    return
  }
  
  const achievementCount = data?.length || 0
  
  // Update profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ achievement_count: achievementCount })
    .eq('id', userId)
  
  if (updateError) {
    console.error('Error updating achievement count:', updateError)
  }
}

/**
 * Get achievements by category
 */
export function getAchievementsByCategory(category: AchievementTemplate['category']): AchievementTemplate[] {
  return ACHIEVEMENT_TEMPLATES.filter(achievement => achievement.category === category)
}

/**
 * Get achievement template by title
 */
export function getAchievementTemplate(title: string): AchievementTemplate | undefined {
  return ACHIEVEMENT_TEMPLATES.find(achievement => achievement.title === title)
}

/**
 * Check if user qualifies for a specific achievement
 */
export async function checkSingleAchievement(userId: string, achievementTitle: string): Promise<boolean> {
  const template = getAchievementTemplate(achievementTitle)
  if (!template || !template.checkFunction) {
    return false
  }
  
  const userStats = await getUserStats(userId)
  return template.checkFunction(userStats)
}

/**
 * Grant a specific achievement to a user if they qualify
 */
export async function grantSpecificAchievement(userId: string, achievementTitle: string): Promise<UserAchievement | null> {
  const template = getAchievementTemplate(achievementTitle)
  if (!template) {
    throw new Error(`Achievement template not found: ${achievementTitle}`)
  }
  
  // Check if user already has this achievement
  const currentAchievements = await getUserAchievements(userId)
  const hasAchievement = currentAchievements.some(a => a.title === achievementTitle)
  
  if (hasAchievement) {
    return null // Already has achievement
  }
  
  // Check if user qualifies
  const qualifies = await checkSingleAchievement(userId, achievementTitle)
  if (!qualifies) {
    return null // Doesn't qualify
  }
  
  // Grant the achievement
  return await addAchievement(userId, {
    title: template.title,
    description: template.description,
    icon: template.icon,
    achievement_date: new Date().toISOString()
  })
}

/**
 * Clean up duplicate and English achievements
 */
export async function cleanupDuplicateAchievements(userId: string): Promise<void> {
  const supabase = createClient()
  
  try {
    // Get all achievements for the user
    const { data: achievements, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .order('achievement_date', { ascending: true })
    
    if (error) {
      console.error('Error fetching achievements for cleanup:', error)
      return
    }
    
    if (!achievements || achievements.length === 0) {
      return
    }
    
    // Define English titles to remove
    const englishTitles = [
      'New Member', 'First Post', 'Active Contributor', 'Community Storyteller',
      'Content Creator', 'Community Leader', 'Helpful Member', 'Community Supporter',
      'Community Mentor', 'First Workout', '100km Club', '500km Warrior', '1000km Legend',
      'Strava Connected', '1 Month Member', '6 Month Veteran', '1 Year Anniversary',
      'Race Participant', 'Race Finisher', 'Race Enthusiast', 'Race Master'
    ]
    
    // Group achievements by title
    const achievementGroups = new Map<string, UserAchievement[]>()
    
    for (const achievement of achievements) {
      const title = achievement.title
      if (!achievementGroups.has(title)) {
        achievementGroups.set(title, [])
      }
      achievementGroups.get(title)!.push(achievement)
    }
    
    const toDelete: string[] = []
    
    // Remove English achievements
    for (const achievement of achievements) {
      if (englishTitles.includes(achievement.title)) {
        toDelete.push(achievement.id)
      }
    }
    
    // Remove duplicates (keep the first one)
    for (const [title, achievementList] of achievementGroups.entries()) {
      if (achievementList.length > 1) {
        // Keep the first one, mark others for deletion
        for (let i = 1; i < achievementList.length; i++) {
          toDelete.push(achievementList[i].id)
        }
      }
    }
    
    // Delete marked achievements
    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('user_achievements')
        .delete()
        .in('id', toDelete)
      
      if (deleteError) {
        console.error('Error deleting duplicate achievements:', deleteError)
      } else {
        console.log(`Deleted ${toDelete.length} duplicate/English achievements`)
        // Update achievement count
        await updateAchievementCount(userId)
      }
    }
    
  } catch (error) {
    console.error('Error cleaning up achievements:', error)
  }
}