const SFX = {
  click:    '/audio/clicar-iniciar.mp3',
  correct1: '/audio/acertou-bolha%201.mp3',
  correct2: '/audio/acertou-bolha%202.mp3',
  wrong:    '/audio/respondeu%20errado.mp3',
  points:   '/audio/ganhando-pontos.mp3',
  dialog:   '/audio/dialog-exemplo.mp3',
  eagle:    '/audio/som_da_aguia.mp3',
} as const

let _correctToggle = false

function play(src: string, volume = 0.75) {
  try {
    const audio = new Audio(src)
    audio.volume = volume
    audio.play().catch(() => {})
  } catch {}
}

export function playClick()   { play(SFX.click) }
export function playEagle()   { play(SFX.eagle) }
export function playCorrect() {
  _correctToggle = !_correctToggle
  play(_correctToggle ? SFX.correct1 : SFX.correct2)
}

let _bubbleToggle = false
export function playBubble() {
  _bubbleToggle = !_bubbleToggle
  play(_bubbleToggle ? SFX.correct1 : SFX.correct2)
}
export function playWrong()  { play(SFX.wrong) }
export function playPoints() { play(SFX.points) }
export function playDialog() { play(SFX.dialog, 0.5) }
