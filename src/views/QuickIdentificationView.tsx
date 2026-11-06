import React, { useState } from 'react';
import { UserRole } from '../types';

export type StudentFirstStepChoice = 'listening' | 'link_teacher' | 'explore';

interface QuickIdentificationViewProps {
  initialName?: string;
  onComplete: (data: {
    displayName: string;
    userRole: UserRole;
    initialChoice?: StudentFirstStepChoice;
  }) => void;
  onBack?: () => void;
}

export const QuickIdentificationView: React.FC<QuickIdentificationViewProps> = ({
  initialName = '',
  onComplete,
  onBack,
}) => {
  const hasKnownName = Boolean(initialName && initialName.trim() !== '' && initialName !== 'Praticante');
  const [name, setName] = useState<string>(hasKnownName ? initialName.trim() : '');
  const [isEditingName, setIsEditingName] = useState<boolean>(!hasKnownName);
  const [role, setRole] = useState<UserRole>('student');
  const [studentChoice, setStudentChoice] = useState<StudentFirstStepChoice>('listening');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Por favor, informe como podemos chamar você.');
      setIsEditingName(true);
      return;
    }
    setError(null);
    onComplete({
      displayName: cleanName,
      userRole: role,
      initialChoice: role === 'student' ? studentChoice : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#19231E] flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto font-sans">
      <header className="pt-4 flex items-center justify-between">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 text-[#5B7170] hover:text-[#19231E] rounded-full hover:bg-[#EAF3EF] transition-colors"
            aria-label="Voltar para tela anterior"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ) : (
          <div className="w-9 h-9" />
        )}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#125F55] flex items-center justify-center text-white font-black text-sm">
            S
          </div>
          <span className="font-extrabold text-[#19231E] text-base tracking-tight">Superação</span>
        </div>
        <div className="w-9 h-9" />
      </header>

      <main className="flex-1 flex flex-col justify-center py-6 space-y-6">
        <div className="space-y-2 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-[#EAF3EF] text-[#125F55] text-xs font-bold uppercase tracking-wider">
            Boas-vindas
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#19231E] tracking-tight">
            {hasKnownName && !isEditingName ? `Olá, ${name}!` : 'Identificação Rápida'}
          </h1>
          <p className="text-sm text-[#5B7170] max-w-md mx-auto">
            {hasKnownName && !isEditingName
              ? 'Como você gostaria de começar sua jornada no Superação hoje?'
              : 'Apenas 2 perguntas simples para personalizar sua experiência com cuidado e respeito.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Pergunta 1: Nome */}
          <div className="bg-white rounded-3xl p-5 border border-[#C9DBD3]/60 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="displayNameInput" className="block text-sm font-bold text-[#19231E]">
                1. Como podemos chamar você?
              </label>
              {hasKnownName && !isEditingName && (
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="text-xs text-[#125F55] font-semibold hover:underline"
                >
                  Editar nome
                </button>
              )}
            </div>

            {hasKnownName && !isEditingName ? (
              <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-[#EAF3EF]/60 border border-[#C9DBD3]/60">
                <span className="font-bold text-[#19231E] text-base">{name}</span>
                <span className="text-xs text-[#246747] font-medium bg-[#E8EFE9] px-2.5 py-1 rounded-full">
                  ✓ Identificado
                </span>
              </div>
            ) : (
              <div>
                <input
                  id="displayNameInput"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Ex.: Maria, Lucas, Dr. Ricardo"
                  maxLength={40}
                  className="w-full px-4 py-3 rounded-2xl border border-[#C9DBD3] bg-[#F5F8F5] text-[#19231E] placeholder-[#5B7170]/60 focus:outline-none focus:ring-2 focus:ring-[#125F55] focus:bg-white text-base transition-all"
                  autoFocus={isEditingName}
                />
                {error && (
                  <p className="text-xs font-medium text-[#C84B31] mt-1.5 flex items-center gap-1">
                    <span>⚠️</span> {error}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Pergunta 2: Papel no app */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-[#19231E] px-1">
              2. Como você vai utilizar o Superação?
            </label>

            <div className="grid grid-cols-1 gap-3">
              {/* Opção Aluno */}
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`p-4 rounded-3xl border text-left transition-all flex items-start gap-4 ${
                  role === 'student'
                    ? 'border-[#125F55] bg-[#EAF3EF] shadow-sm'
                    : 'border-[#C9DBD3]/60 bg-white hover:border-[#125F55]/40'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                    role === 'student' ? 'bg-[#125F55] text-white' : 'bg-[#F5F8F5] text-[#5B7170]'
                  }`}
                >
                  🏋️
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#19231E] text-sm sm:text-base">
                      Sou Praticante / Aluno
                    </span>
                    {role === 'student' && (
                      <span className="w-5 h-5 rounded-full bg-[#125F55] text-white text-xs flex items-center justify-center font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#5B7170] mt-1 leading-relaxed">
                    Quero cuidar da minha saúde, montar meu treino sob medida ou treinar com o plano enviado pelo meu professor.
                  </p>
                </div>
              </button>

              {/* Opção Professor */}
              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`p-4 rounded-3xl border text-left transition-all flex items-start gap-4 ${
                  role === 'teacher'
                    ? 'border-[#125F55] bg-[#EAF3EF] shadow-sm'
                    : 'border-[#C9DBD3]/60 bg-white hover:border-[#125F55]/40'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                    role === 'teacher' ? 'bg-[#125F55] text-white' : 'bg-[#F5F8F5] text-[#5B7170]'
                  }`}
                >
                  👨‍🏫
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#19231E] text-sm sm:text-base">
                      Sou Professor / Personal / Treinador
                    </span>
                    {role === 'teacher' && (
                      <span className="w-5 h-5 rounded-full bg-[#125F55] text-white text-xs flex items-center justify-center font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#5B7170] mt-1 leading-relaxed">
                    Quero gerenciar meus alunos, criar questionários de anamnese com fotos, prescrever treinos e descansos personalizados.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Sub-escolha do primeiro passo (somente quando Aluno) */}
          {role === 'student' && (
            <div className="bg-white rounded-3xl p-5 border border-[#C9DBD3]/60 shadow-sm space-y-3">
              <label className="block text-sm font-bold text-[#19231E]">
                3. Como você prefere começar agora?
              </label>

              <div className="space-y-2.5">
                <label
                  className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                    studentChoice === 'listening'
                      ? 'border-[#125F55] bg-[#EAF3EF]'
                      : 'border-[#E4DDD3] bg-[#FAF8F5] hover:border-[#125F55]/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="studentChoice"
                    value="listening"
                    checked={studentChoice === 'listening'}
                    onChange={() => setStudentChoice('listening')}
                    className="w-4 h-4 text-[#125F55] accent-[#125F55]"
                  />
                  <div className="flex-1 text-xs">
                    <span className="font-bold text-[#19231E] block">
                      ✨ Montar meu treino personalizado <span className="text-[#246747] font-semibold">(Recomendado · 2 min)</span>
                    </span>
                    <span className="text-[#5B7170]">
                      Responda à Escuta Inicial para adaptarmos exercícios, apoios e descansos.
                    </span>
                  </div>
                </label>

                <label
                  className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                    studentChoice === 'link_teacher'
                      ? 'border-[#125F55] bg-[#EAF3EF]'
                      : 'border-[#E4DDD3] bg-[#FAF8F5] hover:border-[#125F55]/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="studentChoice"
                    value="link_teacher"
                    checked={studentChoice === 'link_teacher'}
                    onChange={() => setStudentChoice('link_teacher')}
                    className="w-4 h-4 text-[#125F55] accent-[#125F55]"
                  />
                  <div className="flex-1 text-xs">
                    <span className="font-bold text-[#19231E] block">
                      👨‍🏫 Tenho código de um Professor (PROF-XXXX)
                    </span>
                    <span className="text-[#5B7170]">
                      Conecte-se diretamente ao seu personal ou treinador.
                    </span>
                  </div>
                </label>

                <label
                  className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                    studentChoice === 'explore'
                      ? 'border-[#125F55] bg-[#EAF3EF]'
                      : 'border-[#E4DDD3] bg-[#FAF8F5] hover:border-[#125F55]/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="studentChoice"
                    value="explore"
                    checked={studentChoice === 'explore'}
                    onChange={() => setStudentChoice('explore')}
                    className="w-4 h-4 text-[#125F55] accent-[#125F55]"
                  />
                  <div className="flex-1 text-xs">
                    <span className="font-bold text-[#19231E] block">
                      🧭 Quero conhecer o aplicativo primeiro
                    </span>
                    <span className="text-[#5B7170]">
                      Entre na Home limpa e explore as opções no seu ritmo.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 px-6 rounded-full bg-[#125F55] text-white font-bold text-base hover:bg-[#0E4B43] shadow-md shadow-[#125F55]/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            <span>Continuar para o Superação</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </form>
      </main>

      <footer className="py-2 text-center">
        <p className="text-xs text-[#5B7170]">
          Superação • Autonomia e respeito ao seu momento
        </p>
      </footer>
    </div>
  );
};
