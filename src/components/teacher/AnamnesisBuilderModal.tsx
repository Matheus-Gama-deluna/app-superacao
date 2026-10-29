import React, { useState } from 'react';
import {
  CustomAnamnesisTemplate,
  AnamnesisQuestion,
  AnamnesisQuestionType,
  AnamnesisPhotoCategory,
} from '../../types';
import {
  getSavedTeacherTemplate,
  saveTeacherTemplate,
  generateTeacherInviteCode,
} from '../../lib/anamnesisEngine';

interface AnamnesisBuilderModalProps {
  isOpen: boolean;
  teacherUid: string;
  teacherName?: string;
  onClose: () => void;
  onSaved?: (template: CustomAnamnesisTemplate) => void;
}

export const AnamnesisBuilderModal: React.FC<AnamnesisBuilderModalProps> = ({
  isOpen,
  teacherUid,
  teacherName,
  onClose,
  onSaved,
}) => {
  const [template, setTemplate] = useState<CustomAnamnesisTemplate>(() => {
    return getSavedTeacherTemplate(teacherUid);
  });
  const [copiedCode, setCopiedCode] = useState(false);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newType, setNewType] = useState<AnamnesisQuestionType>('text_long');
  const [newRequired, setNewRequired] = useState(false);
  const [newOptionsText, setNewOptionsText] = useState('Opção 1\nOpção 2\nOpção 3');
  const [newPhotoCategory, setNewPhotoCategory] = useState<AnamnesisPhotoCategory>('posture_front');

  if (!isOpen) return null;

  const inviteCode = generateTeacherInviteCode(teacherUid);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleToggleRequired = (qId: string) => {
    setTemplate((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === qId ? { ...q, required: !q.required } : q
      ),
    }));
  };

  const handleDeleteQuestion = (qId: string) => {
    setTemplate((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== qId),
    }));
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    let options: { label: string; value: string }[] | undefined = undefined;
    if (newType === 'single_choice' || newType === 'multiple_choice') {
      options = newOptionsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, i) => ({
          label: line,
          value: `opt_${Date.now()}_${i}`,
        }));
    }

    const newQ: AnamnesisQuestion = {
      id: `q_custom_${Date.now()}`,
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || undefined,
      type: newType,
      required: newRequired,
      options,
      photoCategory: newType === 'photo_upload' ? newPhotoCategory : undefined,
      minScale: newType === 'scale_1_10' ? 1 : undefined,
      maxScale: newType === 'scale_1_10' ? 10 : undefined,
      scaleLabels:
        newType === 'scale_1_10' ? { min: '1 - Baixo', max: '10 - Alto' } : undefined,
    };

    setTemplate((prev) => ({
      ...prev,
      questions: [...prev.questions, newQ],
    }));

    // Reseta form de adição
    setNewTitle('');
    setNewSubtitle('');
    setNewType('text_long');
    setNewRequired(false);
    setIsAddingQuestion(false);
  };

  const handleSave = () => {
    saveTeacherTemplate(template);
    if (onSaved) onSaved(template);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Construtor de Anamnese do Professor"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in font-sans"
    >
      <div className="bg-[#FAF8F5] rounded-3xl max-h-[92vh] flex flex-col w-full max-w-xl border border-[#C9DBD3] shadow-2xl overflow-hidden">
        {/* Cabeçalho */}
        <header className="p-4 sm:p-5 border-b border-[#C9DBD3]/60 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[#EAF3EF] text-[#125F55] flex items-center justify-center text-lg">
              📋
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#19231E]">
                Construtor de Anamnese
              </h2>
              <p className="text-xs text-[#5B7170]">
                Personalize o que seus alunos respondem antes de você prescrever
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#5B7170] hover:text-[#19231E] rounded-full hover:bg-[#EAF3EF]"
            aria-label="Fechar"
          >
            ✕
          </button>
        </header>

        {/* Conteúdo rolável */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Card com Código de Compartilhamento */}
          <div className="bg-[#EAF3EF] rounded-2xl p-4 border border-[#125F55]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-[#125F55] uppercase tracking-wider">
                Seu Código de Aluno
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-xl font-black text-[#125F55] tracking-wider">
                  {inviteCode}
                </span>
              </div>
              <p className="text-[11px] text-[#5B7170] mt-0.5">
                Envie para seus alunos conectarem e responderem sua anamnese
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="py-2.5 px-4 rounded-xl bg-[#125F55] text-white text-xs font-bold hover:bg-[#0E4B43] shadow-sm transition-all shrink-0 flex items-center justify-center gap-1.5"
            >
              {copiedCode ? '✓ Código Copiado!' : 'Copiar Código'}
            </button>
          </div>

          {/* Lista de Perguntas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5B7170]">
                Perguntas & Slots de Fotos ({template.questions.length})
              </h3>
              {!isAddingQuestion && (
                <button
                  type="button"
                  onClick={() => setIsAddingQuestion(true)}
                  className="text-xs font-bold text-[#125F55] hover:underline flex items-center gap-1"
                >
                  <span>+</span> Adicionar Pergunta / Foto
                </button>
              )}
            </div>

            {template.questions.map((q, idx) => (
              <div
                key={q.id}
                className="bg-white rounded-2xl p-3.5 border border-[#C9DBD3]/60 shadow-xs flex items-start justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-5 h-5 rounded-full bg-[#EAF3EF] text-[#125F55] text-[10px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-[#19231E] truncate">
                      {q.title}
                    </span>
                    <span className="text-[10px] bg-[#FAF8F5] text-[#5B7170] px-2 py-0.5 rounded-full border border-[#C9DBD3]/40">
                      {q.type === 'photo_upload'
                        ? '📸 Foto / Análise Corporal'
                        : q.type === 'single_choice'
                        ? 'Escolha única'
                        : q.type === 'multiple_choice'
                        ? 'Múltipla escolha'
                        : q.type === 'scale_1_10'
                        ? 'Escala 1 a 10'
                        : 'Texto livre'}
                    </span>
                  </div>
                  {q.subtitle && (
                    <p className="text-[11px] text-[#5B7170] mt-1 line-clamp-1">{q.subtitle}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleRequired(q.id)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                      q.required
                        ? 'bg-[#125F55] text-white border-[#125F55]'
                        : 'bg-[#FAF8F5] text-[#5B7170] border-[#C9DBD3]'
                    }`}
                  >
                    {q.required ? 'Obrigatória' : 'Opcional'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-1 text-[#5B7170] hover:text-[#C84B31] rounded-lg hover:bg-[#C84B31]/10 transition-colors"
                    aria-label="Excluir pergunta"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Form para adicionar nova pergunta */}
          {isAddingQuestion && (
            <form
              onSubmit={handleAddQuestion}
              className="bg-white rounded-2xl p-4 border-2 border-[#125F55]/40 shadow-sm space-y-3"
            >
              <h4 className="text-xs font-bold text-[#125F55] uppercase tracking-wider">
                Nova Pergunta ou Solicitação de Foto
              </h4>

              <div>
                <label className="block text-xs font-bold text-[#19231E] mb-1">
                  Enunciado / Título:
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex.: Foto Lateral com Roupa Confortável ou Histórico de Cirurgias"
                  className="w-full px-3 py-2 rounded-xl border border-[#C9DBD3] text-xs text-[#19231E] focus:outline-none focus:ring-2 focus:ring-[#125F55]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#19231E] mb-1">
                  Subtítulo / Instrução:
                </label>
                <input
                  type="text"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  placeholder="Ex.: Fique de perfil alinhado para avaliar coluna"
                  className="w-full px-3 py-2 rounded-xl border border-[#C9DBD3] text-xs text-[#19231E] focus:outline-none focus:ring-2 focus:ring-[#125F55]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[#19231E] mb-1">Tipo:</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as AnamnesisQuestionType)}
                    className="w-full px-2.5 py-2 rounded-xl border border-[#C9DBD3] text-xs text-[#19231E] bg-white"
                  >
                    <option value="text_long">Texto Longo</option>
                    <option value="text_short">Texto Curto</option>
                    <option value="single_choice">Escolha Única</option>
                    <option value="multiple_choice">Múltipla Escolha</option>
                    <option value="scale_1_10">Escala de 1 a 10</option>
                    <option value="photo_upload">📸 Solicitação de Foto</option>
                  </select>
                </div>

                {newType === 'photo_upload' ? (
                  <div>
                    <label className="block text-xs font-bold text-[#19231E] mb-1">
                      Categoria da Foto:
                    </label>
                    <select
                      value={newPhotoCategory}
                      onChange={(e) => setNewPhotoCategory(e.target.value as AnamnesisPhotoCategory)}
                      className="w-full px-2.5 py-2 rounded-xl border border-[#C9DBD3] text-xs text-[#19231E] bg-white"
                    >
                      <option value="posture_front">Postural Frontal</option>
                      <option value="posture_side">Postural Lateral / Perfil</option>
                      <option value="posture_back">Postural Costas</option>
                      <option value="equipments">Equipamentos / Espaço</option>
                      <option value="general">Geral</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#19231E]">
                      <input
                        type="checkbox"
                        checked={newRequired}
                        onChange={(e) => setNewRequired(e.target.checked)}
                        className="rounded border-[#C9DBD3] text-[#125F55] focus:ring-[#125F55]"
                      />
                      <span>Resposta Obrigatória</span>
                    </label>
                  </div>
                )}
              </div>

              {(newType === 'single_choice' || newType === 'multiple_choice') && (
                <div>
                  <label className="block text-xs font-bold text-[#19231E] mb-1">
                    Opções (uma por linha):
                  </label>
                  <textarea
                    rows={3}
                    value={newOptionsText}
                    onChange={(e) => setNewOptionsText(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#C9DBD3] text-xs text-[#19231E]"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingQuestion(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-[#5B7170] hover:bg-[#FAF8F5]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#125F55] text-white text-xs font-bold hover:bg-[#0E4B43]"
                >
                  Inserir Pergunta
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Rodapé com Ações */}
        <footer className="p-4 sm:p-5 border-t border-[#C9DBD3]/60 bg-white flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-full border border-[#C9DBD3] text-xs font-bold text-[#5B7170] hover:bg-[#FAF8F5]"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="py-2.5 px-6 rounded-full bg-[#125F55] text-white text-xs font-bold hover:bg-[#0E4B43] shadow-md shadow-[#125F55]/20"
          >
            Salvar Modelo de Anamnese
          </button>
        </footer>
      </div>
    </div>
  );
};
