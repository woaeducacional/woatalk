# Azure Content Safety - Moderação de Fotos de Perfil

## ⚠️ Importante
**Azure Content Moderator foi deprecado em fevereiro de 2024** e será retirado em 13 de março de 2027. Use **Azure AI Content Safety** em seu lugar, que é mais moderno e poderoso.

---

## 1. SETUP - Criar Recurso Azure

### 1.1 No Azure Portal
1. Vá para [Azure Portal](https://portal.azure.com/)
2. Clique em **"+ Criar recurso"**
3. Procure por **"Content Safety"**
4. Clique em **"Criar"**
5. Preencha:
   - **Grupo de recursos**: Crie novo ou selecione existente
   - **Região**: `East US`, `West Europe`, `Southeast Asia` (verificar disponibilidade)
   - **Plano de preços**: `Standard S0` (recomendado para produção)
6. Clique em **"Revisar + Criar"** e depois **"Criar"**

### 1.2 Obter Credenciais
Após criar o recurso:
1. Vá em **"Chaves e Ponto de Extremidade"**
2. Copie:
   - **Chave** (Key 1 ou Key 2)
   - **Ponto de Extremidade** (Endpoint)

---

## 2. INSTALAR SDK

```bash
npm install @azure-rest/ai-content-safety
```

---

## 3. IMPLEMENTAÇÃO EM NEXT.JS

### 3.1 Variáveis de Ambiente

Crie/atualize `.env.local`:

```env
AZURE_CONTENT_SAFETY_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_CONTENT_SAFETY_KEY=your-api-key-here
```

### 3.2 Rota API para Moderação de Imagem

Crie `app/api/admin/moderate-image/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { ContentSafetyClient, ImageData } from '@azure-rest/ai-content-safety'
import { AzureKeyCredential } from '@azure/core-auth'

const endpoint = process.env.AZURE_CONTENT_SAFETY_ENDPOINT!
const key = process.env.AZURE_CONTENT_SAFETY_KEY!

interface ModerationResult {
  isApproved: boolean
  categoriesDetected: {
    violence: number
    selfHarm: number
    sexualContent: number
    hatefulContent: number
  }
  severity: 'safe' | 'low_risk' | 'medium_risk' | 'high_risk'
  reason?: string
}

async function moderateImageUrl(imageUrl: string): Promise<ModerationResult> {
  const client = new ContentSafetyClient(endpoint, new AzureKeyCredential(key))

  const analyzeImageOption = {
    image: {
      url: imageUrl,
    } as ImageData,
  }

  const analysisResult = await client
    .path('/image:analyze')
    .post({
      body: analyzeImageOption,
    })

  const result = analysisResult.body as any

  // Extrair categorias e severidades
  const categories = result.categoriesAnalysis

  // Definir severity baseado nos scores
  let maxScore = 0
  let severity: 'safe' | 'low_risk' | 'medium_risk' | 'high_risk' = 'safe'

  for (const category of categories) {
    const score = category.severity || 0
    maxScore = Math.max(maxScore, score)
  }

  if (maxScore <= 0) severity = 'safe'
  else if (maxScore <= 2) severity = 'low_risk'
  else if (maxScore <= 4) severity = 'medium_risk'
  else severity = 'high_risk'

  // Tema: aprovar apenas se for "safe" ou "low_risk"
  const isApproved = severity === 'safe' || severity === 'low_risk'

  return {
    isApproved,
    categoriesDetected: {
      violence: categories.find((c: any) => c.category === 'Violence')?.severity || 0,
      selfHarm: categories.find((c: any) => c.category === 'SelfHarm')?.severity || 0,
      sexualContent: categories.find((c: any) => c.category === 'Sexual')?.severity || 0,
      hatefulContent: categories.find((c: any) => c.category === 'Hate')?.severity || 0,
    },
    severity,
    reason: isApproved ? undefined : `Conteúdo potencialmente inadequado detectado (${severity})`,
  }
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'imageUrl é obrigatório' },
        { status: 400 }
      )
    }

    const result = await moderateImageUrl(imageUrl)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Erro na moderação:', error)
    return NextResponse.json(
      { error: 'Erro ao moderar imagem' },
      { status: 500 }
    )
  }
}
```

### 3.3 Integrar com Upload de Avatar

Atualize a rota de upload de avatar em `app/api/user/upload-avatar/route.ts` (crie se não existir):

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'File é obrigatório' }, { status: 400 })
    }

    // 1. Upload para Cloudinary
    const buffer = await file.arrayBuffer()
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'woatalk/avatars', resource_type: 'auto' },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
      uploadStream.end(Buffer.from(buffer))
    })

    const imageUrl = (uploadResult as any).secure_url

    // 2. Moderar imagem com Azure
    const moderationResponse = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/moderate-image`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      }
    )

    const moderationResult = await moderationResponse.json()

    if (!moderationResult.isApproved) {
      // Se rejeitado, deletar imagem do Cloudinary
      const publicId = (uploadResult as any).public_id
      await cloudinary.uploader.destroy(publicId)

      return NextResponse.json(
        {
          error: 'Imagem rejeitada pela moderação',
          reason: moderationResult.reason,
          details: moderationResult.categoriesDetected,
        },
        { status: 400 }
      )
    }

    // 3. Salvar URL no banco de dados
    const supabase = createSupabaseClient() // sua função de cliente Supabase
    const { error: dbError } = await supabase
      .from('users')
      .update({ avatar_url: imageUrl })
      .eq('email', session.user.email)

    if (dbError) {
      throw new Error(`Erro ao salvar no DB: ${dbError.message}`)
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      moderationDetails: {
        severity: moderationResult.severity,
        categories: moderationResult.categoriesDetected,
      },
    })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer upload' },
      { status: 500 }
    )
  }
}
```

---

## 4. CATEGORIAS DE CONTEÚDO

Azure AI Content Safety detecta:

| Categoria | Descrição | Severidade |
|-----------|-----------|-----------|
| **Violence** | Conteúdo violento, ferimentos, sangue | 0-6 |
| **Self-Harm** | Automutilação, suicídio | 0-6 |
| **Sexual** | Conteúdo sexual, nudez | 0-6 |
| **Hate** | Discurso de ódio, discriminação | 0-6 |

**Severidade:**
- `0`: Safe (Seguro)
- `2`: Low (Baixo risco)
- `4`: Medium (Médio risco)
- `6`: High (Alto risco)

---

## 5. FILTROS RECOMENDADOS PARA PERFIS

```typescript
// Política recomendada para avatares
const MODERATION_POLICY = {
  allowedSeverities: [0, 2], // Permitir "Safe" e "Low risk"
  categories: {
    violence: 2,     // Máximo "Low"
    selfHarm: 0,     // Não permitir
    sexualContent: 2, // Máximo "Low"
    hatefulContent: 0, // Não permitir
  }
}
```

---

## 6. EXEMPLO DE COMPONENTE PARA UPLOAD

```typescript
// src/components/AvatarUpload.tsx
'use client'

import { useState } from 'react'
import { playClick } from '@/lib/sounds'

export function AvatarUpload() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/user/upload-avatar', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.reason || data.error || 'Erro ao fazer upload')
        return
      }

      setSuccess(true)
      playClick()
      // Recarregar página ou atualizar estado
      setTimeout(() => window.location.reload(), 1500)
    } catch (err) {
      setError('Erro ao conectar ao servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={loading}
        className="block w-full text-sm"
      />
      {error && <p className="text-red-500 text-xs">{error}</p>}
      {success && <p className="text-green-500 text-xs">✓ Avatar atualizado com sucesso!</p>}
      {loading && <p className="text-blue-400 text-xs">Processando...</p>}
    </div>
  )
}
```

---

## 7. CUSTOS

| Operação | Preço (USD) | Limite |
|----------|-----------|--------|
| Análise de Imagem | $2 por 1.000 chamadas | ~1M requisições/mês no S0 |
| Armazenamento de lista customizada | $10/mês | Incluído no plano |

---

## 8. MONITORAMENTO E LOGS

Recomendações:
- Log todas as rejeições de imagem em um banco de dados
- Criar dashboard de moderação para revisar rejeitadas
- Implementar fila (Bull Queue) para processamento assíncrono em escala

```typescript
// Exemplo: Log de rejeição
interface ModerationLog {
  userId: string
  timestamp: Date
  imageUrl: string
  categories: Record<string, number>
  severity: string
  reason: string
  approved: boolean
}

// Salvar no banco de dados
await supabase.from('moderation_logs').insert([moderationLog])
```

---

## 9. ALTERNATIVAS

Se preferir outras soluções:

- **AWS Rekognition**: Similar, focado em reconhecimento de conteúdo
- **Google Cloud Vision API**: Análise de imagens robusta
- **Open Moderation APIs**: Soluções open-source como Perspective API do Google
- **Moderação Manual**: Fila de revisão para imagens com score médio

---

## 10. PRÓXIMOS PASSOS

1. ✅ Criar recurso Azure AI Content Safety
2. ✅ Instalar SDK
3. ✅ Implementar rotas API
4. ✅ Integrar com upload de avatar
5. ✅ Testar com diferentes imagens
6. ✅ Adicionar logging e monitoramento
7. ✅ Criar painel administrativo de moderação
