/**
 * Cloud Functions for Firebase (2ª Geração) — SuperAção IA v9.5 Produção
 * Micro-Gateway Serverless para DeepInfra, 4 Agentes Cognitivos, ASR, Embeddings e Central Admin.
 *
 * NOTA DE DEPLOY: Não exige Secret Manager prévio porque resolve a credencial via
 * Cofre Seguro do Super Admin no Firestore nomeado (system_secrets/deepinfra) OU process.env.DEEPINFRA_API_KEY.
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

if (getApps().length === 0) {
  initializeApp();
}

import { runMasterPersonalAgent } from './agents/masterPersonalAgent.js';
import { runPartnerTeacherCopilot } from './agents/partnerTeacherCopilotAgent.js';
import { runTelemetryAnalyst } from './agents/telemetryAnalystAgent.js';
import { runHabitCompanion } from './agents/habitCompanionAgent.js';
import { transcribeMicroAudio } from './agents/voiceService.js';
import {
  handleAdminGetDashboardSnapshot,
  handleAdminUpdateAiSettings,
  handleAdminTestModelConnection,
  handleAdminUpsertSkillOverride,
  handleAdminSearchAndManageUsers,
  handleAdminUpdateApiKey,
} from './admin/adminCallable.js';

const RUNTIME_OPTS = {
  region: 'us-central1',
  memory: '512MiB' as const,
  timeoutSeconds: 60,
  cors: true,
};

/**
 * 1. Endpoint do Agente Principal de Personal (MasterPersonalAgent)
 * Aceita tanto os nomes canônicos quanto aliases do cliente para 100% de compatibilidade.
 */
export const masterPersonalAssistant = onCall(RUNTIME_OPTS, async (request) => {
  try {
    const data = request.data || {};
    const uid = request.auth?.uid || data.uid || 'guest';
    return await runMasterPersonalAgent({
      uid,
      userMessage: data.userMessage || data.message || '',
      historyTurns: data.historyTurns || data.conversationHistory || [],
      activeScreenContext: data.activeScreenContext || data.activeContext,
      reportedLimitations: data.reportedLimitations || [],
      equipments: data.equipments || [],
      primaryGoal: data.primaryGoal,
      preferredDurationMinutes: data.preferredDurationMinutes,
      healthNotes: data.healthNotes,
      userContextNotes: data.userContextNotes,
      isTeacherManaged: Boolean(data.isTeacherManaged),
      sessionExercises: data.sessionExercises || [],
      catalogCandidates: data.catalogCandidates || [],
      programSummary: data.programSummary,
    });
  } catch (err: any) {
    console.error('[Function:masterPersonalAssistant] Erro:', err);
    throw new HttpsError('internal', err?.message || 'Erro ao processar com o Personal Principal.');
  }
});

/**
 * 2. Endpoint do Co-Piloto Multimodal do Professor (PartnerTeacherCopilot)
 */
export const partnerTeacherCopilot = onCall(RUNTIME_OPTS, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Apenas professores autenticados podem acionar o co-piloto.');
  }

  try {
    const data = request.data || {};
    const sub = data.submission || data;
    const analysis = await runPartnerTeacherCopilot({
      submissionId: sub.id || data.submissionId || 'sub_adhoc',
      studentName: sub.studentName || data.studentName || 'Aluno',
      teacherUid: request.auth.uid,
      answers: sub.answers || data.answers || {},
      photos: sub.photos || data.photos || [],
    });
    return {
      ...analysis,
      analysis,
    };
  } catch (err: any) {
    console.error('[Function:partnerTeacherCopilot] Erro:', err);
    throw new HttpsError('internal', err?.message || 'Erro ao analisar anamnese.');
  }
});

/**
 * 3. Endpoint do Analista Longitudinal de Telemetria (TelemetryAnalyst)
 */
export const telemetryAnalyst = onCall(RUNTIME_OPTS, async (request) => {
  try {
    const data = request.data || {};
    const uid = request.auth?.uid || data.uid || 'guest';
    return await runTelemetryAnalyst({
      uid,
      displayName: data.displayName,
      completedWorkoutsCount: Number(data.completedWorkoutsCount ?? data.sessionsCount) || 0,
      partialWorkoutsCount: Number(data.partialWorkoutsCount) || 0,
      externalPracticesCount: Number(data.externalPracticesCount) || 0,
      targetWeeklyGoal: Number(data.targetWeeklyGoal) || 3,
      averageRpe: Number(data.averageRpe) || 3.0,
      predominantPreMood: data.predominantPreMood,
      predominantPostMood: data.predominantPostMood,
      frequentlySkippedExerciseNames: data.frequentlySkippedExerciseNames || [],
      mesocycleWeek: Number(data.mesocycleWeek) || 1,
      totalProgramWeeks: Number(data.totalProgramWeeks) || 8,
    });
  } catch (err: any) {
    console.error('[Function:telemetryAnalyst] Erro:', err);
    throw new HttpsError('internal', err?.message || 'Erro na análise de telemetria.');
  }
});

/**
 * 4. Endpoint do Companheiro de Hábitos e Constância Diária (HabitCompanion)
 */
export const habitCompanion = onCall(RUNTIME_OPTS, async (request) => {
  try {
    const data = request.data || {};
    const uid = request.auth?.uid || data.uid || 'guest';
    return await runHabitCompanion({
      uid,
      userMessage: data.userMessage || data.message || '',
      displayName: data.displayName,
      exerciseReason: data.exerciseReason,
      habitAnchor: data.habitAnchor,
      todayPlanTitle: data.todayPlanTitle,
      lastMood: data.lastMood,
      currentStreakDays: data.currentStreakDays,
      completedThisWeek: data.completedThisWeek,
    });
  } catch (err: any) {
    console.error('[Function:habitCompanion] Erro:', err);
    throw new HttpsError('internal', err?.message || 'Erro no companheiro de hábitos.');
  }
});

/**
 * 5. Endpoint de Transcrição de Micro-Áudio (VoiceTranscription)
 */
export const voiceTranscription = onCall(RUNTIME_OPTS, async (request) => {
  try {
    const data = request.data || {};
    const uid = request.auth?.uid || data.uid || 'guest';
    if (!data.audioBase64) {
      throw new HttpsError('invalid-argument', 'O áudio em base64 é obrigatório.');
    }

    return await transcribeMicroAudio({
      uid,
      audioBase64: data.audioBase64,
      mimeType: data.mimeType,
    });
  } catch (err: any) {
    console.error('[Function:voiceTranscription] Erro:', err);
    throw new HttpsError('internal', err?.message || 'Erro ao transcrever áudio.');
  }
});

// =======================================================================
// Endpoints Administrativos (Protegidos por requireAdmin)
// =======================================================================

export const adminGetDashboard = onCall(RUNTIME_OPTS, async (request) => {
  try {
    return await handleAdminGetDashboardSnapshot(request.auth, request.data?.days);
  } catch (err: any) {
    throw new HttpsError('permission-denied', err?.message || 'Acesso administrativo negado.');
  }
});

export const adminUpdateSettings = onCall(RUNTIME_OPTS, async (request) => {
  try {
    const updates = request.data?.updates || request.data?.newConfig || request.data || {};
    return await handleAdminUpdateAiSettings(request.auth, updates);
  } catch (err: any) {
    throw new HttpsError('permission-denied', err?.message || 'Acesso administrativo negado.');
  }
});

export const adminTestModel = onCall(RUNTIME_OPTS, async (request) => {
  try {
    return await handleAdminTestModelConnection(
      request.auth,
      request.data || { serviceId: 'master_personal' }
    );
  } catch (err: any) {
    throw new HttpsError('permission-denied', err?.message || 'Acesso administrativo negado.');
  }
});

export const adminManageSkill = onCall(RUNTIME_OPTS, async (request) => {
  try {
    return await handleAdminUpsertSkillOverride(
      request.auth,
      request.data || { skillId: '', isEnabled: true }
    );
  } catch (err: any) {
    throw new HttpsError('permission-denied', err?.message || 'Acesso administrativo negado.');
  }
});

export const adminManageUsers = onCall(RUNTIME_OPTS, async (request) => {
  try {
    return await handleAdminSearchAndManageUsers(request.auth, request.data || {});
  } catch (err: any) {
    throw new HttpsError('permission-denied', err?.message || 'Acesso administrativo negado.');
  }
});

export const adminUpdateApiKey = onCall(RUNTIME_OPTS, async (request) => {
  try {
    return await handleAdminUpdateApiKey(request.auth, request.data || { apiKey: '' });
  } catch (err: any) {
    throw new HttpsError('permission-denied', err?.message || 'Acesso administrativo negado ao atualizar credencial.');
  }
});

// Aliases de compatibilidade direta com aiClient.ts
export const adminSaveApiKey = adminUpdateApiKey;
export const adminDashboardSnapshot = adminGetDashboard;
export const adminSaveAiSettings = adminUpdateSettings;
export const adminTestModelConnection = adminTestModel;
export const adminSaveSkillOverride = adminManageSkill;
export const adminManageUserQuota = adminManageUsers;
