import React, { useState } from 'react';
import {
  CustomAnamnesisTemplate,
  AnamnesisPhotoAttachment,
  AnamnesisSubmission,
  TeacherStudentLink,
} from '../types';
import {
  validateAnamnesisAnswers,
  mapAnamnesisToUserProfileLimitations,
  saveAnamnesisSubmission,
} from '../lib/anamnesisEngine';
import { saveTeacherStudentLink, broadcastLiveSync } from '../lib/teacherStudentSync';
import { compressImageFile, isValidImageFile } from '../lib/photoUtils';
import { useAuth } from '../context/AuthContext';

interface CustomAnamnesisFlowViewProps {
  template: CustomAnamnesisTemplate;
  teacherUid: string;
  onFinish: () => void;
  onCancel: () => void;
}

export const CustomAnamnesisFlowView: React.FC<CustomAnamnesisFlowViewProps> = ({
  template,
  teacherUid,
  onFinish,
  onCancel,
}) => {
  const { profile, updateUserProfile } = useAuth();

  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [photos, setPhotos] = useState<AnamnesisPhotoAttachment[]>([]);
  const [uploadingSlots, setUploadingSlots] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Manipulador de upload de foto com compressão client-side
  const handlePhotoUpload = async (questionId: string, category: any, file: File) => {
    if (!isValidImageFile(file)) {
      setErrors(['Por favor, selecione um arquivo de imagem válido (JPG, PNG ou WebP).']);
      return;
    }

    setUploadingSlots((prev) => ({ ...prev, [questionId]: true }));
    try {
      const compressedDataUrl = await compressImageFile(file, {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.75,
      });

      const newAttachment: AnamnesisPhotoAttachment = {
        id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        questionId,
        category: category || 'general',
        dataUrl: compressedDataUrl,
        uploadedAt: Date.now(),
      };

      setPhotos((prev) => {
        // Substitui se já existia foto para este slot
        const filtered = prev.filter((p) => p.questionId !== questionId);
        return [...filtered, newAttachment];
      });
      setErrors([]);
    } catch (err) {
      console.error('Erro ao comprimir imagem:', err);
      setErrors(['Não foi possível carregar a imagem. Tente uma foto menor.']);
    } finally {
      setUploadingSlots((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  const handleRemovePhoto = (questionId: string) => {
    setPhotos((prev) => prev.filter((p) => p.questionId !== questionId));
  };

  const handleSingleChoice = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleMultipleChoice = (questionId: string, value: string) => {
    setAnswers((prev) => {
      const currentList: string[] = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      let nextList: string[];
      if (value === 'nenhuma') {
        nextList = ['nenhuma'];
      } else {
        const withoutNone = currentList.filter((v) => v !== 'nenhuma');
        if (withoutNone.includes(value)) {
          nextList = withoutNone.filter((v) => v !== value);
        } else {
          nextList = [...withoutNone, value];
        }
      }
      return { ...prev, [questionId]: nextList };
    });
  };

  const handleTextChange = (questionId: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: text }));
  };

  const handleScaleChoice = (questionId: string, num: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: num }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateAnamnesisAnswers(template, answers, photos);
    if (!validation.valid) {
      setErrors(validation.errors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setErrors([]);

    try {
      const submissionId = `sub_${Date.now()}_${profile.uid}`;
      const submission: AnamnesisSubmission = {
        id: submissionId,
        studentUid: profile.uid,
        studentName: profile.displayName || 'Aluno',
        teacherUid,
        templateId: template.id,
        answers,
        photos,
        submittedAt: Date.now(),
        status: 'pending_review',
      };

      // 1. Salva a submissão
      saveAnamnesisSubmission(submission);

      // 2. Extrai limitações biomecânicas e atualiza o perfil do aluno
      const mapped = mapAnamnesisToUserProfileLimitations(template, answers);
      await updateUserProfile({
        reportedLimitations: mapped.reportedLimitations,
        avoidedMovements: mapped.avoidedMovements,
        equipments: mapped.equipments,
        primaryGoal: mapped.primaryGoal,
        linkedTeacherId: teacherUid,
        linkedTeacherName: template.teacherName || 'Professor Parceiro',
        hasCompletedAnamnesis: true,
        onboardingCompleted: true,
        routineConfirmed: false,
      });

      // 3. Cria vínculo pendente ou ativo com o professor
      const linkId = `link_${teacherUid}_${profile.uid}`;
      const link: TeacherStudentLink = {
        id: linkId,
        teacherUid,
        teacherName: template.teacherName || 'Professor Parceiro',
        studentUid: profile.uid,
        studentName: profile.displayName || 'Aluno',
        studentEmail: profile.email || '',
        status: 'pending',
        weeklyPrescriptions: [],
        assignedPlans: [],
        lastSubmissionId: submissionId,
        updatedAt: Date.now(),
      };
      await saveTeacherStudentLink(link);

      // 4. Emite broadcast
      broadcastLiveSync({
        type: 'ANAMNESIS_SUBMITTED',
        teacherUid,
        studentUid: profile.uid,
        timestamp: Date.now(),
        payload: submission,
      });

      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'instant' });
    } catch (err) {
      console.error('Erro ao enviar anamnese:', err);
      setErrors(['Ocorreu um erro ao enviar suas respostas. Tente novamente.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#19231E] flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto font-sans">
        <header className="pt-4 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-[#125F55] flex items-center justify-center text-white font-black text-sm">
              S
            </div>
            <span className="font-extrabold text-[#19231E] text-base tracking-tight">Superação</span>
          </div>
        </header>

        <main className="flex-1 flex flex-col justify-center py-8 space-y-6 text-center">
          <div className="w-20 h-20 rounded-full bg-[#EAF3EF] text-[#125F55] flex items-center justify-center text-4xl mx-auto shadow-inner">
            ✓
          </div>
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-[#EAF3EF] text-[#125F55] text-xs font-bold uppercase tracking-wider">
              Enviado com Sucesso
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#19231E]">
              Avaliação Entregue ao Professor!
            </h1>
            <p className="text-sm text-[#5B7170] max-w-sm mx-auto leading-relaxed">
              Suas respostas e fotos foram organizadas no prontuário do professor{' '}
              <strong className="text-[#19231E]">{template.teacherName || 'Parceiro'}</strong>.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-[#C9DBD3]/60 text-left space-y-3 shadow-sm">
            <h3 className="font-bold text-sm text-[#19231E] flex items-center gap-2">
              <span>🔔</span> O que acontece agora?
            </h3>
            <ul className="text-xs text-[#5B7170] space-y-2 list-disc list-inside">
              <li>O professor analisará seus objetivos, limites e fotos.</li>
              <li>Ele montará seu plano de treinos e seus descansos (total ou ativo).</li>
              <li>
                Assim que ele salvar, suas fichas e dias de treino{' '}
                <strong className="text-[#125F55]">aparecerão automaticamente na sua tela inicial</strong>.
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={onFinish}
            className="w-full py-4 px-6 rounded-full bg-[#125F55] text-white font-bold text-base hover:bg-[#0E4B43] shadow-md shadow-[#125F55]/20 transition-all"
          >
            Ir para Minha Tela Inicial
          </button>
        </main>

        <footer className="py-2 text-center text-xs text-[#5B7170]">
          Superação • Treinos com cuidado e conexão real
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#19231E] flex flex-col justify-between p-4 sm:p-6 max-w-xl mx-auto font-sans">
      <header className="pt-2 pb-4 flex items-center justify-between border-b border-[#C9DBD3]/50">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-bold text-[#5B7170] hover:text-[#19231E] px-3 py-1.5 rounded-full hover:bg-[#EAF3EF] transition-colors"
        >
          ← Cancelar
        </button>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#125F55]">
            Avaliação Personalizada
          </p>
          <h2 className="text-xs font-extrabold text-[#19231E]">
            {template.teacherName || 'Professor Parceiro'}
          </h2>
        </div>
        <div className="w-16" />
      </header>

      <main className="flex-1 py-6 space-y-6">
        <div className="space-y-1.5">
          <h1 className="text-xl sm:text-2xl font-black text-[#19231E]">
            {template.title}
          </h1>
          <p className="text-xs sm:text-sm text-[#5B7170] leading-relaxed">
            {template.description}
          </p>
        </div>

        {errors.length > 0 && (
          <div className="p-4 rounded-2xl bg-[#C84B31]/10 border border-[#C84B31]/30 text-xs text-[#C84B31] space-y-1">
            <p className="font-bold flex items-center gap-1">
              <span>⚠️</span> Por favor, revise os seguintes itens:
            </p>
            <ul className="list-disc list-inside space-y-0.5">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {template.questions.map((q, idx) => {
            const hasUploadedPhoto = photos.find((p) => p.questionId === q.id);
            const isUploading = uploadingSlots[q.id];

            return (
              <div
                key={q.id}
                className="bg-white rounded-3xl p-5 border border-[#C9DBD3]/60 shadow-sm space-y-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <label className="text-sm font-bold text-[#19231E] flex-1">
                      {idx + 1}. {q.title}
                    </label>
                    {q.required ? (
                      <span className="text-[10px] uppercase font-bold text-[#125F55] bg-[#EAF3EF] px-2 py-0.5 rounded-full shrink-0">
                        Obrigatória
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#5B7170] bg-[#FAF8F5] px-2 py-0.5 rounded-full shrink-0">
                        Opcional
                      </span>
                    )}
                  </div>
                  {q.subtitle && (
                    <p className="text-xs text-[#5B7170] leading-relaxed">{q.subtitle}</p>
                  )}
                </div>

                {/* Tipo: Single Choice */}
                {q.type === 'single_choice' && q.options && (
                  <div className="space-y-2 pt-1">
                    {q.options.map((opt) => {
                      const isSelected = answers[q.id] === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSingleChoice(q.id, opt.value)}
                          className={`w-full p-3 rounded-2xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                            isSelected
                              ? 'border-[#125F55] bg-[#EAF3EF] text-[#125F55]'
                              : 'border-[#C9DBD3]/60 bg-[#FAF8F5] text-[#19231E] hover:border-[#125F55]/40'
                          }`}
                        >
                          <span>{opt.label}</span>
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                              isSelected
                                ? 'border-[#125F55] bg-[#125F55] text-white'
                                : 'border-[#C9DBD3]'
                            }`}
                          >
                            {isSelected && '✓'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Tipo: Multiple Choice */}
                {q.type === 'multiple_choice' && q.options && (
                  <div className="space-y-2 pt-1">
                    {q.options.map((opt) => {
                      const selectedList: string[] = Array.isArray(answers[q.id])
                        ? answers[q.id]
                        : [];
                      const isChecked = selectedList.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleMultipleChoice(q.id, opt.value)}
                          className={`w-full p-3 rounded-2xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                            isChecked
                              ? 'border-[#125F55] bg-[#EAF3EF] text-[#125F55]'
                              : 'border-[#C9DBD3]/60 bg-[#FAF8F5] text-[#19231E] hover:border-[#125F55]/40'
                          }`}
                        >
                          <span>{opt.label}</span>
                          <span
                            className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] ${
                              isChecked
                                ? 'border-[#125F55] bg-[#125F55] text-white font-bold'
                                : 'border-[#C9DBD3]'
                            }`}
                          >
                            {isChecked && '✓'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Tipo: Escala 1 a 10 */}
                {q.type === 'scale_1_10' && (
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                        const isChosen = answers[q.id] === num;
                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleScaleChoice(q.id, num)}
                            className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                              isChosen
                                ? 'border-[#125F55] bg-[#125F55] text-white shadow-sm'
                                : 'border-[#C9DBD3]/60 bg-[#FAF8F5] text-[#19231E] hover:border-[#125F55]'
                            }`}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                    {q.scaleLabels && (
                      <div className="flex justify-between text-[10px] font-medium text-[#5B7170] px-1">
                        <span>{q.scaleLabels.min}</span>
                        <span>{q.scaleLabels.max}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Tipo: Texto Curto ou Longo */}
                {(q.type === 'text_short' || q.type === 'text_long') && (
                  <div className="pt-1">
                    {q.type === 'text_short' ? (
                      <input
                        type="text"
                        value={answers[q.id] || ''}
                        onChange={(e) => handleTextChange(q.id, e.target.value)}
                        placeholder="Digite aqui sua resposta..."
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-[#C9DBD3] bg-[#FAF8F5] text-xs text-[#19231E] focus:outline-none focus:ring-2 focus:ring-[#125F55] focus:bg-white"
                      />
                    ) : (
                      <textarea
                        rows={3}
                        value={answers[q.id] || ''}
                        onChange={(e) => handleTextChange(q.id, e.target.value)}
                        placeholder="Conte detalhes que você considera importantes para seu treino..."
                        className="w-full p-3 rounded-2xl border border-[#C9DBD3] bg-[#FAF8F5] text-xs text-[#19231E] focus:outline-none focus:ring-2 focus:ring-[#125F55] focus:bg-white resize-none"
                      />
                    )}
                  </div>
                )}

                {/* Tipo: Photo Upload */}
                {q.type === 'photo_upload' && (
                  <div className="space-y-3 pt-1">
                    {hasUploadedPhoto ? (
                      <div className="relative rounded-2xl overflow-hidden border border-[#C9DBD3] bg-[#F5F8F5] p-2 flex items-center gap-3">
                        <img
                          src={hasUploadedPhoto.dataUrl}
                          alt={q.title}
                          className="w-16 h-16 object-cover rounded-xl border border-[#C9DBD3]/50"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#19231E]">
                            Foto carregada com sucesso
                          </p>
                          <span className="inline-block text-[10px] text-[#125F55] bg-[#EAF3EF] px-2 py-0.5 rounded-full font-bold mt-1">
                            ✓ Otimizada para mobile
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(q.id)}
                          className="text-xs font-bold text-[#C84B31] p-2 hover:bg-[#C84B31]/10 rounded-xl transition-colors"
                          aria-label="Remover foto"
                        >
                          Trocar
                        </button>
                      </div>
                    ) : (
                      <div>
                        <label
                          htmlFor={`file_input_${q.id}`}
                          className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                            isUploading
                              ? 'border-[#125F55] bg-[#EAF3EF] opacity-60'
                              : 'border-[#C9DBD3] bg-[#FAF8F5] hover:border-[#125F55] hover:bg-[#EAF3EF]/40'
                          }`}
                        >
                          <span className="text-2xl mb-1">📸</span>
                          <span className="text-xs font-bold text-[#125F55]">
                            {isUploading ? 'Otimizando foto...' : 'Tirar Foto ou Escolher da Galeria'}
                          </span>
                          <span className="text-[10px] text-[#5B7170] mt-0.5">
                            Comprimida automaticamente para rapidez e privacidade
                          </span>
                          <input
                            id={`file_input_${q.id}`}
                            type="file"
                            accept="image/*"
                            disabled={isUploading}
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handlePhotoUpload(q.id, q.photoCategory, file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-4 space-y-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-full bg-[#125F55] text-white font-bold text-base hover:bg-[#0E4B43] shadow-md shadow-[#125F55]/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Enviando avaliação...' : 'Finalizar e Enviar para o Professor'}
            </button>
            <p className="text-center text-[11px] text-[#5B7170]">
              Suas informações ficam protegidas e acessíveis apenas a você e ao professor conectado.
            </p>
          </div>
        </form>
      </main>
    </div>
  );
};
