# Avatar Upload Strategy & Implementation Guide

## Overview
Avatar uploads will be stored in a cloud storage service (Supabase Storage, AWS S3, or similar) with a standardized naming convention and metadata stored in the database.

## File Storage Convention

### Naming Pattern
```
perfil-{userId}.{extension}
```

**Examples:**
- `perfil-550e8400-e29b-41d4-a716-446655440000.jpg`
- `perfil-john-doe-123.png`
- `perfil-user-abc123.webp`

### Storage Path Structure
```
/avatars/
├── perfil-{userId}.jpg
├── perfil-{userId}.png
└── ...
```

## Database Schema
The `users` table includes:
- `avatar_url` (VARCHAR 255) - Full URL or storage path to the avatar image
- `updated_at` (TIMESTAMP) - Track when profile was last modified

## Implementation Steps

### 1. Backend API Endpoint
Create `app/api/user/profile/route.ts` to handle profile updates including avatar uploads:

```typescript
// POST /api/user/profile (with multipart/form-data)
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { supabase } from '@/lib/supabaseClient'
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const userId = session.user.id
    let avatarUrl = null

    // Handle avatar file upload
    const avatarFile = formData.get('avatar') as File
    if (avatarFile && avatarFile.size > 0) {
      const extension = getFileExtension(avatarFile.name)
      const fileName = `perfil-${userId}.${extension}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, {
          upsert: true, // Replace if exists
          contentType: avatarFile.type,
        })

      if (uploadError) {
        return NextResponse.json(
          { error: 'Failed to upload avatar' },
          { status: 500 }
        )
      }

      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)
      avatarUrl = publicUrl.publicUrl
    }

    // Extract other profile fields
    const profileData = {
      nickname: formData.get('nickname') || null,
      phone: formData.get('phone') || null,
      bio: formData.get('bio') || null,
      country: formData.get('country') || null,
      language: formData.get('language') || 'pt-BR',
      gender: formData.get('gender') || null,
      ...(avatarUrl && { avatar_url: avatarUrl }),
      updated_at: new Date().toISOString(),
    }

    // Update user profile in database
    const { error: updateError } = await supabase
      .from('users')
      .update(profileData)
      .eq('email', session.user.email)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      avatar_url: avatarUrl,
      message: 'Profile updated successfully',
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getFileExtension(fileName: string): string {
  const ext = path.extname(fileName).slice(1).toLowerCase()
  return ext || 'jpg'
}
```

### 2. Frontend Integration
Update `app/profile/page.tsx` to call the backend API:

```typescript
const handleSave = async () => {
  setSaving(true)
  try {
    const formDataToSend = new FormData()
    
    // Add file if avatar was changed
    if (fileInputRef.current?.files?.[0]) {
      formDataToSend.append('avatar', fileInputRef.current.files[0])
    }
    
    // Add other fields
    formDataToSend.append('nickname', formData.nickname || '')
    formDataToSend.append('phone', formData.phone || '')
    formDataToSend.append('bio', formData.bio || '')
    formDataToSend.append('country', formData.country || '')
    formDataToSend.append('language', formData.language || 'pt-BR')
    formDataToSend.append('gender', formData.gender || '')

    const response = await fetch('/api/user/profile', {
      method: 'POST',
      body: formDataToSend,
    })

    if (!response.ok) {
      throw new Error('Failed to save profile')
    }

    const data = await response.json()
    setProfile(formData)
    playClick()
  } catch (error) {
    console.error('Failed to save profile:', error)
    // Show error toast/notification
  } finally {
    setSaving(false)
  }
}
```

### 3. Supabase Storage Setup

In your Supabase dashboard:
1. Create a new public bucket called `avatars`
2. Set policies to allow authenticated users to upload/read:

```sql
-- Allow authenticated users to upload avatars
CREATE POLICY "Allow users to upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

## File Size & Type Restrictions

Recommended client-side validation:
- **Max size:** 5-10 MB
- **Allowed types:** `image/jpeg`, `image/png`, `image/webp`
- **Recommended dimensions:** 400x400 - 1000x1000 px

Add to profile form:
```typescript
const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  // Validate size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    console.error('File too large. Max 5MB.')
    return
  }

  // Validate type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    console.error('Invalid file type. Use JPG, PNG, or WebP.')
    return
  }

  const reader = new FileReader()
  reader.onload = (event) => {
    const result = event.target?.result as string
    setAvatarPreview(result)
    setFormData((prev) => ({ ...prev, avatar: result }))
    playClick()
  }
  reader.readAsDataURL(file)
}
```

## Avatar Display

Update the profile page to fetch and display saved avatar:

```typescript
// In useEffect after session loads
const { data: profileData } = await supabase
  .from('users')
  .select('*')
  .eq('email', session.user.email)
  .single()

if (profileData?.avatar_url) {
  setAvatarPreview(profileData.avatar_url)
}

setProfile(profileData)
setFormData(profileData)
setLoading(false)
```

## Benefits of This Approach

✅ **Scalable** - Cloud storage handles large files efficiently
✅ **Consistent** - Naming convention ensures predictability
✅ **Optimized** - CDN delivery for fast image loading
✅ **Tidy** - Old avatars auto-replaced (upsert: true)
✅ **Secure** - Storage policies control access
✅ **Flexible** - Easy to migrate providers if needed

## Testing Checklist

- [ ] Upload JPG, PNG, WebP files
- [ ] Verify file size validation (try > 5MB)
- [ ] Confirm naming convention (`perfil-{userId}.ext`)
- [ ] Check avatar persistence after page reload
- [ ] Test updating avatar multiple times
- [ ] Verify other profile fields save correctly
- [ ] Load profile from fresh login session
