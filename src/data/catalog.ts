import { essentialProgramExercises } from './essentialProgramExercises';
import { useState, useEffect } from 'react';
import exercisesSeedJson from '../../data/exercicios_seed.json';
import templatesJson from '../../data/templates_seed.json';
import { Exercise, WorkoutPlan } from '../types';
import { specializedHomeExercises } from './specializedExercises';

// Exercícios dedicados de Recuperação Ativa (Mobilidade & Alongamento)
export const specializedRecoveryExercises: Exercise[] = [
  {
    id: 'mob_gato_vaca',
    name_pt: 'Gato e Vaca (Mobilidade da Coluna)',
    name_en: 'Cat-Cow Stretch',
    modality: 'mobilidade',
    movement_pattern: 'mobilidade_coluna',
    equipment: ['peso_corporal'],
    environment: ['casa', 'ar_livre'],
    difficulty_candidate: 'iniciante',
    tracking: 'reps',
    requires_anchor: false,
    instructions_pt: 'Em quatro apoios, alterne suavemente entre arquear as costas para cima (expirando) e descer a barriga olhando à frente (inspirando).',
    caution_pt: 'Movimento lento e suave, sem forçar o pescoço.',
    review_status: 'revisado_mobilidade',
    media_url: null,
    images: [
      '/exercises/Cat_Stretch/0.jpg',
      '/exercises/Cat_Stretch/1.jpg',
    ],
    target_muscle: 'Coluna e Costas',
    primary_muscles: ['Coluna vertebral', 'Eretores da espinha'],
    secondary_muscles: ['Abdômen & Core', 'Pescoço'],
    steps_pt: [
      'Posicione-se em quatro apoios, mãos abaixo dos ombros e joelhos abaixo dos quadris.',
      'Inspire e afunde a coluna em direção ao chão, elevando o peito e o olhar (Vaca).',
      'Expire e curve a coluna para cima em direção ao teto, recolhendo o queixo ao peito (Gato).',
      'Mantenha a fluidez respiratória sem pressa por 8 a 10 ciclos.',
    ],
  },
  {
    id: 'along_abertura_quadril',
    name_pt: 'Alongamento em 90/90 para Quadril',
    name_en: '90/90 Hip Mobility',
    modality: 'mobilidade',
    movement_pattern: 'mobilidade_quadril',
    equipment: ['peso_corporal'],
    environment: ['casa', 'ar_livre'],
    difficulty_candidate: 'iniciante',
    tracking: 'time',
    requires_anchor: false,
    instructions_pt: 'Sentado no chão, posicione as pernas em ângulos de 90 graus. Incline suavemente o tronco à frente para soltar os quadris.',
    caution_pt: 'Respeite a amplitude confortável dos seus joelhos.',
    review_status: 'revisado_mobilidade',
    media_url: null,
    images: [
      '/exercises/IT_Band_and_Glute_Stretch/0.jpg',
      '/exercises/IT_Band_and_Glute_Stretch/1.jpg',
    ],
    target_muscle: 'Quadris e Glúteos',
    primary_muscles: ['Rotadores de quadril', 'Glúteo médio'],
    secondary_muscles: ['Lombar'],
    steps_pt: [
      'Sente-se no colchonete e posicione a perna da frente em 90 graus e a de trás também em 90 graus.',
      'Mantenha a coluna ereta e incline o tronco ligeiramente sobre a coxa dianteira.',
      'Respire fundo e sustente o alongamento por 30 a 45 segundos em cada lado.',
    ],
  },
  {
    id: 'along_crianca_lombar',
    name_pt: 'Postura da Criança (Descompressão Lombar)',
    name_en: "Child's Pose",
    modality: 'alongamento',
    movement_pattern: 'descompressao_lombar',
    equipment: ['peso_corporal'],
    environment: ['casa'],
    difficulty_candidate: 'iniciante',
    tracking: 'time',
    requires_anchor: false,
    instructions_pt: 'Ajoelhe-se, sente sobre os calcanhares e deslize os braços à frente no chão, relaxando o peito e a testa.',
    caution_pt: 'Respeite a sensibilidade dos joelhos e quadris.',
    review_status: 'revisado_alongamento',
    media_url: null,
    images: [
      '/exercises/Childs_Pose/0.jpg',
      '/exercises/Childs_Pose/1.jpg',
    ],
    target_muscle: 'Lombar e Costas',
    primary_muscles: ['Lombar', 'Costas & Romboides'],
    secondary_muscles: ['Quadris'],
    steps_pt: [
      'Ajoelhe-se no colchonete com os dedões dos pés juntos e joelhos confortavelmente afastados.',
      'Sente sobre os calcanhares e estenda os braços à frente no chão.',
      'Apoie a testa suavemente e respire fundo sentindo a lombar descomprimir.',
    ],
  },
  // --- NOVOS EXERCÍCIOS CURADOS DE RECUPERAÇÃO ATIVA, MOBILIDADE & DESCOMPRESSÃO ---
  {
    id: 'mob_rotacao_toracica_livro',
    name_pt: 'Rotação Torácica no Solo (Open Book)',
    name_en: 'Open Book Thoracic Mobility',
    modality: 'mobilidade',
    movement_pattern: 'mobilidade_coluna',
    equipment: ['peso_corporal'],
    environment: ['casa', 'ar_livre'],
    difficulty_candidate: 'iniciante',
    tracking: 'reps',
    requires_anchor: false,
    target_muscle: 'Coluna e Costas',
    primary_muscles: ['Coluna torácica', 'Romboides'],
    secondary_muscles: ['Peitoral', 'Ombros'],
    instructions_pt: 'Deitado de lado com joelhos dobrados a 90 graus, abra o braço superior em arco acompanhando com o olhar até encostar a escápula no chão.',
    caution_pt: 'Mantenha os joelhos juntos e apoiados no chão durante a rotação.',
    review_status: 'revisado_mobilidade',
    images: ['/exercises/Cat_Stretch/0.jpg', '/exercises/Cat_Stretch/1.jpg'],
    steps_pt: [
      'Deite-se de lado com joelhos flexionados a 90 graus.',
      'Estenda ambos os braços à frente na altura dos ombros, palmas juntas.',
      'Inspire e abra o braço de cima em arco abrindo o peito em direção ao outro lado.',
      'Solte o ar no final da amplitude e retorne suavemente.',
    ],
  },
  {
    id: 'along_flexor_quadril_semi_ajoelhado',
    name_pt: 'Alongamento do Psoas e Flexores do Quadril',
    name_en: 'Half-Kneeling Hip Flexor Stretch',
    modality: 'alongamento',
    movement_pattern: 'mobilidade_quadril',
    equipment: ['peso_corporal'],
    environment: ['casa', 'ar_livre'],
    difficulty_candidate: 'iniciante',
    tracking: 'time',
    requires_anchor: false,
    target_muscle: 'Quadris e Glúteos',
    primary_muscles: ['Psoas', 'Reto femoral'],
    secondary_muscles: ['Glúteo', 'Lombar'],
    instructions_pt: 'Em posição de semi-ajoelhado, contraia o glúteo da perna de trás e projete a bacia sutilmente à frente até sentir alongar a frente da coxa.',
    caution_pt: 'Não arqueie a lombar; mantenha o abdômen ligeiramente ativo.',
    review_status: 'revisado_alongamento',
    images: ['/exercises/IT_Band_and_Glute_Stretch/0.jpg', '/exercises/IT_Band_and_Glute_Stretch/1.jpg'],
    steps_pt: [
      'Apoie um joelho no colchonete e posicione o outro pé à frente a 90 graus.',
      'Contraia o glúteo do lado do joelho apoiado e mantenha o tronco ereto.',
      'Desloque o quadril suavemente à frente sem curvar as costas.',
      'Sustente 30 a 40 segundos e troque de perna.',
    ],
  },
  {
    id: 'along_peitoral_parede_porta',
    name_pt: 'Abertura Peitoral e Ombros na Parede ou Batente',
    name_en: 'Doorway Chest & Anterior Shoulder Stretch',
    modality: 'alongamento',
    movement_pattern: 'postura_abertura',
    equipment: ['peso_corporal', 'parede'],
    environment: ['casa', 'ar_livre'],
    difficulty_candidate: 'iniciante',
    tracking: 'time',
    requires_anchor: false,
    requires_supports: ['parede'],
    target_muscle: 'Peitoral',
    primary_muscles: ['Peitoral maior', 'Deltoide anterior'],
    secondary_muscles: ['Bíceps'],
    instructions_pt: 'Apoie o antebraço em um batente ou parede na altura do ombro e dê um passo à frente com o tronco girando suavemente no sentido oposto.',
    caution_pt: 'Excelente para quem trabalha no computador; faça sem puxões.',
    review_status: 'revisado_alongamento',
    images: ['/exercises/Pushups/0.jpg', '/exercises/Pushups/1.jpg'],
    steps_pt: [
      'Posicione o antebraço verticalmente contra o batente de uma porta.',
      'Dê um passo à frente com o pé do mesmo lado.',
      'Gire o tronco ligeiramente para o lado oposto até sentir o peitoral abrir.',
      'Mantenha respiração profunda por 30 segundos cada lado.',
    ],
  },
  {
    id: 'along_piriforme_cadeira',
    name_pt: 'Alongamento de Glúteo e Ciático na Cadeira (Figura 4)',
    name_en: 'Seated Figure-4 Piriformis Stretch',
    modality: 'alongamento',
    movement_pattern: 'mobilidade_quadril',
    equipment: ['peso_corporal', 'cadeira'],
    environment: ['casa'],
    difficulty_candidate: 'iniciante',
    tracking: 'time',
    requires_anchor: false,
    requires_supports: ['cadeira'],
    target_muscle: 'Quadris e Glúteos',
    primary_muscles: ['Piriforme', 'Glúteo médio'],
    secondary_muscles: ['Lombar'],
    instructions_pt: 'Sentado em uma cadeira com postura ereta, cruze o tornozelo sobre o joelho oposto e incline o tronco à frente a partir dos quadris.',
    caution_pt: 'Alívio imediato para desconforto ciático ou fadiga de ficar sentado.',
    review_status: 'revisado_alongamento',
    images: ['/exercises/IT_Band_and_Glute_Stretch/0.jpg', '/exercises/IT_Band_and_Glute_Stretch/1.jpg'],
    steps_pt: [
      'Sente-se na beirada de uma cadeira firme com pés apoiados.',
      'Cruze o tornozelo direito sobre a coxa esquerda formando um número 4.',
      'Mantenha as costas retas e incline o peito em direção à canela.',
      'Respire fundo sustentando 35 segundos em cada lado.',
    ],
  },
  {
    id: 'mob_descompressao_cervical_trapezio',
    name_pt: 'Descompressão Cervical e Soltura de Trapézio em Pé',
    name_en: 'Standing Neck & Upper Trap Decompression',
    modality: 'alongamento',
    movement_pattern: 'mobilidade_coluna',
    equipment: ['peso_corporal'],
    environment: ['casa', 'ar_livre'],
    difficulty_candidate: 'iniciante',
    tracking: 'time',
    requires_anchor: false,
    target_muscle: 'Pescoço e Ombros',
    primary_muscles: ['Trapézio superior', 'Elevador da escápula'],
    secondary_muscles: ['Escalenos'],
    instructions_pt: 'Incline a cabeça suavemente em direção ao ombro direito enquanto empurra a mão esquerda em direção ao chão para afastar o ombro da orelha.',
    caution_pt: 'Apenas o peso da própria mão sobre a cabeça, sem tracionar com força.',
    review_status: 'revisado_alongamento',
    images: ['/exercises/Cat_Stretch/0.jpg', '/exercises/Cat_Stretch/1.jpg'],
    steps_pt: [
      'Fique em pé ou sentado com coluna alongada.',
      'Incline a orelha direita em direção ao ombro direito.',
      'Estenda o braço esquerdo para baixo com a palma apontada para o chão.',
      'Sinta o alívio na lateral do pescoço por 30 segundos cada lado.',
    ],
  },
  {
    id: 'along_isquiotibiais_em_pe',
    name_pt: 'Alongamento Suave de Posterior de Coxa em Pé',
    name_en: 'Standing Hamstring Heel Tap Stretch',
    modality: 'alongamento',
    movement_pattern: 'mobilidade_quadril',
    equipment: ['peso_corporal'],
    environment: ['casa', 'ar_livre'],
    difficulty_candidate: 'iniciante',
    tracking: 'time',
    requires_anchor: false,
    target_muscle: 'Posterior de Coxa',
    primary_muscles: ['Isquiotibiais', 'Panturrilha'],
    secondary_muscles: ['Glúteos'],
    instructions_pt: 'Apoie o calcanhar à frente com a ponta do pé para cima, dobre ligeiramente a perna de apoio e incline o quadril para trás com a coluna reta.',
    caution_pt: 'Sem curvar a coluna lombar; o movimento parte do quadril.',
    review_status: 'revisado_alongamento',
    images: ['/exercises/IT_Band_and_Glute_Stretch/0.jpg', '/exercises/IT_Band_and_Glute_Stretch/1.jpg'],
    steps_pt: [
      'Dê um pequeno passo à frente apoiando apenas o calcanhar no solo.',
      'Flexione o joelho da perna de trás e incline o quadril para trás.',
      'Mantenha as mãos apoiadas sobre a coxa de apoio.',
      'Sustente a posição sentindo a parte de trás da coxa esticar por 30 segundos.',
    ],
  },
  {
    id: 'mob_punhos_antebracos_tatame',
    name_pt: 'Mobilidade e Descompressão de Punhos e Antebraços',
    name_en: 'Wrist & Forearm Decompression Mobility',
    modality: 'mobilidade',
    movement_pattern: 'mobilidade_articular',
    equipment: ['peso_corporal'],
    environment: ['casa', 'ar_livre'],
    difficulty_candidate: 'iniciante',
    tracking: 'reps',
    requires_anchor: false,
    target_muscle: 'Antebraços e Punhos',
    primary_muscles: ['Flexores do carpo', 'Extensores do carpo'],
    secondary_muscles: ['Mãos'],
    instructions_pt: 'Em quatro apoios ou em pé, apoie as palmas com os dedos voltados para trás e balance o corpo suavemente aliviando a pegada e antebraço.',
    caution_pt: 'Essencial após treinos de pegada (Jiu-Jitsu, escalada ou digitação intensa).',
    review_status: 'revisado_mobilidade',
    images: ['/exercises/Cat_Stretch/0.jpg', '/exercises/Cat_Stretch/1.jpg'],
    steps_pt: [
      'Em quatro apoios no colchonete, apoie as palmas com os dedos apontando para os joelhos.',
      'Desloque o peso do corpo suavemente para trás por 2 segundos e retorne.',
      'Vire as costas das mãos para baixo com suavidade e repita.',
      'Execute 10 repetições fluidas respirando com calma.',
    ],
  },
  {
    id: 'mob_tornozelo_parede',
    name_pt: 'Mobilidade Dinâmica de Tornozelo na Parede',
    name_en: 'Wall Ankle Dorsiflexion Mobility',
    modality: 'mobilidade',
    movement_pattern: 'mobilidade_articular',
    equipment: ['peso_corporal', 'parede'],
    environment: ['casa', 'ar_livre'],
    difficulty_candidate: 'iniciante',
    tracking: 'reps',
    requires_anchor: false,
    requires_supports: ['parede'],
    target_muscle: 'Panturrilhas',
    primary_muscles: ['Sóleo', 'Tibial anterior'],
    secondary_muscles: ['Tendão de Aquiles'],
    instructions_pt: 'Com o pé a cerca de 10 cm da parede, projete o joelho à frente tentando tocar a parede sem tirar o calcanhar do chão.',
    caution_pt: 'Fundamental para agachar melhor e evitar sobrecarga na patela do joelho.',
    review_status: 'revisado_mobilidade',
    images: ['/exercises/Cat_Stretch/0.jpg', '/exercises/Cat_Stretch/1.jpg'],
    steps_pt: [
      'Fique em pé de frente para uma parede.',
      'Posicione um pé à frente e o outro atrás.',
      'Flexione o joelho da frente tentando tocar a parede mantendo o calcanhar colado no chão.',
      'Faça 10 repetições com cada perna de forma ritmada.',
    ],
  },
  {
    id: 'cardio_shadow_boxing_tatame',
    name_pt: 'Sombra Técnica de Artes Marciais (Shadow Boxing Sem Impacto)',
    name_en: 'Martial Arts Shadow Boxing (Low Impact Cardio)',
    modality: 'cardio',
    movement_pattern: 'cardio_low_impact',
    equipment: ['peso_corporal'],
    environment: ['casa', 'ar_livre'],
    difficulty_candidate: 'iniciante',
    tracking: 'time',
    requires_anchor: false,
    target_muscle: 'Corpo Todo',
    primary_muscles: ['Deltoides', 'Core', 'Cardiorrespiratório'],
    secondary_muscles: ['Pernas', 'Dorsais'],
    instructions_pt: 'Em postura de guarda de luta com joelhos soltos, desferir golpes retos (jab, direto) com rotação suave do quadril sem saltos.',
    caution_pt: 'Não hiperestenda os cotovelos ao golpear; mantenha a respiração a cada golpe.',
    review_status: 'revisado_cardio',
    images: ['/exercises/Pushups/0.jpg', '/exercises/Pushups/1.jpg'],
    steps_pt: [
      'Posicione-se em guarda lateral com mãos protegendo o rosto.',
      'Alterne golpes retos de jab e direto girando o calcanhar traseiro suavemente.',
      'Mantenha ritmo constante ativando o abdômen sem impacto no solo.',
      'Mantenha por 40 a 60 segundos com respiração cadenciada.',
    ],
  },
  {
    id: 'cardio_step_jack_sem_salto',
    name_pt: 'Polichinelo Sem Salto (Step Jack de Baixo Impacto)',
    name_en: 'Low-Impact Step Jack',
    modality: 'cardio',
    movement_pattern: 'cardio_low_impact',
    equipment: ['peso_corporal'],
    environment: ['casa', 'ar_livre'],
    difficulty_candidate: 'iniciante',
    tracking: 'time',
    requires_anchor: false,
    target_muscle: 'Cardiorrespiratório',
    primary_muscles: ['Cardiorrespiratório', 'Ombros'],
    secondary_muscles: ['Glúteos', 'Panturrilhas'],
    instructions_pt: 'Alterne um passo lateral para a direita elevando os braços e retorne; depois faça o mesmo para a esquerda, sem saltos e com pés firmes.',
    caution_pt: 'Perfeito para queimar energia e aquecer o corpo sem sobrecarregar joelhos ou coluna.',
    review_status: 'revisado_cardio',
    images: ['/exercises/Pushups/0.jpg', '/exercises/Pushups/1.jpg'],
    steps_pt: [
      'Fique em pé com pés juntos e braços ao lado do corpo.',
      'Dê um passo lateral para a direita enquanto eleva os braços acima da cabeça.',
      'Retorne ao centro e repita para o lado esquerdo de forma contínua.',
      'Mantenha ritmo alegre e constante.',
    ],
  },
  {
    id: 'mob_cossack_squat_assistido',
    name_pt: 'Agachamento Cossaco Assistido (Mobilidade Lateral de Luta)',
    name_en: 'Assisted Cossack Squat Mobility',
    modality: 'mobilidade',
    movement_pattern: 'mobilidade_quadril',
    equipment: ['peso_corporal'],
    environment: ['casa', 'ar_livre'],
    difficulty_candidate: 'intermediario',
    tracking: 'reps',
    requires_anchor: false,
    target_muscle: 'Quadris e Pernas',
    primary_muscles: ['Adutores', 'Glúteo médio'],
    secondary_muscles: ['Quadríceps', 'Tornozelos'],
    instructions_pt: 'Com pernas bem afastadas e mãos apoiadas em uma cadeira ou chão, transfira o peso para um lado descendo suavemente o quadril.',
    caution_pt: 'Excelente mobilidade para chutes de artes marciais e passagens de guarda.',
    review_status: 'revisado_mobilidade',
    images: ['/exercises/Bodyweight_Squat/0.jpg', '/exercises/Bodyweight_Squat/1.jpg'],
    steps_pt: [
      'Afaste os pés amplamente (cerca de duas vezes a largura dos ombros).',
      'Apoie as mãos à frente se necessário e desça o quadril sobre a perna direita.',
      'Mantenha a perna esquerda estendida com ponta do pé voltada para cima.',
      'Alterne suavemente entre os lados por 6 a 8 repetições.',
    ],
  },
  {
    id: 'core_dead_bug_mcgill',
    name_pt: 'Dead Bug de Estabilização Lombar (Dr. Stuart McGill)',
    name_en: 'Dead Bug Core Stability',
    modality: 'forca',
    movement_pattern: 'core_anti_extension',
    equipment: ['peso_corporal'],
    environment: ['casa'],
    difficulty_candidate: 'iniciante',
    tracking: 'reps',
    requires_anchor: false,
    target_muscle: 'Abdômen & Core',
    primary_muscles: ['Transverso abdominal', 'Reto abdominal'],
    secondary_muscles: ['Flexores de quadril'],
    instructions_pt: 'De costas no chão com braços para o teto e joelhos a 90 graus, estenda o braço direito para trás e perna esquerda à frente mantendo a lombar colada no chão.',
    caution_pt: 'Padrão ouro de reabilitação lombar: não deixe as costas arquearem.',
    review_status: 'revisado_forca',
    images: ['/exercises/Superman/0.jpg', '/exercises/Superman/1.jpg'],
    steps_pt: [
      'Deite de costas no solo com braços elevados apontando para o teto e joelhos a 90 graus.',
      'Pressione a lombar contra o colchonete ativando o abdômen.',
      'Desça o braço direito para trás e estenda a perna esquerda à frente de forma lenta.',
      'Retorne e alterne os membros mantendo controle absoluto.',
    ],
  },
  {
    id: 'respiracao_diafragmatica_recuperacao',
    name_pt: 'Respiração Diafragmática e Desaceleração Vagal (4-4-6)',
    name_en: 'Diaphragmatic Parasympathetic Recovery Breathing',
    modality: 'mobilidade',
    movement_pattern: 'recuperacao_respiratoria',
    equipment: ['peso_corporal'],
    environment: ['casa', 'ar_livre'],
    difficulty_candidate: 'iniciante',
    tracking: 'time',
    requires_anchor: false,
    target_muscle: 'Diafragma e Sistema Nervoso',
    primary_muscles: ['Diafragma', 'Intercostais'],
    secondary_muscles: ['Core'],
    instructions_pt: 'Deite confortavelmente com uma mão no peito e outra no abdômen. Inspire pelo nariz em 4 segundos inflando a barriga e expire pela boca em 6 segundos relaxando todo o corpo.',
    caution_pt: 'Ativação direta do sistema parassimpático pós-treino e redução rápida de cortisol.',
    review_status: 'revisado_mobilidade',
    images: ['/exercises/Childs_Pose/0.jpg', '/exercises/Childs_Pose/1.jpg'],
    steps_pt: [
      'Deite-se no colchonete ou sente-se em uma cadeira com olhos fechados.',
      'Coloque uma mão no abdômen.',
      'Inspire pelo nariz por 4 segundos sentindo a mão subir.',
      'Expire lentamente pela boca em 6 segundos esvaziando as tensões do dia.',
    ],
  },
];

export function normalizeFullCatalogItem(item: any): Exercise {
  let eq: string[] = Array.isArray(item.equipment) ? [...item.equipment] : ['peso_corporal'];

  const namePt = item.name_pt || item.name_en || '';
  const nameLower = (namePt + ' ' + (item.name_en || '') + ' ' + (item.instructions_pt || '')).toLowerCase();

  if (nameLower.includes('halter') && !eq.includes('halteres')) {
    eq = eq.filter((e) => e !== 'kettlebell' && e !== 'peso_corporal');
    eq.push('halteres');
  }

  const isMiniBand =
    nameLower.includes('mini band') ||
    nameLower.includes('miniband') ||
    nameLower.includes('faixa circular') ||
    nameLower.includes('glute band') ||
    nameLower.includes('monster walk') ||
    item.id?.includes('mini_band') ||
    ((eq.includes('elasticos') || eq.includes('band')) &&
      (nameLower.includes('abdu') || nameLower.includes('quadril') || nameLower.includes('glute') || nameLower.includes('lateral')));

  const isTubos =
    nameLower.includes('tubo') ||
    nameLower.includes('pegador') ||
    nameLower.includes('tubular');

  const isFaixaLonga =
    nameLower.includes('faixa longa') ||
    nameLower.includes('super band') ||
    nameLower.includes('superband') ||
    nameLower.includes('banda longa') ||
    nameLower.includes('resistencia longa') ||
    ((nameLower.includes('elástico') || nameLower.includes('elastico') || nameLower.includes('band') || eq.includes('band') || eq.includes('elasticos')) &&
      !isMiniBand &&
      !isTubos);

  if (isMiniBand && !eq.includes('mini_band')) eq.push('mini_band');
  if (isFaixaLonga && !eq.includes('faixa_longa')) eq.push('faixa_longa');
  if (isTubos && !eq.includes('tubos_elasticos')) eq.push('tubos_elasticos');

  const isPullUpBar =
    item.id === 'wind_sprints' ||
    nameLower.includes('barra suspensa') ||
    nameLower.includes('barra fixa') ||
    nameLower.includes('pull-up') ||
    nameLower.includes('pullup') ||
    nameLower.includes('chin-up') ||
    nameLower.includes('chinup') ||
    nameLower.includes('scapular pull') ||
    nameLower.includes('hanging leg') ||
    nameLower.includes('pendure-se');

  const requiresSupports: string[] = [];
  if (isPullUpBar) {
    if (!eq.includes('barra_fixa')) eq.push('barra_fixa');
    requiresSupports.push('barra_fixa');
  }

  const isParallelBars =
    nameLower.includes('paralela') ||
    nameLower.includes('parallel bar') ||
    nameLower.includes('dip bar');
  if (isParallelBars) {
    if (!eq.includes('paralelas')) eq.push('paralelas');
    requiresSupports.push('paralelas');
  }

  // Normalização inteligente de 'outros':
  // Na base FreeExerciseDB, 199 exercícios vieram com equipment: ['outros'].
  // Se o exercício for de alongamento, mobilidade, flexibilidade, aquecimento ou calistenia
  // que não exige máquina ou carga pesada, normaliza para peso_corporal para não ser bloqueado.
  const hasHeavyMachineOrEquipment =
    eq.includes('maquina') ||
    eq.includes('polia') ||
    eq.includes('barra') ||
    eq.includes('halteres') ||
    eq.includes('kettlebell') ||
    eq.includes('barra_w') ||
    eq.includes('medicine_ball') ||
    eq.includes('rolo_liberacao') ||
    nameLower.includes('sled') ||
    nameLower.includes('battling rope') ||
    nameLower.includes('atlas stone') ||
    nameLower.includes('prowler') ||
    nameLower.includes('treadmill') ||
    nameLower.includes('bike');

  if (eq.includes('outros')) {
    if (
      !hasHeavyMachineOrEquipment ||
      item.modality === 'alongamento' ||
      item.modality === 'mobilidade' ||
      nameLower.includes('alongamento') ||
      nameLower.includes('rotação') ||
      nameLower.includes('rotacao') ||
      nameLower.includes('liberação') ||
      nameLower.includes('mobilidade')
    ) {
      eq = eq.filter((e) => e !== 'outros');
      if (!eq.includes('peso_corporal')) eq.push('peso_corporal');
    }
  }

  if (nameLower.includes('banco') || nameLower.includes('bench')) {
    if (!eq.includes('banco')) eq.push('banco');
    requiresSupports.push('banco');
  }
  if (nameLower.includes('cadeira') || nameLower.includes('chair')) {
    if (!eq.includes('cadeira')) eq.push('cadeira');
    requiresSupports.push('cadeira');
  }
  if (nameLower.includes('parede') || nameLower.includes('wall')) {
    if (!eq.includes('parede')) eq.push('parede');
    requiresSupports.push('parede');
  }

  let cleanNamePt = namePt;
  if (item.id === 'wind_sprints') {
    cleanNamePt = 'Elevação de Joelhos na Barra Suspensa (Wind Sprints)';
  } else if (item.id === 'pullups') {
    cleanNamePt = 'Barra Fixa Clássica';
  } else if (item.id === 'chin-up') {
    cleanNamePt = 'Barra Fixa com Pegada Supinada';
  } else if (item.id === 'scapular_pull-up') {
    cleanNamePt = 'Elevação Escapular na Barra Fixa';
  } else if (item.id === 'prowler_sprint') {
    cleanNamePt = 'Empurrada de Trenó com Arrancada (Prowler Sprint)';
  } else if (item.id === 'rowing_stationary') {
    cleanNamePt = 'Remada no Ergômetro (Remo Estacionário)';
  }

  let cleanInstructions = (item.instructions_pt || '')
    .replace(/Amasse o mais alto que puder/gi, 'Eleve o tronco na amplitude máxima confortável')
    .replace(/Amasse o tronco/gi, 'Eleve e flexione suavemente o tronco');

  let cleanSteps = (item.steps_pt || [cleanInstructions || 'Movimento com controle e ritmo.']).map((s: string) =>
    s.replace(/Amasse o mais alto que puder/gi, 'Eleve o tronco na amplitude máxima confortável')
     .replace(/Amasse o tronco/gi, 'Eleve e flexione suavemente o tronco')
  );

  const isCurated =
    item.review_status === 'catalogo_publico_verificado' ||
    item.review_status === 'revisado' ||
    item.source_kind === 'free_exercise_db_public_domain';

  return {
    id: item.id,
    name_pt: cleanNamePt,
    name_en: item.name_en,
    modality: item.modality || 'forca',
    movement_pattern: item.movement_pattern || 'funcional',
    equipment: eq,
    environment: item.environment || ['casa'],
    difficulty_candidate: item.difficulty_candidate || 'iniciante',
    tracking: item.tracking || 'reps',
    requires_anchor: isPullUpBar || Boolean(item.requires_anchor),
    requires_supports: requiresSupports,
    is_curated_for_auto_proposal: isCurated,
    instructions_pt: cleanInstructions,
    caution_pt: item.caution_pt || 'Execute com postura controlada e respiração fluida.',
    review_status: item.review_status || 'catalogo_publico_verificado',
    media_url: item.media_url,
    images: item.images || [],
    target_muscle: item.target_muscle || 'Corpo Todo',
    primary_muscles: item.primary_muscles || [item.target_muscle || 'Corpo Todo'],
    secondary_muscles: item.secondary_muscles || [],
    steps_pt: cleanSteps,
    source_kind: item.source_kind || 'free_exercise_db_public_domain',
    version: item.version || '1.0.0',
  };
}

// Mescla garantindo que exercícios essenciais estejam disponíveis no milissegundo zero (Camada 1 Instantânea)
const exerciseIdSet = new Set<string>();
export const allExercises: Exercise[] = [];

// 1. Exercícios especializados de recuperação ativa
specializedRecoveryExercises.forEach((ex) => {
  if (!exerciseIdSet.has(ex.id)) {
    exerciseIdSet.add(ex.id);
    allExercises.push(ex);
  }
});

// 2. Exercícios especializados de puxar, costas e fortalecimento em casa
specializedHomeExercises.forEach((ex) => {
  if (!exerciseIdSet.has(ex.id)) {
    exerciseIdSet.add(ex.id);
    allExercises.push(ex);
  }
});

// 3. Exercícios essenciais dos programas e fichas oficiais
essentialProgramExercises.forEach((ex) => {
  if (!exerciseIdSet.has(ex.id)) {
    exerciseIdSet.add(ex.id);
    allExercises.push(ex);
  }
});

// 4. Mecanismo de Carregamento Assíncrono Sob Demanda da Enciclopédia Completa (Camada 2)
let isFullCatalogLoaded = false;
let fullCatalogPromise: Promise<Exercise[]> | null = null;
const catalogListeners = new Set<() => void>();

export function isFullCatalogReady(): boolean {
  return isFullCatalogLoaded;
}

export async function ensureFullCatalogLoaded(): Promise<Exercise[]> {
  if (isFullCatalogLoaded) return allExercises;
  if (fullCatalogPromise) return fullCatalogPromise;

  fullCatalogPromise = (async () => {
    try {
      const mod = await import('../../data/catalog_full_pt.json');
      const rawList: any[] = mod.default || mod;
      for (const item of rawList) {
        if (!exerciseIdSet.has(item.id)) {
          const normalized = normalizeFullCatalogItem(item);
          exerciseIdSet.add(normalized.id);
          allExercises.push(normalized);
        }
      }
      isFullCatalogLoaded = true;
      catalogListeners.forEach((fn) => fn());
      return allExercises;
    } catch (err) {
      console.warn('Erro ao carregar catálogo completo sob demanda:', err);
      return allExercises;
    }
  })();

  return fullCatalogPromise;
}

export function useFullCatalog(): { isReady: boolean; totalCount: number } {
  const [ready, setReady] = useState<boolean>(isFullCatalogLoaded);
  useEffect(() => {
    if (isFullCatalogLoaded) {
      setReady(true);
      return;
    }
    const listener = () => setReady(true);
    catalogListeners.add(listener);
    void ensureFullCatalogLoaded();
    return () => {
      catalogListeners.delete(listener);
    };
  }, []);
  return { isReady: ready, totalCount: allExercises.length };
}

// Templates Seed do projeto oficial com etiqueta explícita de "modelo demonstrativo" (A17)
export const rawTemplates: WorkoutPlan[] = (templatesJson as any[]).map((t, idx) => {
  return {
    id: t.id || `template_seed_${idx}`,
    ownerUid: 'system_seed',
    title: t.name_pt || t.title_pt || t.title || 'Treino Modelo',
    description: t.note || t.description_pt || t.description || 'Modelo demonstrativo para referência e adaptação pessoal.',
    version: 1,
    isProfessional: false,
    authorName: 'Superação (Demonstrativo)',
    sourceKind: 'modelo_demonstracao',
    reviewStatus: 'demonstrativo',
    isTemplate: true,
    estimatedDurationMinutes: t.estimated_minutes_example || t.estimated_duration_minutes || 20,
    category: t.environment === 'rua' ? 'caminhada' : t.modality === 'mobilidade' ? 'mobilidade' : (t.category || 'casa'),
    exercises: (t.items || []).map((item: any) => {
      const ex = allExercises.find((e) => e.id === item.exercise_id);
      return {
        exerciseId: item.exercise_id,
        exerciseName: ex ? ex.name_pt : item.exercise_id,
        targetSets: item.sets || item.target_sets || 3,
        targetReps: item.target_reps_example || item.target_reps || 10,
        targetDurationSeconds: item.target_duration_seconds || (item.tracking === 'time' ? 30 : undefined),
        restSeconds: item.rest_seconds || 45,
        notes: item.notes || '',
      };
    }),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
});

// Templates Verificados de Alta Qualidade construídos com os 876 exercícios reais do catálogo
export const verifiedTemplates: WorkoutPlan[] = [
  {
    id: 'template_forca_corpo_todo_casa',
    ownerUid: 'system_verified',
    title: 'Corpo Inteiro Essencial (Sem Equipamentos)',
    description: 'Rotina equilibrada de 20 minutos com os 4 pilares do treino funcional: agachar, empurrar, ponte de glúteos e estabilidade de core.',
    version: 1,
    isProfessional: false,
    authorName: 'Superação (Curadoria)',
    isTemplate: true,
    category: 'casa',
    estimatedDurationMinutes: 20,
    exercises: [
      {
        exerciseId: 'bodyweight_squat',
        exerciseName: 'Agachamento Livre com Peso Corporal',
        targetSets: 3,
        targetReps: 12,
        restSeconds: 60,
        notes: 'Pés na largura dos ombros, descida controlada',
      },
      {
        exerciseId: 'pushups',
        exerciseName: 'Flexão de Braços no Solo',
        targetSets: 3,
        targetReps: 10,
        restSeconds: 60,
        notes: 'Mantenha o corpo em linha reta e abdômen firme',
      },
      {
        exerciseId: 'butt_lift_bridge',
        exerciseName: 'Ponte de Glúteos no Solo',
        targetSets: 3,
        targetReps: 12,
        restSeconds: 45,
        notes: 'Aperte os glúteos no topo por 1 segundo',
      },
      {
        exerciseId: 'plank',
        exerciseName: 'Prancha Abdominal Isométrica',
        targetSets: 3,
        targetReps: 0,
        targetDurationSeconds: 35,
        restSeconds: 45,
        notes: 'Não prenda a respiração',
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'template_halteres_superior',
    ownerUid: 'system_verified',
    title: 'Força Superior com Halteres',
    description: 'Trabalho completo de peitoral, costas, ombros e braços para desenvolver postura e força.',
    version: 1,
    isProfessional: false,
    authorName: 'Superação (Curadoria)',
    isTemplate: true,
    category: 'academia',
    estimatedDurationMinutes: 28,
    exercises: [
      {
        exerciseId: 'dumbbell_bench_press',
        exerciseName: 'Supino Reto com Halteres',
        targetSets: 3,
        targetReps: 10,
        restSeconds: 60,
      },
      {
        exerciseId: 'one-arm_dumbbell_row',
        exerciseName: 'Remada Unilateral com Halter (Serrote)',
        targetSets: 3,
        targetReps: 10,
        restSeconds: 60,
      },
      {
        exerciseId: 'dumbbell_shoulder_press',
        exerciseName: 'Desenvolvimento de Ombros com Halteres',
        targetSets: 3,
        targetReps: 10,
        restSeconds: 60,
      },
      {
        exerciseId: 'alternate_hammer_curl',
        exerciseName: 'Rosca Martelo Alternada com Halteres',
        targetSets: 3,
        targetReps: 12,
        restSeconds: 45,
      },
      {
        exerciseId: 'bench_dips',
        exerciseName: 'Mergulho no Banco para Tríceps',
        targetSets: 3,
        targetReps: 12,
        restSeconds: 45,
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'template_elasticos_funcional',
    ownerUid: 'system_verified',
    title: 'Força Funcional com Faixas Elásticas',
    description: 'Treino de resistência progressiva com elásticos, ideal para casa, viagens ou reabilitação articular.',
    version: 1,
    isProfessional: false,
    authorName: 'Superação (Curadoria)',
    isTemplate: true,
    category: 'casa',
    estimatedDurationMinutes: 22,
    exercises: [
      {
        exerciseId: 'band_pull_apart',
        exerciseName: 'Abertura de Escápulas com Faixa Elástica (Band Pull-Apart)',
        targetSets: 3,
        targetReps: 15,
        restSeconds: 45,
      },
      {
        exerciseId: 'band_alternating_biceps_curl',
        exerciseName: 'Rosca Bíceps Alternada com Elástico',
        targetSets: 3,
        targetReps: 12,
        restSeconds: 45,
      },
      {
        exerciseId: 'clam',
        exerciseName: 'Clamshell (Ostra para Ativação de Glúteo Médio)',
        targetSets: 3,
        targetReps: 15,
        restSeconds: 30,
      },
      {
        exerciseId: 'bodyweight_squat',
        exerciseName: 'Agachamento com Peso Corporal',
        targetSets: 3,
        targetReps: 12,
        restSeconds: 45,
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];


// Rotinas curtas de Recuperação Ativa (Descanso Ativo) pré-configuradas para os dias de pausa de força
export const activeRecoveryTemplates: WorkoutPlan[] = [
  {
    id: 'template_recuperacao_quadril_lombar',
    ownerUid: 'system_recovery',
    title: 'Recuperação Ativa: Quadril e Coluna',
    description: 'Rotina suave de 8 minutos para soltar a musculatura, aliviar a lombar e manter a circulação sem desgaste.',
    version: 1,
    isProfessional: false,
    authorName: 'Superação (Recuperação)',
    isTemplate: true,
    category: 'mobilidade',
    estimatedDurationMinutes: 8,
    exercises: [
      {
        exerciseId: 'mob_gato_vaca',
        exerciseName: 'Gato e Vaca (Mobilidade da Coluna)',
        targetSets: 2,
        targetReps: 10,
        restSeconds: 30,
        notes: 'Respire fundo a cada transição',
      },
      {
        exerciseId: 'along_abertura_quadril',
        exerciseName: 'Alongamento em 90/90 para Quadril',
        targetSets: 2,
        targetReps: 0,
        targetDurationSeconds: 40,
        restSeconds: 30,
        notes: '40 segundos cada lado',
      },
      {
        exerciseId: 'along_crianca_lombar',
        exerciseName: 'Postura da Criança (Descompressão Lombar)',
        targetSets: 2,
        targetReps: 0,
        targetDurationSeconds: 45,
        restSeconds: 30,
        notes: 'Relaxamento profundo da lombar',
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'template_recuperacao_tronco_ombros',
    ownerUid: 'system_recovery',
    title: 'Recuperação Ativa: Postura e Ombros',
    description: 'Descompressão para quem trabalha sentado: alívio do peitoral, pescoço e respiração revigorante.',
    version: 1,
    isProfessional: false,
    authorName: 'Superação (Recuperação)',
    isTemplate: true,
    category: 'mobilidade',
    estimatedDurationMinutes: 6,
    exercises: [
      {
        exerciseId: 'mob_gato_vaca',
        exerciseName: 'Gato e Vaca (Mobilidade da Coluna)',
        targetSets: 2,
        targetReps: 8,
        restSeconds: 25,
      },
      {
        exerciseId: 'along_crianca_lombar',
        exerciseName: 'Postura da Criança (Descompressão Lombar)',
        targetSets: 2,
        targetReps: 0,
        targetDurationSeconds: 40,
        restSeconds: 20,
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

import { premadeWorkouts } from './premadeWorkouts';

export const allTemplates: WorkoutPlan[] = [
  ...premadeWorkouts,
  ...verifiedTemplates,
  ...activeRecoveryTemplates,
  ...rawTemplates,
];

// Helper de normalização sem acentos para busca flexível
export const normalizeText = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

// Helpers de busca flexível e multifiltro (A09, A10)
export function searchExercises(

  query: string,
  filterEquipment?: string,
  filterMuscle?: string,
  filterModality?: string
): Exercise[] {
  const cleanQ = normalizeText(query);
  const isMiniBandSearch = cleanQ.includes('mini band') || cleanQ.includes('miniband') || cleanQ === 'band';

  return allExercises.filter((ex) => {
    // 1. Busca por texto (nome PT, nome EN, músculo, equipamento, padrão)
    if (cleanQ) {
      const matchName = normalizeText(ex.name_pt).includes(cleanQ);
      const matchNameEn = normalizeText(ex.name_en || '').includes(cleanQ);
      const matchMuscle = normalizeText(ex.target_muscle || '').includes(cleanQ);
      const matchPrimary = (ex.primary_muscles || []).some((m) => normalizeText(m).includes(cleanQ));
      const matchSecondary = (ex.secondary_muscles || []).some((m) => normalizeText(m).includes(cleanQ));
      const matchEquipment = ex.equipment.some((eq) => normalizeText(eq).includes(cleanQ));
      const matchMiniBand = isMiniBandSearch && (ex.equipment.includes('mini_band') || ex.id.includes('mini_band'));

      if (!matchName && !matchNameEn && !matchMuscle && !matchPrimary && !matchSecondary && !matchEquipment && !matchMiniBand) {
        return false;
      }
    }

    // 2. Filtro de Equipamento
    if (filterEquipment && filterEquipment !== 'todos') {
      if (filterEquipment === 'peso_corporal') {
        const matchesBodyweight = ex.equipment.includes('peso_corporal') || ex.equipment.includes('nenhum');
        if (!matchesBodyweight) return false;
      } else if (!ex.equipment.includes(filterEquipment)) {
        return false;
      }
    }

    // 3. Filtro de Músculo / Região
    if (filterMuscle && filterMuscle !== 'todos') {
      const target = normalizeText(ex.target_muscle || '');
      const pMuscles = (ex.primary_muscles || []).map((m) => normalizeText(m));
      const fClean = normalizeText(filterMuscle);

      const matchesMuscle = target.includes(fClean) || pMuscles.some((m) => m.includes(fClean));
      if (!matchesMuscle) return false;
    }

    // 4. Filtro de Modalidade
    if (filterModality && filterModality !== 'todas') {
      if (ex.modality !== filterModality) return false;
    }

    return true;
  });
}

export function getExerciseById(id: string): Exercise | undefined {
  return allExercises.find((e) => e.id === id);
}
