declare module 'youtube-player' {
  interface YouTubePlayerOptions {
    width?: string | number
    height?: string | number
    videoId?: string
    playerVars?: Record<string, any>
  }

  interface YouTubePlayer {
    on(event: string, callback: (data: any) => void): void
    off(event: string, callback: (data: any) => void): void
    getCurrentTime(): Promise<number>
    getDuration(): Promise<number>
    playVideo(): Promise<void>
    pauseVideo(): Promise<void>
    stopVideo(): Promise<void>
    seekTo(seconds: number): Promise<void>
    setVolume(volume: number): Promise<void>
    mute(): Promise<void>
    unmute(): Promise<void>
    getPlayerState(): Promise<number>
    destroy(): void
  }

  function YouTubePlayer(
    element: HTMLElement | string,
    options?: YouTubePlayerOptions
  ): YouTubePlayer

  export default YouTubePlayer
}
