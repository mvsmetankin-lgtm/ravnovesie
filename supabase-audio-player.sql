-- Add audio_url column to audio_banners table
ALTER TABLE audio_banners
  ADD COLUMN IF NOT EXISTS audio_url text;

-- (Optional) Add a comment
COMMENT ON COLUMN audio_banners.audio_url IS 'Direct URL to mp3/ogg audio file for the mini-player';
