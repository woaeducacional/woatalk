'use client';

import React, { useState, useRef } from 'react';
import { getSpeechRecognition } from '@/src/lib/speechRecognition';

interface Activity3Props {
  onComplete: (xp: number) => void;
  onSelectSentences?: (sentences: Set<string>) => void;
}

export const Activity3SelectTwoRepeat: React.FC<Activity3Props> = ({ onComplete, onSelectSentences })=> {
  const SENTENCES = [
    'I enjoy watching movies in my free time.',
    'I like listening to music when I want to relax.',
    'My favorite hobby is playing soccer.',
    'In my free time, I read books.',
    'I enjoy learning new things.',
    'I usually go to the gym after work.',
    'I like to travel on weekends.',
    'I spend my free time with my family.',
  ];

  const AUDIO_MAP: Record<string, string> = {
    'I enjoy watching movies in my free time.': '/audio/I_enjoy_watching_movies_in_my_free_time.mp3',
    'I like listening to music when I want to relax.': '/audio/I_like_listening_to_music_when_I_want_to_relax.mp3',
    'My favorite hobby is playing soccer.': '/audio/My_favorite_hobby_is_playing_soccer.mp3',
    'In my free time, I read books.': '/audio/In_my_free_time,_I_read_books.mp3',
    'I enjoy learning new things.': '/audio/I_enjoy_learning_new_things.mp3',
    'I usually go to the gym after work.': '/audio/I_usually_go_to_the_gym_after_work.mp3',
    'I like to travel on weekends.': '/audio/I_like_to_travel_on_weekends.mp3',
    'I spend my free time with my family.': '/audio/I_spend_my_free_time_with_my_family.mp3',
  };

  const [step, setStep] = useState<'select' | 'listen-repeat'>('select');
  const [selectedSentences, setSelectedSentences] = useState<Set<string>>(new Set());
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [wordFeedback, setWordFeedback] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [completedSentences, setCompletedSentences] = useState<Set<string>>(new Set());

  const audioRef = useRef<HTMLAudioElement>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef('');

  // Toggle sentence selection
  const toggleSentence = (sentence: string) => {
    const updated = new Set(selectedSentences);
    if (updated.has(sentence)) {
      updated.delete(sentence);
    } else if (updated.size < 2) {
      updated.add(sentence);
    }
    setSelectedSentences(updated);
  };

  // Start listen-repeat phase
  const handleStartRepeat = () => {
    if (selectedSentences.size === 2) {
      setStep('listen-repeat');
      setCurrentSentenceIdx(0);
    }
  };

  // Play audio
  const handleListen = async () => {
    const sentences = Array.from(selectedSentences);
    const sentence = sentences[currentSentenceIdx];
    const audioPath = AUDIO_MAP[sentence];

    if (audioRef.current && audioPath) {
      audioRef.current.src = audioPath;
      audioRef.current.load();
      await audioRef.current.play();
    }
  };

  // Compute word accuracy
  const computeWordDiff = (correct: string, spoken: string): string[] => {
    // Remove punctuation and split into words
    const cleanWord = (word: string) => word.toLowerCase().replace(/[.,!?;:'"()]/g, '');
    const correctWords = new Set(
      correct
        .toLowerCase()
        .split(/\s+/)
        .map(cleanWord)
        .filter(Boolean)
    );
    const spokenWords = new Set(
      spoken
        .toLowerCase()
        .split(/\s+/)
        .map(cleanWord)
        .filter(Boolean)
    );
    return correct
      .toLowerCase()
      .split(/\s+/)
      .map(cleanWord)
      .filter(Boolean)
      .map((word) => (spokenWords.has(word) ? '✓' : '✗'));
  };

  // Handle speech recognition
  const handleRepeat = async () => {
    if (isRecording) return;

    const SpeechRecognitionAPI = getSpeechRecognition();
    if (!SpeechRecognitionAPI) {
      alert('Speech Recognition not supported in your browser.');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    setIsRecording(true);
    setTranscript('');
    setWordFeedback([]);

    const resetSilenceTimeout = () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      silenceTimeoutRef.current = setTimeout(() => {
        recognition.stop();
      }, 3000);
    };

    recognition.onstart = () => {
      console.log('Speech recognition started');
    };

    recognition.onresult = (event: any) => {
      resetSilenceTimeout();
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      transcriptRef.current = transcript;
      setTranscript(transcript);
    };

    recognition.onend = () => {
      setIsRecording(false);
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      // Auto-calculate feedback when speech ends
      if (transcriptRef.current) {
        const sentences = Array.from(selectedSentences);
        const sentence = sentences[currentSentenceIdx];
        const feedback = computeWordDiff(sentence, transcriptRef.current);
        setWordFeedback(feedback);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    await recognition.start();
  };

  // Check accuracy and move forward
  const handleNext = () => {
    const sentences = Array.from(selectedSentences);
    const sentence = sentences[currentSentenceIdx];
    const feedback = computeWordDiff(sentence, transcript);
    const accuracy = (feedback.filter((f) => f === '✓').length / feedback.length) * 100;

    setWordFeedback(feedback);

    if (accuracy >= 70) {
      const updated = new Set(completedSentences);
      updated.add(sentence);
      setCompletedSentences(updated);

      if (currentSentenceIdx < 1) {
        setCurrentSentenceIdx(currentSentenceIdx + 1);
        setTranscript('');
        setWordFeedback([]);
        transcriptRef.current = '';
      } else {
        // All 2 sentences completed
        onSelectSentences?.(selectedSentences);
        onComplete(25); // 25 XP for Activity 3
      }
    } else {
      // Failed - reset for another attempt
      setTranscript('');
      setWordFeedback([]);
      transcriptRef.current = '';
    }
  };

  // Selection phase
  if (step === 'select') {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-cyan-400/40 p-6" style={{ background: 'rgba(5,14,26,0.8)' }}>
          <div className="flex items-start gap-3 mb-4">
            <span className="text-2xl">👂</span>
            <div>
              <h3 className="text-xl font-bold text-cyan-300 mb-2">Review & Repeat</h3>
              <p className="text-sm text-cyan-200/70">
                Choose 2 sentences from your activity to review and practice again.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-bold text-cyan-300 tracking-widest">
            SELECT 2 SENTENCES ({selectedSentences.size}/2)
          </p>
          {SENTENCES.map((sentence, idx) => (
            <button
              key={idx}
              onClick={() => toggleSentence(sentence)}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                selectedSentences.has(sentence)
                  ? 'border-cyan-400 bg-cyan-400/10'
                  : 'border-cyan-400/30 bg-cyan-400/5 hover:border-cyan-400/50'
              }`}
            >
              <p className="text-sm font-semibold text-cyan-200">{sentence}</p>
            </button>
          ))}
        </div>

        <button
          onClick={handleStartRepeat}
          disabled={selectedSentences.size !== 2}
          className="w-full py-3 px-4 rounded-lg font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: selectedSentences.size === 2 ? 'linear-gradient(135deg, #00D4FF, #0099CC)' : 'rgba(0,212,255,0.2)',
            color: selectedSentences.size === 2 ? '#000' : '#00D4FF',
          }}
        >
          🎤 START REVIEW
        </button>
      </div>
    );
  }

  // Listen-Repeat phase
  const sentences = Array.from(selectedSentences);
  const currentSentence = sentences[currentSentenceIdx];
  const isCompleted = completedSentences.has(currentSentence);

  return (
    <div className="space-y-6">
      <audio ref={audioRef} crossOrigin="anonymous" />

      <div className="rounded-lg border border-cyan-400/40 p-6" style={{ background: 'rgba(5,14,26,0.8)' }}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">🎯</span>
          <div>
            <h3 className="text-xl font-bold text-cyan-300 mb-1">
              Sentence {currentSentenceIdx + 1}/2
            </h3>
            <p className="text-lg text-cyan-200 font-semibold">{currentSentence}</p>
          </div>
        </div>
      </div>

      {!isCompleted && (
        <div className="space-y-4">
          <button
            onClick={handleListen}
            className="w-full py-3 px-4 rounded-lg font-bold text-lg transition-all"
            style={{ background: 'linear-gradient(135deg, #00D4FF, #0099CC)', color: '#000' }}
          >
            🎧 LISTEN
          </button>

          <button
            onClick={handleRepeat}
            disabled={isRecording}
            className="w-full py-3 px-4 rounded-lg font-bold text-lg transition-all disabled:opacity-70"
            style={{
              background: isRecording ? 'rgba(255,100,100,0.3)' : 'linear-gradient(135deg, #00FF88, #00CC66)',
              color: '#000',
            }}
          >
            {isRecording ? '🔴 LISTENING...' : '🎤 REPEAT'}
          </button>

          {transcript && (
            <div className="rounded-lg border border-cyan-400/40 p-4" style={{ background: 'rgba(5,14,26,0.6)' }}>
              <p className="text-xs font-bold text-cyan-300/70 mb-2">YOUR TRANSCRIPT:</p>
              <p className="text-cyan-200 mb-3">"{transcript}"</p>

              {wordFeedback.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {wordFeedback.map((feedback, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        feedback === '✓' ? 'bg-green-500/30 text-green-300' : 'bg-red-500/30 text-red-300'
                      }`}
                    >
                      {feedback}
                    </span>
                  ))}
                </div>
              )}

              {wordFeedback.length > 0 && (
                <div className="text-sm font-bold">
                  <span className="text-cyan-300">
                    Accuracy: {Math.round((wordFeedback.filter((f) => f === '✓').length / wordFeedback.length) * 100)}%
                  </span>
                </div>
              )}
            </div>
          )}

          {wordFeedback.length > 0 && (
            <button
              onClick={handleNext}
              className="w-full py-3 px-4 rounded-lg font-bold text-lg"
              style={{
                background:
                  (wordFeedback.filter((f) => f === '✓').length / wordFeedback.length) * 100 >= 70
                    ? 'linear-gradient(135deg, #00FF88, #00CC66)'
                    : 'rgba(255,180,0,0.3)',
                color: '#000',
              }}
            >
              {(wordFeedback.filter((f) => f === '✓').length / wordFeedback.length) * 100 >= 70
                ? '✅ CORRECT → NEXT'
                : '⚠️ TRY AGAIN'}
            </button>
          )}
        </div>
      )}

      {isCompleted && currentSentenceIdx < 1 && (
        <button
          onClick={() => {
            setCurrentSentenceIdx(currentSentenceIdx + 1);
            setTranscript('');
            setWordFeedback([]);
          }}
          className="w-full py-3 px-4 rounded-lg font-bold text-lg transition-all"
          style={{ background: 'linear-gradient(135deg, #00D4FF, #0099CC)', color: '#000' }}
        >
          ✅ NEXT SENTENCE
        </button>
      )}

      {isCompleted && currentSentenceIdx >= 1 && (
        <div className="rounded-lg border border-green-400/40 p-6 text-center" style={{ background: 'rgba(0,100,0,0.2)' }}>
          <p className="text-3xl mb-2">🎉</p>
          <p className="text-xl font-bold text-green-300 mb-2">Perfect Review!</p>
          <p className="text-sm text-green-200/70 mb-4">Both sentences nailed!</p>
          <button
            onClick={() => onComplete(25)}
            className="w-full py-3 px-4 rounded-lg font-bold text-lg transition-all"
            style={{ background: 'linear-gradient(135deg, #00FF88, #00CC66)', color: '#000' }}
          >
            ✨ CONTINUE
          </button>
        </div>
      )}
    </div>
  );
};
