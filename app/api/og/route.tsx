import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || '沖縄トライアスロンコミュニティ';
    const content = searchParams.get('content') || 'トライアスロン、サイクリング、ランニングを愛する人々のコミュニティ';
    const author = searchParams.get('author') || '';
    const type = searchParams.get('type') || 'board';
    
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontFamily: 'Inter, sans-serif'
          }}
        >
          {/* ヘッダー */}
          <div
            style={{
              position: 'absolute',
              top: 40,
              left: 60,
              display: 'flex',
              alignItems: 'center',
              color: 'white',
              fontSize: 24,
              fontWeight: 'bold'
            }}
          >
            🏃‍♂️ 沖縄トライアスロンコミュニティ
          </div>
          
          {/* メインコンテンツエリア */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px',
              margin: '40px',
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '20px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              maxWidth: '800px',
              width: '90%'
            }}
          >
            {/* タイトル */}
            <div
              style={{
                fontSize: 48,
                fontWeight: 'bold',
                color: '#1e293b',
                textAlign: 'center',
                lineHeight: 1.2,
                marginBottom: '20px'
              }}
            >
              {title}
            </div>
            
            {/* コンテンツ */}
            <div
              style={{
                fontSize: 24,
                color: '#64748b',
                textAlign: 'center',
                lineHeight: 1.4,
                marginBottom: author ? '30px' : '0'
              }}
            >
              {content.length > 120 ? content.substring(0, 120) + '...' : content}
            </div>
            
            {/* 作者情報 */}
            {author && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: 20,
                  color: '#475569',
                  fontWeight: '500'
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: 'bold'
                  }}
                >
                  {author.charAt(0).toUpperCase()}
                </div>
                by {author}
              </div>
            )}
          </div>
          
          {/* フッター */}
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              right: 60,
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: 18
            }}
          >
            {type === 'board' && '💬 掲示板'}
            {type === 'event' && '📅 イベント'}
            {type === 'course' && '🚴 コース'}
            {type === 'cafe' && '☕ カフェ'}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.error('OG Image Generation Error:', e.message);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}