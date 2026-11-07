/**
 * Cloud Functions for Firebase (2ª Geração) — Superação IA v9.0
 * Micro-Gateway Serverless para DeepInfra, 4 Agentes Especializados e Central Admin
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

// Inicializa Firebase Admin SDK apenas uma vez
if (getApps().length === 0) {
  initializeApp();
}

// Import dos Agentes e Serviços
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
} from './admin/adminCallable.js';

// Configurações padrão de execução das Cloud Functions v2
const RUNTIME_OPTS = {
  region: 'us-central1',
  memory: '512MiB' as const,
  timeoutSeconds: 60,
  secrets: ['DEEPINFRA_API_KEY'],
};

/**
 * 1. Endpoint do Agente Principal de Personal (MasterPersonalAgent)
 */
export const masterPersonalAssistant = onCall(RUNTIME_OPTS, async (request) => {
  try {
    const data = request.data || {};
    const uid = request.auth?.uid || data.uid || 'guest';
    return await runMasterPersonalAgent({
      uid,
      userMessage: data.userMessage || '',
      historyTurns: data.historyTurns,
      activeScreenContext: data.activeScreenContext,
      reportedLimitations: data.reportedLimitations,
      healthNotes: data.healthNotes,
      userContextNotes: data.userContextNotes,
      isTeacherManaged: Boolean(data.isTeacherManaged),
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
    return await runPartnerTeacherCopilot({
      submissionId: data.submissionId || 'sub_adhoc',
      studentName: data.studentName || 'Aluno',
      teacherUid: request.auth.uid,
      answers: data.answers || {},
      photos: data.photos || [],
    });
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
      completedWorkoutsCount: Number(data.completedWorkoutsCount) || 0,
      partialWorkoutsCount: Number(data.partialWorkoutsCount) || 0,
      externalPracticesCount: Number(data.externalPracticesCount) || 0,
      targetWeeklyGoal: Number(data.targetWeeklyGoal) || 3,
      averageRpe: Number(data.averageRpe) || 3.0,
      predominantPreMood: data.predominantPreMood,
      predominantPostMood: data.predominantPostMood,
      frequentlySkippedExerciseNames: data.frequentlySkippedExerciseNames || [],
      mesocycleWeek: Number(data.mesocycleWeek) || 1,
    });
  } catch (err: any) {
    console.error('[Function:telemetryAnalyst] Erro:', err);
    throw new HttpsError('internal', err?.message || 'Erro na análise de telemetria.');
  }
});

/**
 * 4. Endpoint do Companheiro de Hábitos (HabitCompanion)
 */
export const habitCompanion = onCall(RUNTIME_OPTS, async (request) => {
  try {
    const data = request.data || {};
    const uid = request.auth?.uid || data.uid || 'guest';
    return await runHabitCompanion({
      uid,
      userMessage: data.userMessage || '',
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
    return await handleAdminUpdateAiSettings(request.auth, request.data?.updates || {});
  } catch (err: any) {
    throw new HttpsError('permission-denied', err?.message || 'Acesso administrativo negado.');
  }
});

export const adminTestModel = onCall(RUNTIME_OPTS, async (request) => {
  try {
    return await handleAdminTestModelConnection(request.auth, request.data || { serviceId: 'master_personal' });
  } catch (err: any) {
    throw new HttpsError('permission-denied', err?.message || 'Acesso administrativo negado.');
  }
});

export const adminManageSkill = onCall(RUNTIME_OPTS, async (request) => {
  try {
    return await handleAdminUpsertSkillOverride(request.auth, request.data || { skillId: '', isEnabled: true });
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
