
-- Create chat-documents storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-documents', 'chat-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: users can upload to their own folder
CREATE POLICY "Users can upload chat documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: users can read their own files
CREATE POLICY "Users can read own chat documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: users can delete their own files
CREATE POLICY "Users can delete own chat documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
