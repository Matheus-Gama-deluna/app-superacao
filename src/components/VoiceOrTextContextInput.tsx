import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Square, AlertCircle, Sparkles } from 'lucide-react';
import { transcribeVoiceAudio } from '../lib/aiClient';

interface VoiceOrTextContextInputProps {
  placeholder?: string;
  onSend: (text: string) => void;
  isLoading?: boolean;
  quickChips?: Array<{ label: string; text: string }>;
  disabled?: boolean;
}

export const VoiceOrTextContextInput: React.FC<VoiceOrTextContextInputProps> = ({
  placeholder = 'Ex: Meu joelho estalou ao descer...',
  onSend,
  isLoading = false,
  quickChips = [],
  disabled = false,
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    setRecordingError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setRecordingError('Gravação de áudio não suportada neste dispositivo.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size > 0) {
          setIsTranscribing(true);
          try {
            const result = await transcribeVoiceAudio(audioBlob);
            if (result.text && result.text.trim()) {
              setInputText((prev) => (prev ? `${prev} ${result.text}` : result.text));
            }
          } catch {
            setRecordingError('Não conseguimos transcrever o áudio. Você pode digitar.');
          } finally {
            setIsTranscribing(false);
          }
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 29) {
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      setRecordingError('Permissão de microfone negada ou indisponível.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading || isTranscribing) return;
    onSend(inputText.trim());
    setInputText('');
  };

  return (
    <div className="w-full space-y-2">
      {/* Quick Action Chips */}
      {quickChips.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1 text-[11px]">
            <Sparkles className="w-3 h-3 text-[#2D6A4F]" />
            Sugestões:
          </span>
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              disabled={disabled || isLoading}
              onClick={() => {
                setInputText(chip.text);
              }}
              className="shrink-0 px-2.5 py-1 bg-white border border-slate-200 hover:border-[#2D6A4F] text-slate-700 hover:text-[#1B4332] rounded-full text-xs transition-colors cursor-pointer shadow-2xs active:scale-95"
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Recording status banner */}
      {isRecording && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
            <span className="font-semibold">Gravando áudio ({recordingSeconds}s / 30s)...</span>
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-1 text-xs font-bold text-rose-800 hover:text-rose-950 px-2 py-0.5 bg-rose-100 rounded-lg cursor-pointer"
          >
            <Square className="w-3 h-3 fill-current" />
            Concluir
          </button>
        </div>
      )}

      {/* Transcribing loader */}
      {isTranscribing && (
        <div className="flex items-center gap-2 px-3 py-1 bg-[#D8F3DC]/40 border border-[#2D6A4F]/20 rounded-xl text-xs text-[#1B4332]">
          <div className="w-3 h-3 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
          <span>Transcrevendo sua fala com inteligência segura...</span>
        </div>
      )}

      {/* Error alert */}
      {recordingError && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 px-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{recordingError}</span>
        </div>
      )}

      {/* Main input form */}
      <form onSubmit={handleSubmit} className="flex items-end gap-1.5 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 focus-within:border-[#2D6A4F] focus-within:ring-2 focus-within:ring-[#2D6A4F]/10 transition-all">
        <textarea
          rows={1}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || isLoading || isRecording}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          className="flex-1 bg-transparent px-2.5 py-1.5 text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none min-h-[40px] max-h-[100px]"
        />

        {/* Audio mic button */}
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || isLoading || isTranscribing}
          title={isRecording ? 'Parar gravação' : 'Falar micro-áudio (até 30s)'}
          className={`p-2.5 rounded-xl transition-all cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center ${
            isRecording
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-500 hover:text-[#1B4332] hover:bg-slate-100'
          }`}
        >
          {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Send message button */}
        <button
          type="submit"
          disabled={!inputText.trim() || disabled || isLoading || isTranscribing}
          title="Enviar mensagem ao Personal"
          className="p-2.5 bg-[#1B4332] hover:bg-[#12372A] disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl transition-all cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center shadow-xs"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
};
