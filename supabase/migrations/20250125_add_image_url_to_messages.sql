-- Migration: Add image_url column to messages table
-- This enables image attachments for board messages and thread replies

-- Add image_url column to messages table
ALTER TABLE messages ADD COLUMN image_url TEXT;

-- Add index for performance (optional, for future image-related queries)
CREATE INDEX idx_messages_image_url ON messages(image_url) WHERE image_url IS NOT NULL;

-- Update the constraint to allow messages with only images (no text content required)
-- Remove the NOT NULL constraint from content if it exists
ALTER TABLE messages ALTER COLUMN content DROP NOT NULL;

-- Add a check constraint to ensure either content or image_url is provided
ALTER TABLE messages ADD CONSTRAINT check_content_or_image 
  CHECK (
    (content IS NOT NULL AND content != '') OR 
    (image_url IS NOT NULL AND image_url != '')
  );

COMMENT ON COLUMN messages.image_url IS 'URL of attached image stored in Supabase Storage';