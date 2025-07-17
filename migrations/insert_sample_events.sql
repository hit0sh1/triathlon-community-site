-- サンプル大会データを挿入

-- 沖縄トライアスロン大会
INSERT INTO events (
  id, name, event_type, event_date, location, description, 
  entry_status, max_participants, current_participants, 
  entry_fee, image_url, website_url
) VALUES (
  gen_random_uuid(), '沖縄トライアスロン大会', 'トライアスロン', '2024-09-15', 
  '宜野湾海浜公園', '沖縄の美しい海でのスイムからスタートする本格的なトライアスロン大会。', 
  'エントリー受付中', 500, 450, 
  '一般: 15,000円', 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=800&auto=format&fit=crop',
  'https://example.com/okinawa-triathlon'
);

-- 首里城マラソン
INSERT INTO events (
  id, name, event_type, event_date, location, description, 
  entry_status, max_participants, current_participants, 
  entry_fee, image_url, website_url
) VALUES (
  gen_random_uuid(), '首里城マラソン', 'マラソン', '2024-08-20', 
  '首里城公園', '歴史ある首里城を巡る風光明媚なマラソン大会。', 
  'エントリー受付中', 1500, 1200, 
  '一般: 8,000円', 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&auto=format&fit=crop',
  'https://example.com/shuri-marathon'
);

-- 海中道路サイクリング
INSERT INTO events (
  id, name, event_type, event_date, location, description, 
  entry_status, max_participants, current_participants, 
  entry_fee, image_url, website_url
) VALUES (
  gen_random_uuid(), '海中道路サイクリング', 'サイクリング', '2024-08-05', 
  '海中道路', '絶景の海中道路を走る人気のサイクリングイベント。', 
  'エントリー受付中', 300, 280, 
  '一般: 3,000円', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop',
  'https://example.com/kaichu-cycling'
);

-- 美ら海スイム
INSERT INTO events (
  id, name, event_type, event_date, location, description, 
  entry_status, max_participants, current_participants, 
  entry_fee, image_url, website_url
) VALUES (
  gen_random_uuid(), '美ら海スイム', 'スイム', '2024-07-30', 
  '美ら海水族館前ビーチ', '透明度抜群の美ら海でのオープンウォータースイム。', 
  'エントリー終了', 200, 200, 
  '一般: 5,000円', 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&auto=format&fit=crop',
  'https://example.com/churaumi-swim'
);

-- 沖縄アイアンマン
INSERT INTO events (
  id, name, event_type, event_date, location, description, 
  entry_status, max_participants, current_participants, 
  entry_fee, image_url, website_url
) VALUES (
  gen_random_uuid(), '沖縄アイアンマン', 'トライアスロン', '2024-11-03', 
  '読谷村', '世界レベルのロングディスタンス・トライアスロン大会。', 
  'エントリー開始前', 2000, 0, 
  '一般: 50,000円', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop',
  'https://example.com/okinawa-ironman'
);

-- 距離情報の挿入
-- 沖縄トライアスロン大会の距離
INSERT INTO event_distances (event_id, discipline, distance) 
SELECT id, 'swim', '1.5km' FROM events WHERE name = '沖縄トライアスロン大会';
INSERT INTO event_distances (event_id, discipline, distance) 
SELECT id, 'bike', '40km' FROM events WHERE name = '沖縄トライアスロン大会';
INSERT INTO event_distances (event_id, discipline, distance) 
SELECT id, 'run', '10km' FROM events WHERE name = '沖縄トライアスロン大会';

-- 首里城マラソンの距離
INSERT INTO event_distances (event_id, discipline, distance) 
SELECT id, 'run', '42.195km' FROM events WHERE name = '首里城マラソン';

-- 海中道路サイクリングの距離
INSERT INTO event_distances (event_id, discipline, distance) 
SELECT id, 'bike', '80km' FROM events WHERE name = '海中道路サイクリング';

-- 美ら海スイムの距離
INSERT INTO event_distances (event_id, discipline, distance) 
SELECT id, 'swim', '3km' FROM events WHERE name = '美ら海スイム';

-- 沖縄アイアンマンの距離
INSERT INTO event_distances (event_id, discipline, distance) 
SELECT id, 'swim', '3.8km' FROM events WHERE name = '沖縄アイアンマン';
INSERT INTO event_distances (event_id, discipline, distance) 
SELECT id, 'bike', '180km' FROM events WHERE name = '沖縄アイアンマン';
INSERT INTO event_distances (event_id, discipline, distance) 
SELECT id, 'run', '42.195km' FROM events WHERE name = '沖縄アイアンマン';