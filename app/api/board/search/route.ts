import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const channelId = searchParams.get('channel_id')
    const categoryId = searchParams.get('category_id')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      )
    }

    // Build the search query
    let messagesQuery = supabase
      .from('messages')
      .select(`
        id,
        channel_id,
        thread_id,
        content,
        message_type,
        like_count,
        created_at,
        updated_at,
        author:profiles!messages_author_id_fkey (
          id,
          username,
          display_name,
          avatar_url,
          role
        ),
        channel:channels!messages_channel_id_fkey (
          id,
          name,
          category_id,
          category:board_categories!channels_category_id_fkey (
            id,
            name,
            color
          )
        )
      `)
      .is('deleted_at', null)
      .ilike('content', `%${query.trim()}%`)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filter by channel if specified
    if (channelId) {
      messagesQuery = messagesQuery.eq('channel_id', channelId)
    }

    // Filter by category if specified
    if (categoryId) {
      messagesQuery = messagesQuery.eq('channel.category_id', categoryId)
    }

    const { data: messages, error: messagesError } = await messagesQuery

    if (messagesError) {
      console.error('Messages search error:', messagesError)
      return NextResponse.json(
        { error: 'Failed to search messages' },
        { status: 500 }
      )
    }

    // Also search for channels/categories if no specific filters
    let channels: any[] = []
    let categories: any[] = []

    if (!channelId && !categoryId) {
      // Search channels
      const { data: channelResults } = await supabase
        .from('channels')
        .select(`
          id,
          name,
          description,
          category_id,
          created_at,
          category:board_categories!channels_category_id_fkey (
            id,
            name,
            color
          )
        `)
        .or(`name.ilike.%${query.trim()}%,description.ilike.%${query.trim()}%`)
        .limit(10)

      channels = channelResults || []

      // Search categories
      const { data: categoryResults } = await supabase
        .from('board_categories')
        .select(`
          id,
          name,
          description,
          color,
          created_at
        `)
        .or(`name.ilike.%${query.trim()}%,description.ilike.%${query.trim()}%`)
        .limit(10)

      categories = categoryResults || []
    }

    return NextResponse.json({
      messages: messages || [],
      channels,
      categories,
      query: query.trim(),
      total_results: (messages?.length || 0) + channels.length + categories.length
    })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}