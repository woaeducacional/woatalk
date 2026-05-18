# 🎨 Sistema de Upload de Ícones para Jornadas

## Visão Geral

O sistema de jornadas do WOA Talk agora permite upload de ícones customizados para capas de jornada. Os ícones são armazenados no **Supabase Storage** com uma nomenclatura padrão e exibidos no dashboard.

## Nomenclatura Padrão

Os ícones de jornada seguem a seguinte convenção de nomenclatura:

```
journeys/icons/phase-{phaseId}.{ext}
```

### Exemplos:

- `journeys/icons/phase-1.png` — Ícone da jornada 1 (Pacific Ocean)
- `journeys/icons/phase-2.jpeg` — Ícone da jornada 2 (Atlantic Ocean)
- `journeys/icons/phase-3.webp` — Ícone da jornada 3
- `journeys/icons/phase-99.svg` — Ícone da jornada 99

### Componentes da Nomenclatura:

- **Prefixo**: `journeys/icons/` — Identifica o tipo e localização do asset
- **Nome base**: `phase-{phaseId}` — Identifica a jornada pelo seu ID numérico
- **Extensão**: Formato do arquivo suportado

## Formatos Suportados

Os seguintes formatos de imagem são aceitos:

| Formato | MIME Type | Extensão | Recomendado? |
|---------|-----------|----------|--------------|
| PNG | `image/png` | `.png` | ✅ **Sim** |
| JPEG | `image/jpeg` | `.jpg`, `.jpeg` | ✅ **Sim** |
| WebP | `image/webp` | `.webp` | ✅ Sim |
| GIF | `image/gif` | `.gif` | ⚠️ Para animações |
| SVG | `image/svg+xml` | `.svg` | ✅ Para ícones vetoriais |

### Recomendações:

- **PNG**: Qualidade desejável com transparência
- **WebP**: Melhor compressão (tamanho menor)
- **SVG**: Ideal para ícones simples (escalável, arquivo pequeno)
- **Evite GIF**: Tamanho maior, use animações CSS se necessário

## Limitações

- **Tamanho máximo**: 5 MB por arquivo
- **Dimensões recomendadas**: 256×256 px até 512×512 px (quadrado)
- **Transparência**: Suportada (PNG, WebP, SVG)
- **Nomeação**: Apenas caracteres alfanuméricos em `phase-{phaseId}`

## Como Fazer Upload

### 1. **Criar Nova Jornada**

1. Vá para `/admin`
2. Clique em "Criar a primeira jornada" (se nenhuma existir) ou passe para a próxima jornada
3. Preencha o **Passo 1 — Fase**:
   - Título da Jornada
   - Descrição
   - **Ícone de Capa** ← Novo! 🎨
4. Clique em "📁 Escolher arquivo"
5. Selecione o arquivo da imagem
6. O ícone será automaticamente renomeado para `phase-{phaseId}.{ext}` durante o upload
7. Prossiga para os próximos passos
8. Clique "🚀 Criar Jornada" para publicar

### 2. **Editar Jornada Existente**

1. Vá para `/admin`
2. Encontre a jornada desejada na lista
3. Clique em "✏️ EDITAR"
4. Procure a seção "📋 Informações Gerais"
5. Clique em "📁 Escolher arquivo" para atualizar o ícone
6. Se quiser remover: clique em "✕ Remover"
7. Clique "💾 Salvar" no topo da página

## API de Upload

### Endpoint

```
POST /api/admin/journey/upload-icon
```

### Autenticação

Requer sessão autenticada com `role === 'admin'`

### Request

```bash
curl -X POST http://localhost:3001/api/admin/journey/upload-icon \
  -F "file=@my-icon.png" \
  -F "phaseId=1"
```

### Response (Sucesso - 200)

```json
{
  "success": true,
  "url": "https://xxxxx.supabase.co/storage/v1/object/public/journey-assets/journeys/icons/phase-1.png",
  "path": "journeys/icons/phase-1.png",
  "fileName": "phase-1.png",
  "message": "Ícone enviado com sucesso: phase-1.png"
}
```

### Response (Erro - 400/500)

```json
{
  "error": "Tipo de arquivo não permitido. Use: PNG, JPEG, WebP, GIF ou SVG"
}
```

## Banco de Dados

O campo `icon_url` é armazenado na tabela `journey_content`:

```sql
ALTER TABLE journey_content
ADD COLUMN icon_url VARCHAR(500);

COMMENT ON COLUMN journey_content.icon_url IS 
  'URL pública do ícone de capa da jornada no Supabase Storage.
   Formato: journeys/icons/phase-{phaseId}.{ext}';
```

### Tipo TypeScript

```typescript
interface JourneyContent {
  phase_id: number
  title: string
  description: string
  icon_url?: string  // ← Novo campo
  // ... outros campos
}
```

## Dashboard

Os ícones são exibidos no carrossel de jornadas no dashboard (`/dashboard`):

1. Se `icon_url` está preenchido: **exibe o ícone do Supabase Storage**
2. Se `icon_url` está vazio: **fallback para `/images/jornada-secreta.png`** (ícone padrão de jornada secreta)
3. Se jornada está bloqueada: **exibe gradiente cinzento + ícone em escala cinza**

## Fallback Padrão

Quando nenhuma foto/ícone é enviado, o sistema usa automaticamente:

```
/images/jornada-secreta.png
```

Este é o ícone padrão que aparece em todas as jornadas sem upload customizado.

## Migração de Ícones Existentes (Opcional)

Os ícones anteriores (`icon_pacifico.png`, `icon_indico.png`, `icon_atlantico.png`) ainda existem em `/public/images/`, mas agora o sistema usa `jornada-secreta.png` como padrão universal.

Passos:

```bash
# Ir para /admin
# Para cada jornada onde deseja customizar:
#   1. Clique ✏️ EDITAR
#   2. Procure "Informações Gerais"
#   3. Clique "📁 Escolher arquivo"
#   4. Selecione seu ícone customizado
#   5. Clique "💾 Salvar"
#
# Se não fizer upload, o ícone padrão 'jornada-secreta.png' será usado
```

## Segurança

- ✅ Only admins can upload
- ✅ Validação de tipo MIME
- ✅ Validação de tamanho (máx 5MB)
- ✅ Upsert automático (sobrescreve antigos)
- ✅ URLs públicas geradas via Supabase RLS

## Troubleshooting

### "Erro ao fazer upload: 403 - Storage bucket not found"

**Solução**: Verifique que o bucket `journey-assets` existe no Supabase Storage.

```bash
# No console Supabase:
# Storage → journey-assets → Create bucket (se não existir)
```

### "Arquivo muito grande. Máximo: 5MB"

**Solução**: Reduza o tamanho do arquivo. Use:
- ImageMagick: `convert input.png -resize 512x512 output.png`
- Compressores online: tinypng.com, squoosh.app

### "Tipo de arquivo não permitido"

**Solução**: Certifique-se de usar um dos formatos suportados: PNG, JPEG, WebP, GIF, SVG

### O ícone não aparece no dashboard após upload

**Solução**:
1. Recarregue a página (`F5` ou `Cmd+Shift+R`)
2. Verifique se `icon_url` está preenchido na edição da jornada
3. Verifique o browser console para erros de CORS

## Exemplos de Ícones Recomendados

### Estrutura de Pasta Local (antes de upload)

```
assets/journey-icons/
├── pacific-ocean.png      (256×256, PNG, 50KB)
├── atlantic-ocean.webp    (256×256, WebP, 30KB)
├── indian-ocean.svg       (vetorial, SVG, 15KB)
└── arctic-ocean.jpg       (256×256, JPEG, 40KB)
```

### Antes do Upload

Renomear localmente para clareza:
- `phase-1.png` ← Pacific Ocean
- `phase-2.webp` ← Atlantic Ocean
- `phase-3.svg` ← Indian Ocean
- `phase-4.jpg` ← Arctic Ocean

### Após Upload

Arquivos no Supabase Storage em `journey-assets/journeys/icons/`:
```
phase-1.png
phase-2.webp
phase-3.svg
phase-4.jpg
```

## Ver Arquivo Carregado

### No Supabase Console

1. Vá para Supabase Dashboard
2. Clique em "Storage"
3. Selecione bucket "journey-assets"
4. Navegue para `journeys/icons/`
5. Você verá todos os ícones carregados

### No Frontend

```typescript
// Os ícones aparecem automaticamente no dashboard
// URL pública: https://{supabase-url}/storage/v1/object/public/journey-assets/journeys/icons/phase-{phaseId}.{ext}
```

---

## Resumo Rápido

| Ação | Local |
|------|-------|
| **Criar jornada com ícone** | `/admin/journey-content/new` — Passo 1 |
| **Editar ícone de jornada** | `/admin/journey-content/{phaseId}` — Seção "Informações Gerais" |
| **Ver ícones carregados** | Supabase Dashboard → Storage → journey-assets → journeys/icons/ |
| **Nomenclatura** | `journeys/icons/phase-{phaseId}.{ext}` |
| **Formatos** | PNG, JPEG, WebP, GIF, SVG |
| **Tamanho máx** | 5 MB |

