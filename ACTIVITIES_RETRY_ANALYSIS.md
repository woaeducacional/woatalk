# Activity Retry & Error Handling Analysis

## Summary Overview

All 5 activities use a similar pattern for handling **failed attempts** (score < threshold), but with variations in stages and complexity. Here's the complete breakdown:

---

## Activity0VideoInsight
**Complexity**: Very Low | **File**: [Activity0VideoInsight.tsx](src/components/activities/Activity0VideoInsight.tsx)

### Retry Logic
- **No retries**: One-shot video watch
- **Transition**: Directly calls `onComplete(10)` when video loads
- **Error State**: None (simple fallback for video loading failures)
- **Retry Counter**: N/A

### Flow
1. Display video info → 
2. Watch YouTube video (onLoad triggers) → 
3. Show "CONTINUAR" button → 
4. Call `onComplete(10)` → Next activity

---

## Activity1Quote
**Complexity**: High | **File**: [Activity1Quote.tsx](src/components/activities/Activity1Quote.tsx)

### Retry Logic
| Stage | Threshold | Error Message | Retries | Notes |
|-------|-----------|---------------|---------|-------|
| Choose sentence | N/A | None | - | Multiple choice only |
| Repeat chosen sentence (repeatChoice) | 70% | `Score: {score}%. Tente novamente (mínimo 70%).` | Unlimited | Show score, allow retry |
| Repeat built sentence (repeatBuilt) | 70% | Same as above | Unlimited | Shows "1ª VEZ — COM TEXTO" |
| Repeat without text (repeatNoAudio) | 70% | Same as above | **Auto-advance** | `isMemoryTask=true` — no retry UI |
| Boost repeat (boostRepeat) | 70% | Same as above | Unlimited | Shows "REPEAT" |
| Boost without audio (boostNoAudio) | 70% | Same as above | **Auto-advance** | `isMemoryTask=true` — no retry UI |

### Score Calculation
```javascript
const normalize = (s) => s.toLowerCase().replace(/[^a-z\s]/g, '').trim().split(/\s+/)
// Match word-by-word in target sentence
// Score = (matched_words / total_target_words) * 100
```

### Key Implementation
```typescript
if (isMemoryTask) {
  // Auto-advance regardless of score (no second chance)
  setTimeout(() => setStage(nextStage), 800)
} else {
  // Regular tasks: show error if below threshold
  if (s >= 70) { 
    setXpEarned((prev) => prev + xp); 
    setTimeout(() => setStage(nextStage), 800)
  } else { 
    setError(`Score: ${s}%. Tente novamente (mínimo 70%).`)
  }
}
```

### onComplete Pattern
- Accumulates `xpEarned` throughout the activity
- Final "CONTINUAR" button calls `onComplete(xpEarned)` when all stages complete
- Total XP range: 10-95 (varies by stages completed)

---

## Activity2Vocabulary
**Complexity**: High | **File**: [Activity2Vocabulary.tsx](src/components/activities/Activity2Vocabulary.tsx)

### Stages & Retry Logic
| Stage | Threshold | Error Message | Retries | Notes |
|-------|-----------|---------------|---------|-------|
| matchIntro | N/A | - | - | Info only, "COMEÇAR" button |
| matchWord | 70% | `Score: {s}%. Tente de novo (mínimo 70%).` | Unlimited | Listen to word, repeat |
| fillBlank | N/A | `❌ Tente outra opção` | Unlimited | Multiple choice, then repeat full sentence |
| fillRepeat (after correct choice) | 70% | Same as matchWord | Unlimited | Repeat the full sentence |
| speak | N/A | `Diga uma frase completa.` | Unlimited | Free speech, min 3 words |
| memory | 70% | Score shown but **auto-advance** | **Auto-advance** | `isMemoryTask=true` — repeat sentences from memory |

### Score Calculation
Same word-by-word matching as Activity1Quote

### Memory Task Behavior
```typescript
if (isMemoryTask) {
  // Auto-advance regardless of score (no second chance)
  setTimeout(onPass, 600)
} else {
  if (s >= 70) { 
    setXpEarned(p => p + xp); 
    setTimeout(onPass, 600)
  } else { 
    setError(`Score: ${s}%. Tente de novo (mínimo 70%).`)
  }
}
```

### onComplete Pattern
- Final "CONTINUAR" button calls `onComplete(xpEarned)`
- Total XP: 10 (match) + 20 (fill) + 15 (speak) + 25 (memory) = ~70 XP

---

## Activity3Expressions
**Complexity**: Very High | **File**: [Activity3Expressions.tsx](src/components/activities/Activity3Expressions.tsx)

### Stages & Retry Logic
| Stage | Threshold | Error Message | Retries | Notes |
|-------|-----------|---------------|---------|-------|
| choose | N/A | - | - | Select 2 out of 8 expressions |
| listenRepeat (2 expressions) | 70% | `Score: {s}%. Mínimo 70%. Tente de novo.` | Unlimited | Listen & repeat chosen expressions |
| completeStep (2 sentences) | N/A | - | - | Write completion about yourself |
| speakWithText (2 sentences) | 70% | Same as listenRepeat | Unlimited | Say sentences WITH text visible |
| speakNoText (2 sentences) | 70% | Same as listenRepeat | Unlimited | Say sentences WITHOUT text |
| upgrade | N/A | - | - | Choose 3 MORE expressions from remaining |
| upgradeRepeat (3 more) | 70% | Same as listenRepeat | Unlimited | Repeat the 3 additional expressions |
| final (2 sentences) | 70% | Same as listenRepeat | Unlimited | Final stage for upgraded expressions |

### Key Features
- **Two rounds**: First 2 expressions, then upgrade with 3 more = 5 total
- **Threshold parameter**: Can pass custom threshold to `record()` function
- **freeRecord()**: Special function for free speech (no scoring)

### onComplete Pattern
- Accumulates XP: 10 (listen/repeat) + 10 (complete) + 15 (speak) + XP from upgrade section
- Final "CONTINUAR" button in complete stage calls `onComplete(xpEarned)`

---

## Activity4Conversation
**Complexity**: Very High | **File**: [Activity4Conversation.tsx](src/components/activities/Activity4Conversation.tsx)

### Stages & Retry Logic
| Stage | Threshold | Error Message | Retries | Notes |
|-------|-----------|---------------|---------|-------|
| write | N/A | Word count validation | - | Write 3-4 lines in Portuguese (min 10 words) |
| translate | N/A | `Erro ao traduzir...` | 1 attempt | AI translation via `/api/translate` |
| listen | N/A | - | - | Listen to each translated sentence |
| repeat | 70% | `Score: {s}%. Mínimo 70%. Tente de novo.` | Unlimited | Repeat each sentence (multiple sentences) |
| understand | N/A | - | - | Comprehension check with text comparison |
| speakFree | **80%** | `Score: {s}%. Mínimo 80%. Tente de novo.` | Unlimited | **HIGHER THRESHOLD** — speak without hint |

### Key Differences from Others
- **80% threshold** on final speak stage (stricter than other activities' 70%)
- **AI Translation**: Requires API call — failures show error message
- **Hint toggle**: Show/hide text during speakFree stage
- **Multiple sentences**: Can have 3-4 sentences to speak through

### Score Calculation
Same word-by-word matching as others

### onComplete Pattern
- Accumulates XP: 20 (write) + 10 (translate) + 30 (repeat) + 40 (speak) = 100 XP
- Final "FINALIZAR" button calls `onComplete(xpEarned)`

---

## Error Message Display Pattern

All activities follow the same error display pattern:

```typescript
// Error state
const [error, setError] = useState('')

// Display error (red text)
{error && <p className="text-red-400 text-sm mt-2">{error}</p>}

// Clear error on new recording
setError('') // at start of record function
```

### Common Error Messages
1. **Score too low**: `Score: {score}%. Tente novamente (mínimo {threshold}%).`
2. **No speech detected**: `Nenhuma fala detectada.`
3. **Microphone blocked**: `Microfone bloqueado.`
4. **Generic speech error**: `Erro: {e.error}`
5. **Translation failed**: `Erro ao traduzir. Verifique sua conexão...`
6. **Not enough words**: `Diga uma frase completa.`

---

## onComplete Callback Pattern

All activities follow the same pattern:

```typescript
// Activity Props
interface ActivityXProps {
  onComplete: (xp: number) => void
}

// Called from final completion button
<button onClick={() => onComplete(xpEarned)}>
  CONTINUAR / FINALIZAR →
</button>

// Parent (HobbiesActivityFlow) handles transition
const handleGroupComplete = (xp: number) => {
  // 1. Save to database
  saveMissionGroupCompletion(groupId, xp)
  
  // 2. Show celebration screen
  setGroupCompleted(groupId)
  
  // 3. After 3 seconds, return to group list or phase complete
  setTimeout(() => {
    setShowGroups(true)
  }, 3600)
}
```

---

## Retry Counter Status

| Activity | Has Retry Counter | Unlimited Retries | Max Attempts |
|----------|-------------------|-------------------|--------------|
| Activity0 | ❌ No | N/A | 1 (no retry) |
| Activity1 | ❌ No | ✅ Yes | Unlimited |
| Activity2 | ❌ No | ✅ Yes | Unlimited |
| Activity3 | ❌ No | ✅ Yes | Unlimited |
| Activity4 | ❌ No | ✅ Yes | Unlimited |

### Current Behavior
- **No retry counter implemented** in any activity
- Users can **retry infinitely** on failed speech recognition attempts
- **Memory tasks** ignore scores and auto-advance (no visible retry UI)
- Score is calculated **every attempt**, error resets with next recording

---

## Memory Task Auto-Advance Pattern

Certain stages use `isMemoryTask=true` parameter to auto-advance **regardless of score**:

### Activity1Quote
- `repeatNoAudio` stage (2nd repeat without text)
- `boostNoAudio` stage (boost repeat without text)
- Final combined speak stage

### Activity2Vocabulary
- `memory` stage (all 3 memory sentences)

### Not Used in
- Activity3Expressions (all stages are scorable with UI)
- Activity4Conversation (all stages are scorable with UI)

### Implementation
```typescript
const handleRecord = async (..., isMemoryTask?: boolean) => {
  if (isMemoryTask) {
    // Auto-advance after recording finishes (no scoring UI)
    setTimeout(onPass, 800)
  } else {
    // Check score, show error if needed, allow retry
    if (s >= threshold) { ... pass ... }
    else { setError(...) }
  }
}
```

---

## Summary: Current Retry/Skip Patterns

| Aspect | Finding |
|--------|---------|
| **Retry Mechanism** | Infinite retries; no hard limit |
| **Scoring** | Word-by-word match (70% default, 80% for Activity4 final) |
| **Error Display** | Red text message in activity UI |
| **Retry Counter Display** | None — user doesn't see attempt count |
| **Memory Boost Tasks** | Auto-advance, no retry UI shown |
| **Skip/Force-Next** | No built-in skip button; must meet threshold |
| **onComplete Trigger** | Final CONTINUAR/FINALIZAR button after all stages complete |
| **XP Tracking** | Accumulated per activity, total tracked in parent |

---

## Threshold Summary

- **Activity1Quote**: 70% (all scoring stages)
- **Activity2Vocabulary**: 70% (all scoring stages)
- **Activity3Expressions**: 70% (all scoring stages)
- **Activity4Conversation**: 70% (repeat stage), **80%** (final speakFree stage)
- **Activity0VideoInsight**: No threshold (video watch only)
