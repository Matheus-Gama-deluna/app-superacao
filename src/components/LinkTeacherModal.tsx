import React, { useState } from 'react';
import { getTeacherLinks } from '../lib/teacherStudentSync';
import { getLocal } from '../lib/storage';
import { ANAMNESIS_STORAGE_KEYS } from '../lib/anamnesisEngine';
import { CustomAnamnesisTemplate, TeacherStudentLink } from '../types';

interface LinkTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCustomAnamnesis: (template: CustomAnamnesisTemplate, teacherUid: string) => void;
  onLinkSuccess: (link: TeacherStudentLink) => void;
}

export const LinkTeacherModal: React.FC<LinkTeacherModalProps> = ({
  isOpen,
  onClose,
  onStartCustomAnamnesis,
  onLinkSuccess,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSearchCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError('Por favor, informe o código do professor ou da ficha.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Procura por template de professor cujo código case com PROF-XXXX ou uid
      const templates = getLocal<Record<string, CustomAnamnesisTemplate>>(
        ANAMNESIS_STORAGE_KEYS.TEMPLATES,
        {}
      );

      let foundTeacherUid: string | null = null;
      let matchedTemplate: CustomAnamnesisTemplate | null = null;

      for (const [tUid, tmpl] of Object.entries(templates)) {
        const cleanUid = tUid.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        const expectedCode = `PROF-${cleanUid.length >= 4 ? cleanUid.slice(-4) : cleanUid.padEnd(4, 'X')}`;
        if (expectedCode === cleanCode || tUid.toUpperCase() === cleanCode || cleanCode === 'PROF-DEMO') {
          foundTeacherUid = tUid;
          matchedTemplate = tmpl;
          break;
        }
      }

      // Se não encontrou template existente, mas o código é PROF-XXXX, cria um template default simulado
      if (!matchedTemplate && (cleanCode.startsWith('PROF-') || cleanCode.length >= 4)) {
        foundTeacherUid = `teacher_${cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        matchedTemplate = {
          id: `template_${foundTeacherUid}`,
          teacherUid: foundTeacherUid,
          teacherName: 'Professor(a) Conectado(a)',
          title: 'Anamnese e Avaliação Personalizada',
          description: 'Questionário montado pelo seu professor para avaliar sua rotina e postura.',
          questions: [
            {
              id: 'q_primary_goal',
              title: 'Qual seu objetivo principal de treino?',
              type: 'single_choice',
              required: true,
              options: [
                { label: 'Saúde e Hábito', value: 'habito' },
                { label: 'Força e Tônus', value: 'forca' },
                { label: 'Alívio de Dores', value: 'alivio_dores' },
              ],
            },
            {
              id: 'q_joint_limitations',
              title: 'Tem alguma dor articular ou cirurgia prévia?',
              type: 'multiple_choice',
              required: false,
              options: [
                { label: 'Sem restrições', value: 'nenhuma' },
                { label: 'Lombar', value: 'dor_lombar', flagsArticular: ['sobrecarga_lombar'] },
                { label: 'Joelho', value: 'dor_joelho', flagsArticular: ['agachamento_profundo'] },
                { label: 'Ombro', value: 'dor_ombro', flagsArticular: ['push_vertical'] },
              ],
            },
            {
              id: 'photo_posture_front',
              title: 'Foto Postural Frontal (Opcional)',
              subtitle: 'Para o professor avaliar sua postura e simetria.',
              type: 'photo_upload',
              photoCategory: 'posture_front',
              required: false,
            },
          ],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      }

      if (matchedTemplate && foundTeacherUid) {
        setIsLoading(false);
        onStartCustomAnamnesis(matchedTemplate, foundTeacherUid);
        return;
      }

      setError('Código não encontrado. Verifique se digitou corretamente ou solicite um novo código ao seu professor.');
      setIsLoading(false);
    } catch (err) {
      setError('Ocorreu um erro ao verificar o código. Tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Vincular ao Professor"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in font-sans"
    >
      <div className="bg-[#FAF8F5] rounded-3xl p-6 w-full max-w-md border border-[#C9DBD3] shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-2xl bg-[#EAF3EF] flex items-center justify-center text-lg">
              👨‍🏫
            </span>
            <h2 className="text-lg font-black text-[#19231E]">
              Treinar com seu Professor
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#5B7170] hover:text-[#19231E] rounded-full hover:bg-[#EAF3EF] transition-colors"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-[#5B7170] leading-relaxed">
          Digite o código de convite recebido do seu personal ou treinador (ex.: <code className="bg-[#EAF3EF] text-[#125F55] px-1.5 py-0.5 rounded font-mono font-bold">PROF-XXXX</code>) para responder ao questionário de avaliação e receber suas fichas diretamente no app.
        </p>

        <form onSubmit={handleSearchCode} className="space-y-4">
          <div>
            <label htmlFor="teacherCodeInput" className="block text-xs font-bold text-[#19231E] mb-1.5">
              Código do Professor ou da Ficha
            </label>
            <input
              id="teacherCodeInput"
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                if (error) setError(null);
              }}
              placeholder="Ex.: PROF-A1B2 ou PROF-DEMO"
              maxLength={20}
              className="w-full px-4 py-3 rounded-2xl border border-[#C9DBD3] bg-white text-[#19231E] font-mono text-center font-bold tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-[#125F55] text-base"
              autoFocus
            />
            {error && (
              <p className="text-xs text-[#C84B31] font-medium mt-1.5 flex items-center gap-1">
                <span>⚠️</span> {error}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-full border border-[#C9DBD3] text-[#5B7170] font-bold text-sm hover:bg-[#EAF3EF] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 px-4 rounded-full bg-[#125F55] text-white font-bold text-sm hover:bg-[#0E4B43] shadow-md shadow-[#125F55]/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? 'Verificando...' : 'Conectar e Iniciar'}
            </button>
          </div>
        </form>

        <div className="bg-[#EAF3EF]/70 rounded-2xl p-3.5 border border-[#C9DBD3]/40 text-xs text-[#5B7170] space-y-1">
          <p className="font-bold text-[#125F55]">💡 Dica rápida:</p>
          <p>
            Você pode experimentar digitando <span className="font-mono font-bold text-[#125F55]">PROF-DEMO</span> para testar o fluxo de anamnese com envio de fotos sem precisar de convite externo.
          </p>
        </div>
      </div>
    </div>
  );
};
