-- Task 11: Supabase Storage policies for menu item media
-- Bucket expected by backend env: SUPABASE_STORAGE_MENU_BUCKET=cheffia-menu-media
-- Path convention enforced: tenant/{tenant_id}/menus/{menu_id}/items/{file}

INSERT INTO storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
VALUES (
    'cheffia-menu-media',
    'cheffia-menu-media',
    TRUE,
    10485760,
    ARRAY[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif'
    ]::text[]
)
ON CONFLICT (id) DO UPDATE
SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "menu_media_select_tenant" ON storage.objects;
CREATE POLICY "menu_media_select_tenant"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'cheffia-menu-media'
    AND (storage.foldername(name))[1] = 'tenant'
    AND (storage.foldername(name))[2] = (public.current_tenant_id())::text
);

DROP POLICY IF EXISTS "menu_media_insert_tenant" ON storage.objects;
CREATE POLICY "menu_media_insert_tenant"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'cheffia-menu-media'
    AND (storage.foldername(name))[1] = 'tenant'
    AND (storage.foldername(name))[2] = (public.current_tenant_id())::text
);

DROP POLICY IF EXISTS "menu_media_update_tenant" ON storage.objects;
CREATE POLICY "menu_media_update_tenant"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'cheffia-menu-media'
    AND (storage.foldername(name))[1] = 'tenant'
    AND (storage.foldername(name))[2] = (public.current_tenant_id())::text
)
WITH CHECK (
    bucket_id = 'cheffia-menu-media'
    AND (storage.foldername(name))[1] = 'tenant'
    AND (storage.foldername(name))[2] = (public.current_tenant_id())::text
);

DROP POLICY IF EXISTS "menu_media_delete_tenant" ON storage.objects;
CREATE POLICY "menu_media_delete_tenant"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'cheffia-menu-media'
    AND (storage.foldername(name))[1] = 'tenant'
    AND (storage.foldername(name))[2] = (public.current_tenant_id())::text
);
