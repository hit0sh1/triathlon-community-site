import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface BoardMessagePageProps {
  params: Promise<{
    messageId: string;
  }>;
}

async function getMessageDetails(messageId: string) {
  const supabase = createServerComponentClient({ cookies });
  
  const { data: message, error } = await supabase
    .from('messages')
    .select(`
      id,
      content,
      created_at,
      channel_id,
      profiles!user_id (
        username,
        display_name
      ),
      channels!channel_id (
        name,
        board_categories (
          name
        )
      )
    `)
    .eq('id', messageId)
    .is('deleted_at', null)
    .is('thread_id', null)
    .single();

  if (error || !message) {
    return null;
  }

  return message;
}

export async function generateMetadata(
  { params }: BoardMessagePageProps
): Promise<Metadata> {
  const { messageId } = await params;
  const message = await getMessageDetails(messageId);

  if (!message) {
    return {
      title: '投稿が見つかりません',
      description: '指定された投稿は存在しないか、削除されています。',
    };
  }

  const profile = Array.isArray(message.profiles) ? message.profiles[0] : message.profiles;
  const channel = Array.isArray(message.channels) ? message.channels[0] : message.channels;
  const category = Array.isArray(channel?.board_categories) ? channel?.board_categories[0] : channel?.board_categories;
  const author = profile?.display_name || profile?.username || '匿名ユーザー';
  const channelName = channel?.name || '不明なチャンネル';
  const categoryName = category?.name || '掲示板';
  const content = message.content || '';
  const truncatedContent = content.length > 100 ? content.substring(0, 100) + '...' : content;

  const ogImageUrl = new URL('/api/og', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
  ogImageUrl.searchParams.set('title', `${categoryName} - ${channelName}`);
  ogImageUrl.searchParams.set('content', truncatedContent);
  ogImageUrl.searchParams.set('author', author);
  ogImageUrl.searchParams.set('type', 'board');

  return {
    title: `${author}の投稿 - ${channelName} | 沖縄トライアスロンコミュニティ`,
    description: truncatedContent || `${author}が${channelName}に投稿しました`,
    openGraph: {
      title: `${categoryName} - ${channelName}`,
      description: truncatedContent || `${author}からの投稿`,
      images: [
        {
          url: ogImageUrl.toString(),
          width: 1200,
          height: 630,
          alt: `${author}の投稿 - ${channelName}`,
        },
      ],
      type: 'article',
      siteName: '沖縄トライアスロンコミュニティ',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${categoryName} - ${channelName}`,
      description: truncatedContent || `${author}からの投稿`,
      images: [ogImageUrl.toString()],
    },
  };
}

export default async function BoardMessagePage({ params }: BoardMessagePageProps) {
  const { messageId } = await params;
  const message = await getMessageDetails(messageId);

  if (!message) {
    notFound();
  }

  // メッセージが存在する場合、メインの掲示板ページにリダイレクト
  // URLにはスレッドを開くためのクエリパラメータを含める
  redirect(`/board?thread=${messageId}`);
}