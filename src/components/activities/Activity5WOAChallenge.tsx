'use client';

import React, { useState, useRef } from 'react';
import { getSpeechRecognition } from '@/src/lib/speechRecognition';

interface Activity5Props {
  selectedSentences: Set<string>;
  onComplete: (xp: number) => void;
}

export const Activity5WOAChallenge: React.FC<Activity5Props> = ({ selectedSentences, onComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [wordFeedback, setWordFeedback] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef('');

  // Check if transcript matches one of the selected sentences
  const checkAccuracy = (spoken: string): { matched: boolean; accuracy: number; bestMatch?: string } => {
    const cleanWord = (word: string) => word.toLowerCase().replace(/[.,!?;:'"()]/g, '');
    
    const sentences = Array.from(selectedSentences);
    
    let bestAccuracy = 0;
    let bestMatchedSentence = '';

    for (const sentence of sentences) {
      const correctWords = new Set(
        sentence
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

      const matchedWords = Array.from(correctWords).filter((word) => spokenWords.has(word)).length;
      const accuracy = (matchedWords / correctWords.size) * 100;

      if (accuracy > bestAccuracy) {
        bestAccuracy = accuracy;
        bestMatchedSentence = sentence;
      }
    }

    return {
      matched: bestAccuracy >= 70,
      accuracy: Math.round(bestAccuracy),
      bestMatch: bestMatchedSentence,
    };
  };

  // Handle speech recognition
  const handleSpeak = async () => {
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
      // Auto-check accuracy when speech ends
      if (transcriptRef.current) {
        const result = checkAccuracy(transcriptRef.current);
        if (result.matched) {
          setIsCompleted(true);
          setShowResult(true);
        } else {
          // Show fail result
          setShowResult(true);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    await recognition.start();
  };

  // Success screen
  if (isCompleted && showResult) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-green-400/40 p-8 text-center" style={{ background: 'rgba(0,100,0,0.2)' }}>
          <p className="text-5xl mb-4">🦅</p>
          <h2 className="text-3xl font-black text-green-300 mb-3">WOA CHALLENGE COMPLETED!</h2>
          <p className="text-lg text-green-200/80 mb-2">You said it perfectly!</p>
          <p className="text-sm text-green-200/60 mb-6">"{transcript}"</p>

          <div className="inline-block px-6 py-3 rounded-lg bg-yellow-500/20 border border-yellow-400 mb-6">
            <p className="text-lg text-yellow-300 tracking-widest font-bold">🪙 +1 WOA COIN</p>
          </div>

          <button
            onClick={() => onComplete(30)} // 30 XP for completing challenge
            className="w-full py-4 px-6 rounded-lg font-bold text-lg transition-all"
            style={{ background: 'linear-gradient(135deg, #00FF88, #00CC66)', color: '#000' }}
          >
            ✨ FINALIZAR MÓDULO
          </button>
        </div>
      </div>
    );
  }

  // Fail screen
  if (!isCompleted && showResult && transcript) {
    const result = checkAccuracy(transcript);
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-red-400/40 p-8 text-center" style={{ background: 'rgba(100,0,0,0.2)' }}>
          <p className="text-5xl mb-4">❌</p>
          <h2 className="text-3xl font-black text-red-300 mb-3">Desafio Não Completado</h2>
          <p className="text-cyan-200 text-center mb-4">"{transcript}"</p>
          <p className="text-sm text-red-200/70 text-center mb-6">
            Você acertou apenas {result.accuracy}%. Precisa de pelo menos 70% para vencer o desafio!
          </p>
          <p className="text-sm text-cyan-200/60">
            💡 Você pode tentar novamente na próxima vez ou continuar sua jornada.
          </p>
        </div>

        <button
          onClick={() => onComplete(0)}
          className="w-full py-4 px-6 rounded-lg font-bold text-lg transition-all"
          style={{ background: 'linear-gradient(135deg, #003AB0, #0066FF)', color: '#fff' }}
        >
          ➡️ CONTINUAR
        </button>
      </div>
    );
  }

  // Challenge screen
  return (
    <div className="space-y-8">
      {/* Challenge header */}
      <div
        className="p-8 rounded-3xl text-center backdrop-blur-md"
        style={{
          background: 'linear-gradient(135deg, rgba(0,212,255,0.1), rgba(0,255,136,0.05))',
          border: '2px solid #00D4FF',
        }}
      >
        <p className="text-5xl mb-4">🦅</p>
        <h2 className="text-3xl font-black text-cyan-300 mb-4">WOA CHALLENGE</h2>
        <p className="text-lg text-cyan-200/80 leading-relaxed">
          Você consegue dizer uma das duas frases anteriores novamente?
        </p>
        <p className="text-sm text-cyan-200/60 mt-4">
          ⚠️ Sem ouvir, sem ler. Apenas fale!
        </p>
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div className="p-6 rounded-lg border border-red-400/50 text-center" style={{ background: 'rgba(255,0,0,0.1)' }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl animate-pulse">🔴</span>
            <p className="text-lg font-bold text-red-300">LISTENING...</p>
          </div>
          {transcript && (
            <p className="text-cyan-200 text-sm mt-3">"{transcript}"</p>
          )}
        </div>
      )}

      {/* Speak button */}
      <button
        onClick={handleSpeak}
        disabled={isRecording}
        className="w-full py-6 px-6 rounded-2xl font-bold text-2xl transition-all disabled:opacity-70 transform hover:scale-105 active:scale-95"
        style={{
          background: isRecording ? 'rgba(255,100,100,0.3)' : 'linear-gradient(135deg, #00FF88, #00CC66)',
          color: '#000',
          boxShadow: isRecording ? '0 0 30px rgba(255,100,100,0.5)' : '0 0 30px rgba(0,255,136,0.3)',
        }}
      >
        {isRecording ? '🔴 LISTENING' : '🎤 FALE AGORA'}
      </button>

      {/* Motivational message */}
      <div className="text-center text-cyan-200/60 text-sm">
        <p>💪 Você consegue! Mostre que aprendeu!</p>
      </div>
    </div>
  );
};
