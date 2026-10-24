import { Exercise } from '../types';

// 22 Exercícios Essenciais pré-carregados das fichas e programas oficiais
export const essentialProgramExercises: Exercise[] = [
  {
    "id": "bodyweight_squat",
    "name_pt": "Agachamento Livre com Peso Corporal",
    "name_en": "Bodyweight Squat",
    "modality": "forca",
    "movement_pattern": "strength",
    "equipment": [
      "peso_corporal"
    ],
    "environment": [
      "casa",
      "ar_livre"
    ],
    "difficulty_candidate": "iniciante",
    "tracking": "reps",
    "requires_anchor": false,
    "requires_supports": [],
    "is_curated_for_auto_proposal": true,
    "instructions_pt": "Fique em pé com os pés afastados na largura dos ombros. Você pode colocar as mãos atrás da cabeça. Esta será sua posição inicial. Comece o movimento flexionando os joelhos e quadris, sentando-se com os quadris. Continue descendo até a profundidade total, se puder, e inverta rapidamente o movimento até retornar à posição inicial. Ao agachar, mantenha a cabeça e o peito erguidos e empurre os joelhos para fora.",
    "caution_pt": "Alinhe os joelhos com a ponta dos pés durante todo o movimento sem deixar que eles entrem (valgo).",
    "review_status": "catalogo_publico_verificado",
    "media_url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bodyweight_Squat/0.jpg",
    "images": [
      "/exercises/Bodyweight_Squat/0.jpg",
      "/exercises/Bodyweight_Squat/1.jpg"
    ],
    "target_muscle": "Quadríceps",
    "primary_muscles": [
      "Quadríceps"
    ],
    "secondary_muscles": [
      "Glúteos",
      "Posterior de Coxa"
    ],
    "steps_pt": [
      "Fique em pé com os pés afastados na largura dos ombros. Você pode colocar as mãos atrás da cabeça. Esta será sua posição inicial.",
      "Comece o movimento flexionando os joelhos e quadris, sentando-se com os quadris.",
      "Continue descendo até a profundidade total, se puder, e inverta rapidamente o movimento até retornar à posição inicial. Ao agachar, mantenha a cabeça e o peito erguidos e empurre os joelhos para fora."
    ],
    "source_kind": "free_exercise_db_public_domain",
    "version": "1.0.0"
  },
  {
    "id": "plank",
    "name_pt": "Prancha Abdominal Isométrica",
    "name_en": "Plank",
    "modality": "forca",
    "movement_pattern": "strength",
    "equipment": [
      "peso_corporal"
    ],
    "environment": [
      "casa",
      "ar_livre"
    ],
    "difficulty_candidate": "iniciante",
    "tracking": "time",
    "requires_anchor": false,
    "requires_supports": [],
    "is_curated_for_auto_proposal": true,
    "instructions_pt": "Fique de bruços no chão, apoiando o peso nos dedos dos pés e nos antebraços. Seus braços estão dobrados e diretamente abaixo dos ombros. Mantenha o corpo reto o tempo todo e mantenha essa posição o maior tempo possível. Para aumentar a dificuldade, um braço ou perna pode ser levantado.",
    "caution_pt": "Mantenha a posição estável respirando com calma; não prenda o ar durante a isometria.",
    "review_status": "catalogo_publico_verificado",
    "media_url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Plank/0.jpg",
    "images": [
      "/exercises/Plank/0.jpg",
      "/exercises/Plank/1.jpg"
    ],
    "target_muscle": "Abdômen & Core",
    "primary_muscles": [
      "Abdômen & Core"
    ],
    "secondary_muscles": [],
    "steps_pt": [
      "Fique de bruços no chão, apoiando o peso nos dedos dos pés e nos antebraços. Seus braços estão dobrados e diretamente abaixo dos ombros.",
      "Mantenha o corpo reto o tempo todo e mantenha essa posição o maior tempo possível. Para aumentar a dificuldade, um braço ou perna pode ser levantado."
    ],
    "source_kind": "free_exercise_db_public_domain",
    "version": "1.0.0"
  },
  {
    "id": "butt_lift_bridge",
    "name_pt": "Elevação de Quadril no Solo (Ponte)",
    "name_en": "Butt Lift (Bridge)",
    "modality": "forca",
    "movement_pattern": "strength",
    "equipment": [
      "peso_corporal"
    ],
    "environment": [
      "casa",
      "ar_livre"
    ],
    "difficulty_candidate": "iniciante",
    "tracking": "reps",
    "requires_anchor": false,
    "requires_supports": [],
    "is_curated_for_auto_proposal": true,
    "instructions_pt": "Deite-se no chão de costas com as mãos ao lado do corpo e os joelhos dobrados. Seus pés devem ser colocados na largura dos ombros. Esta será sua posição inicial. Empurrando principalmente com os calcanhares, levante os quadris do chão enquanto mantém as costas retas. Expire enquanto executa esta parte do movimento e segure no topo por um segundo. Volte lentamente à posição inicial enquanto inspira.",
    "caution_pt": "Mantenha a postura alinhada, execute com ritmo controlado e respeite sua amplitude confortável.",
    "review_status": "catalogo_publico_verificado",
    "media_url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Butt_Lift_Bridge/0.jpg",
    "images": [
      "/exercises/Butt_Lift_Bridge/0.jpg",
      "/exercises/Butt_Lift_Bridge/1.jpg"
    ],
    "target_muscle": "Glúteos",
    "primary_muscles": [
      "Glúteos"
    ],
    "secondary_muscles": [
      "Posterior de Coxa"
    ],
    "steps_pt": [
      "Deite-se no chão de costas com as mãos ao lado do corpo e os joelhos dobrados. Seus pés devem ser colocados na largura dos ombros. Esta será sua posição inicial.",
      "Empurrando principalmente com os calcanhares, levante os quadris do chão enquanto mantém as costas retas. Expire enquanto executa esta parte do movimento e segure no topo por um segundo.",
      "Volte lentamente à posição inicial enquanto inspira."
    ],
    "source_kind": "free_exercise_db_public_domain",
    "version": "1.0.0"
  },
  {
    "id": "incline_push-up",
    "name_pt": "Flexão de Braços Inclinada (Mãos Apoiadas)",
    "name_en": "Incline Push-Up",
    "modality": "forca",
    "movement_pattern": "strength",
    "equipment": [
      "peso_corporal",
      "banco"
    ],
    "environment": [
      "casa",
      "ar_livre"
    ],
    "difficulty_candidate": "iniciante",
    "tracking": "reps",
    "requires_anchor": false,
    "requires_supports": [
      "banco"
    ],
    "is_curated_for_auto_proposal": true,
    "instructions_pt": "Fique de frente para um banco ou plataforma elevada e robusta. Coloque as mãos na borda do banco ou plataforma, um pouco mais largas que a largura dos ombros. Posicione o antepé atrás do banco ou plataforma com os braços e o corpo retos. Os braços devem estar perpendiculares ao corpo. Mantendo o corpo reto, abaixe o tórax até a borda da caixa ou plataforma dobrando os braços. Empurre o corpo para cima até que os braços estejam estendidos. Repita.",
    "caution_pt": "Mantenha a postura alinhada, execute com ritmo controlado e respeite sua amplitude confortável.",
    "review_status": "catalogo_publico_verificado",
    "media_url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Push-Up/0.jpg",
    "images": [
      "/exercises/Incline_Push-Up/0.jpg",
      "/exercises/Incline_Push-Up/1.jpg"
    ],
    "target_muscle": "Peitoral",
    "primary_muscles": [
      "Peitoral"
    ],
    "secondary_muscles": [
      "Ombros & Deltoides",
      "Tríceps"
    ],
    "steps_pt": [
      "Fique de frente para um banco ou plataforma elevada e robusta. Coloque as mãos na borda do banco ou plataforma, um pouco mais largas que a largura dos ombros.",
      "Posicione o antepé atrás do banco ou plataforma com os braços e o corpo retos. Os braços devem estar perpendiculares ao corpo. Mantendo o corpo reto, abaixe o tórax até a borda da caixa ou plataforma dobrando os braços.",
      "Empurre o corpo para cima até que os braços estejam estendidos. Repita."
    ],
    "source_kind": "free_exercise_db_public_domain",
    "version": "1.0.0"
  },
  {
    "id": "pelvic_tilt_into_bridge",
    "name_pt": "Pelvic Tilt Into Ponte de Glúteos",
    "name_en": "Pelvic Tilt Into Bridge",
    "modality": "alongamento",
    "movement_pattern": "stretching",
    "equipment": [
      "outros"
    ],
    "environment": [
      "academia",
      "casa"
    ],
    "difficulty_candidate": "intermediario",
    "tracking": "time",
    "requires_anchor": false,
    "requires_supports": [],
    "is_curated_for_auto_proposal": true,
    "instructions_pt": "Deite-se com os pés no chão e os calcanhares diretamente sob os joelhos. Levante apenas o cóccix até o teto para alongar a região lombar. (Não levante toda a coluna ainda.) Contraia o estômago. Para entrar em uma ponte, levante toda a coluna, exceto o pescoço.",
    "caution_pt": "Mantenha a posição estável respirando com calma; não prenda o ar durante a isometria.",
    "review_status": "catalogo_publico_verificado",
    "media_url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pelvic_Tilt_Into_Bridge/0.jpg",
    "images": [
      "/exercises/Pelvic_Tilt_Into_Bridge/0.jpg",
      "/exercises/Pelvic_Tilt_Into_Bridge/1.jpg"
    ],
    "target_muscle": "Lombar",
    "primary_muscles": [
      "Lombar"
    ],
    "secondary_muscles": [],
    "steps_pt": [
      "Deite-se com os pés no chão e os calcanhares diretamente sob os joelhos.",
      "Levante apenas o cóccix até o teto para alongar a região lombar. (Não levante toda a coluna ainda.) Contraia o estômago.",
      "Para entrar em uma ponte, levante toda a coluna, exceto o pescoço."
    ],
    "source_kind": "free_exercise_db_public_domain",
    "version": "1.0.0"
  },
  {
    "id": "crunches",
    "name_pt": "Abdominal Tradicional no Solo",
    "name_en": "Crunches",
    "modality": "forca",
    "movement_pattern": "strength",
    "equipment": [
      "peso_corporal",
      "banco"
    ],
    "environment": [
      "casa",
      "ar_livre"
    ],
    "difficulty_candidate": "iniciante",
    "tracking": "reps",
    "requires_anchor": false,
    "requires_supports": [
      "banco"
    ],
    "is_curated_for_auto_proposal": true,
    "instructions_pt": "Deite-se de costas com os pés apoiados no chão ou apoiado em um banco com os joelhos dobrados em um ângulo de 90 graus. Se você estiver apoiando os pés em um banco, coloque-os de sete a dezoito centímetros de distância e aponte os dedos dos pés para dentro para que se toquem. Agora coloque as mãos levemente em cada lado da cabeça, mantendo os cotovelos para dentro. Dica: não cruze os dedos atrás da cabeça. Enquanto empurra a parte inferior das costas no chão para isolar melhor os músculos abdominais, comece a rolar os ombros para fora do chão. Continue empurrando para baixo o máximo que puder com a parte inferior das costas enquanto contrai os abdominais e expira. Seus ombros devem levantar-se do chão apenas cerca de dez centímetros e a parte inferior das costas deve permanecer no chão. No topo do movimento, contraia fortemente os abdominais e mantenha a contração por um segundo. Dica: Concentre-se em movimentos lentos e controlados – não se engane usando o impulso. Após a contração de um segundo, comece a descer lentamente novamente à posição inicial enquanto inspira. Repita pela quantidade recomendada de repetições.",
    "caution_pt": "Mantenha a postura alinhada, execute com ritmo controlado e respeite sua amplitude confortável.",
    "review_status": "catalogo_publico_verificado",
    "media_url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Crunches/0.jpg",
    "images": [
      "/exercises/Crunches/0.jpg",
      "/exercises/Crunches/1.jpg"
    ],
    "target_muscle": "Abdômen & Core",
    "primary_muscles": [
      "Abdômen & Core"
    ],
    "secondary_muscles": [],
    "steps_pt": [
      "Deite-se de costas com os pés apoiados no chão ou apoiado em um banco com os joelhos dobrados em um ângulo de 90 graus. Se você estiver apoiando os pés em um banco, coloque-os de sete a dezoito centímetros de distância e aponte os dedos dos pés para dentro para que se toquem.",
      "Agora coloque as mãos levemente em cada lado da cabeça, mantendo os cotovelos para dentro. Dica: não cruze os dedos atrás da cabeça.",
      "Enquanto empurra a parte inferior das costas no chão para isolar melhor os músculos abdominais, comece a rolar os ombros para fora do chão.",
      "Continue empurrando para baixo o máximo que puder com a parte inferior das costas enquanto contrai os abdominais e expira. Seus ombros devem levantar-se do chão apenas cerca de dez centímetros e a parte inferior das costas deve permanecer no chão. No topo do movimento, contraia fortemente os abdominais e mantenha a contração por um segundo. Dica: Concentre-se em movimentos lentos e controlados – não se engane usando o impulso.",
      "Após a contração de um segundo, comece a descer lentamente novamente à posição inicial enquanto inspira.",
      "Repita pela quantidade recomendada de repetições."
    ],
    "source_kind": "free_exercise_db_public_domain",
    "version": "1.0.0"
  },
  {
    "id": "single_leg_glute_bridge",
    "name_pt": "Ponte de Glúteos Unilateral no Solo",
    "name_en": "Single Leg Glute Bridge",
    "modality": "forca",
    "movement_pattern": "strength",
    "equipment": [
      "peso_corporal"
    ],
    "environment": [
      "casa",
      "ar_livre"
    ],
    "difficulty_candidate": "iniciante",
    "tracking": "reps",
    "requires_anchor": false,
    "requires_supports": [],
    "is_curated_for_auto_proposal": true,
    "instructions_pt": "Deite-se no chão com os pés apoiados e os joelhos dobrados. Levante uma perna do chão, puxando o joelho até o peito. Esta será sua posição inicial. Execute o movimento passando pelo calcanhar, estendendo o quadril para cima e levantando os glúteos do chão. Estenda o máximo possível, faça uma pausa e depois retorne à posição inicial.",
    "caution_pt": "Mantenha a postura alinhada, execute com ritmo controlado e respeite sua amplitude confortável.",
    "review_status": "catalogo_publico_verificado",
    "media_url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Single_Leg_Glute_Bridge/0.jpg",
    "images": [
      "/exercises/Single_Leg_Glute_Bridge/0.jpg",
      "/exercises/Single_Leg_Glute_Bridge/1.jpg"
    ],
    "target_muscle": "Glúteos",
    "primary_muscles": [
      "Glúteos"
    ],
    "secondary_muscles": [
      "Posterior de Coxa"
    ],
    "steps_pt": [
      "Deite-se no chão com os pés apoiados e os joelhos dobrados.",
      "Levante uma perna do chão, puxando o joelho até o peito. Esta será sua posição inicial.",
      "Execute o movimento passando pelo calcanhar, estendendo o quadril para cima e levantando os glúteos do chão.",
      "Estenda o máximo possível, faça uma pausa e depois retorne à posição inicial."
    ],
    "source_kind": "free_exercise_db_public_domain",
    "version": "1.0.0"
  },
  {
    "id": "pushups",
    "name_pt": "Flexão de Braços no Solo",
    "name_en": "Pushups",
    "modality": "forca",
    "movement_pattern": "strength",
    "equipment": [
      "peso_corporal"
    ],
    "environment": [
      "casa",
      "ar_livre"
    ],
    "difficulty_candidate": "iniciante",
    "tracking": "reps",
    "requires_anchor": false,
    "requires_supports": [],
    "is_curated_for_auto_proposal": true,
    "instructions_pt": "Deite-se no chão de bruços e coloque as mãos a cerca de 36 centímetros de distância, enquanto mantém o tronco erguido com os braços estendidos. Em seguida, abaixe-se até que seu peito quase toque o chão enquanto inspira. Agora expire e pressione a parte superior do corpo de volta à posição inicial enquanto aperta o peito. Após uma breve pausa na posição contraída superior, você pode começar a abaixar-se novamente para quantas repetições forem necessárias.",
    "caution_pt": "Mantenha a postura alinhada, execute com ritmo controlado e respeite sua amplitude confortável.",
    "review_status": "catalogo_publico_verificado",
    "media_url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pushups/0.jpg",
    "images": [
      "/exercises/Pushups/0.jpg",
      "/exercises/Pushups/1.jpg"
    ],
    "target_muscle": "Peitoral",
    "primary_muscles": [
      "Peitoral"
    ],
    "secondary_muscles": [
      "Ombros & Deltoides",
      "Tríceps"
    ],
    "steps_pt": [
      "Deite-se no chão de bruços e coloque as mãos a cerca de 36 centímetros de distância, enquanto mantém o tronco erguido com os braços estendidos.",
      "Em seguida, abaixe-se até que seu peito quase toque o chão enquanto inspira.",
      "Agora expire e pressione a parte superior do corpo de volta à posição inicial enquanto aperta o peito.",
      "Após uma breve pausa na posição contraída superior, você pode começar a abaixar-se novamente para quantas repetições forem necessárias."
    ],
    "source_kind": "free_exercise_db_public_domain",
    "version": "1.0.0"
  },
  {
    "id": "mountain_climbers",
    "name_pt": "Corrida na Prancha (Mountain Climbers)",
    "name_en": "Mountain Climbers",
    "modality": "forca",
    "movement_pattern": "plyometrics",
    "equipment": [
      "outros"
    ],
    "environment": [
      "academia",
      "casa"
    ],
    "difficulty_candidate": "iniciante",
    "tracking": "reps",
    "requires_anchor": false,
    "requires_supports": [],
    "is_curated_for_auto_proposal": true,
    "instructions_pt": "Comece na posição de flexão, com o peso apoiado nas mãos e nos dedos dos pés. Flexionando o joelho e o quadril, traga uma perna até que o joelho fique aproximadamente abaixo do quadril. Esta será sua posição inicial. Inverta explosivamente a posição das pernas, estendendo a perna dobrada até que ela fique reta e apoiada pelo dedo do pé, e levantando o outro pé com o quadril e o joelho flexionados. Repita de forma alternada por 20-30 segundos.",
    "caution_pt": "Mantenha a postura alinhada, execute com ritmo controlado e respeite sua amplitude confortável.",
    "review_status": "catalogo_publico_verificado",
    "media_url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Mountain_Climbers/0.jpg",
    "images": [
      "/exercises/Mountain_Climbers/0.jpg",
      "/exercises/Mountain_Climbers/1.jpg"
    ],
    "target_muscle": "Quadríceps",
    "primary_muscles": [
      "Quadríceps"
    ],
    "secondary_muscles": [
      "Peitoral",
      "Posterior de Coxa",
      "Ombros & Deltoides"
    ],
    "steps_pt": [
      "Comece na posição de flexão, com o peso apoiado nas mãos e nos dedos dos pés. Flexionando o joelho e o quadril, traga uma perna até que o joelho fique aproximadamente abaixo do quadril. Esta será sua posição inicial.",
      "Inverta explosivamente a posição das pernas, estendendo a perna dobrada até que ela fique reta e apoiada pelo dedo do pé, e levantando o outro pé com o quadril e o joelho flexionados. Repita de forma alternada por 20-30 segundos."
    ],
    "source_kind": "free_exercise_db_public_domain",
    "version": "1.0.0"
  },
  {
    "id": "split_squats",
    "name_pt": "Split Agachamentos",
    "name_en": "Split Squats",
    "modality": "alongamento",
    "movement_pattern": "stretching",
    "equipment": [
      "outros"
    ],
    "environment": [
      "academia",
      "casa"
    ],
    "difficulty_candidate": "intermediario",
    "tracking": "time",
    "requires_anchor": false,
    "requires_supports": [],
    "is_curated_for_auto_proposal": true,
    "instructions_pt": "Estar em pé. Salte para a posição de pernas abertas, com uma perna para a frente e outra para trás, flexionando os joelhos e abaixando ligeiramente os quadris ao fazer isso. Ao descer, inverta imediatamente a direção, levantando-se e saltando, invertendo a posição das pernas. Repita 5 a 10 vezes em cada perna.",
    "caution_pt": "Mantenha a posição estável respirando com calma; não prenda o ar durante a isometria.",
    "review_status": "catalogo_publico_verificado",
    "media_url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Split_Squats/0.jpg",
    "images": [
      "/exercises/Split_Squats/0.jpg",
      "/exercises/Split_Squats/1.jpg"
    ],
    "target_muscle": "Posterior de Coxa",
    "primary_muscles": [
      "Posterior de Coxa"
    ],
    "secondary_muscles": [
      "Panturrilhas",
      "Glúteos",
      "Quadríceps"
    ],
    "steps_pt": [
      "Estar em pé. Salte para a posição de pernas abertas, com uma perna para a frente e outra para trás, flexionando os joelhos e abaixando ligeiramente os quadris ao fazer isso.",
      "Ao descer, inverta imediatamente a direção, levantando-se e saltando, invertendo a posição das pernas. Repita 5 a 10 vezes em cada perna."
    ],
    "source_kind": "free_exercise_db_public_domain",
    "version": "1.0.0"
  },
  {
    "id": "bench_dips",
    "name_pt": "Mergulho no Banco para Tríceps",
    "name_en": "Bench Dips",
    "modality": "forca",
    "movement_pattern": "strength",
    "equipment": [
      "peso_corporal",
      "banco"
    ],
    "environment": [
      "casa",
      "ar_livre"
    ],
    "difficulty_candidate": "iniciante",
    "tracking": "reps",
    "requires_anchor": false,
    "requires_supports": [
      "banco"
    ],
    "is_curated_for_auto_proposal": true,
    "instructions_pt": "Para este exercício você precisará colocar um banco atrás das costas. Com o banco perpendicular ao corpo e olhando para longe dele, segure-o na borda com as mãos totalmente estendidas, separadas na largura dos ombros. As pernas ficarão estendidas para a frente, dobradas na cintura e perpendiculares ao tronco. Esta será sua posição inicial. Abaixe lentamente o corpo enquanto inspira, dobrando os cotovelos até se abaixar o suficiente para que haja um ângulo ligeiramente menor que 90 graus entre o braço e o antebraço. Dica: Mantenha os cotovelos o mais próximos possível durante todo o movimento. Os antebraços devem estar sempre apontando para baixo. Usando o tríceps para levantar o tronco novamente, levante-se de volta à posição inicial. Repita pela quantidade recomendada de repetições.",
    "caution_pt": "Mantenha a postura alinhada, execute com ritmo controlado e respeite sua amplitude confortável.",
    "review_status": "catalogo_publico_verificado",
    "media_url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bench_Dips/0.jpg",
    "images": [
      "/exercises/Bench_Dips/0.jpg",
      "/exercises/Bench_Dips/1.jpg"
    ],
    "target_muscle": "Tríceps",
    "primary_muscles": [
      "Tríceps"
    ],
    "secondary_muscles": [
      "Peitoral",
      "Ombros & Deltoides"
    ],
    "steps_pt": [
      "Para este exercício você precisará colocar um banco atrás das costas. Com o banco perpendicular ao corpo e olhando para longe dele, segure-o na borda com as mãos totalmente estendidas, separadas na largura dos ombros. As pernas ficarão estendidas para a frente, dobradas na cintura e perpendiculares ao tronco. Esta será sua posição inicial.",
      "Abaixe lentamente o corpo enquanto inspira, dobrando os cotovelos até se abaixar o suficiente para que haja um ângulo ligeiramente menor que 90 graus entre o braço e o antebraço. Dica: Mantenha os cotovelos o mais próximos possível durante todo o movimento. Os antebraços devem estar sempre apontando para baixo.",
      "Usando o tríceps para levantar o tronco novamente, levante-se de volta à posição inicial.",
      "Repita pela quantidade recomendada de repetições."
    ],
    "source_kind": "free_exercise_db_public_domain",
    "version": "1.0.0"
  },
  {
    "id": "reverse_crunch",
    "name_pt": "Abdominal Invertido no Solo",
    "name_en": "Reverse Crunch",
    "modality": "forca",
    "movement_pattern": "strength",
    "equipment": [
      "peso_corporal"
    ],
    "environment": [
      "casa",
      "ar_livre"
    ],
    "difficulty_candidate": "iniciante",
    "tracking": "reps",
    "requires_anchor": false,
    "requires_supports": [],
    "is_curated_for_auto_proposal": true,
    "instructions_pt": "Deite-se no chão com as pernas totalmente estendidas e os braços ao lado do tronco com as palmas das mãos no chão. Seus braços devem ficar parados durante todo o exercício. Mova as pernas para cima de modo que as coxas fiquem perpendiculares ao chão e os pés fiquem juntos e paralelos ao chão. Esta é a posição inicial. Ao inspirar, mova as pernas em direção ao tronco enquanto rola a pélvis para trás e levanta os quadris do chão. Ao final deste movimento seus joelhos estarão tocando seu peito. Segure a contração por um segundo e mova as pernas de volta à posição inicial enquanto expira. Repita pela quantidade recomendada de repetições.",
    "caution_pt": "Mantenha a postura alinhada, execute com ritmo controlado e respeite sua amplitude confortável.",
    "review_status": "catalogo_publico_verificado",
    "media_url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Reverse_Crunch/0.jpg",
    "images": [
      "/exercises/Reverse_Crunch/0.jpg",
      "/exercises/Reverse_Crunch/1.jpg"
    ],
    "target_muscle": "Abdômen & Core",
    "primary_muscles": [
      "Abdômen & Core"
    ],
    "secondary_muscles": [],
    "steps_pt": [
      "Deite-se no chão com as pernas totalmente estendidas e os braços ao lado do tronco com as palmas das mãos no chão. Seus braços devem ficar parados durante todo o exercício.",
      "Mova as pernas para cima de modo que as coxas fiquem perpendiculares ao chão e os pés fiquem juntos e paralelos ao chão. Esta é a posição inicial.",
      "Ao inspirar, mova as pernas em direção ao tronco enquanto rola a pélvis para trás e levanta os quadris do chão. Ao final deste movimento seus joelhos estarão tocando seu peito.",
      "Segure a contração por um segundo e mova as pernas de volta à posição inicial enquanto expira.",
      "Repita pela quantidade recomendada de repetições."
    ],
    "source_kind": "free_exercise_db_public_domain",
    "version": "1.0.0"
  },
  {
    "id": "dumbbell_bench_press",
    "name_pt": "Supino Reto com Halteres",
    "name_en": "Dumbbell Bench Press",
    "modality": "forca",
    "movement_pattern": "strength",
    "equipment": [
      "halteres",
      "banco"
    ],
    "environment": [
      "academia",
      "casa"
    ],
    "difficulty_candidate": "iniciante",
    "tracking": "reps",
    "requires_anchor": false,
    "requires_supports": [
      "banco"
    ],
    "is_curated_for_auto_proposal": true,
    "instructions_pt": "Deite-se em um banco plano com um halter em cada mão apoiado nas coxas. As palmas das suas mãos ficarão voltadas uma para a outra. Em seguida, usando as coxas para ajudar a levantar os halteres, levante-os um de cada vez para poder segurá-los à sua frente, na largura dos ombros. Uma vez na largura dos ombros, gire os pulsos para a frente de modo que as palmas das mãos fiquem voltadas para longe de você. Os halteres devem ficar nas laterais do peito, com o braço e o antebraço criando um ângulo de 90 graus. Certifique-se de manter o controle total dos halteres em todos os momentos. Esta será sua posição inicial. Então, ao expirar, use o peito para empurrar os halteres para cima. Trave os braços no topo do elevador e aperte o peito, segure por um segundo e comece a descer lentamente. Dica: O ideal é que abaixar o peso demore cerca de duas vezes mais que aumentá-lo. Repita o movimento pela quantidade prescrita de repetições do seu programa de treinamento.",
    "caution_pt": "Mantenha a postura alinhada, execute com ritmo controlado e respeite sua amplitude confortável.",
    "review_status": "catalogo_publico_verificado",
    "media_url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Bench_Press/0.jpg",
    "images": [
      "/exercises/Dumbbell_Bench_Press/0.jpg",
      "/exercises/Dumbbell_Bench_Press/1.jpg"
    ],
    "target_muscle": "Peitoral",
    "primary_muscles": [
      "Peitoral"
    ],
    "secondary_muscles": [
      "Ombros & Deltoides",
      "Tríceps"
    ],
    "steps_pt": [
      "Deite-se em um banco plano com um halter em cada mão apoiado nas coxas. As palmas das suas mãos ficarão voltadas uma para a outra.",
      "Em seguida, usando as coxas para ajudar a levantar os halteres, levante-os um de cada vez para poder segurá-los à sua frente, na largura dos ombros.",
      "Uma vez na largura dos ombros, gire os pulsos para a frente de modo que as palmas das mãos fiquem voltadas para longe de você. Os halteres devem ficar nas laterais do peito, com o braço e o antebraço criando um ângulo de 90 graus. Certifique-se de manter o controle total dos halteres em todos os momentos. Esta será sua posição inicial.",
      "Então, ao expirar, use o peito para empurrar os halteres para cima. Trave os braços no topo do elevador e aperte o peito, segure por um segundo e comece a descer lentamente. Dica: O ideal é que abaixar o peso demore cerca de duas vezes mais que aumentá-lo.",
      "Repita o movimento pela quantidade prescrita de repetições do seu programa de treinamento."
    ],
    "source_kind": "free_exercise_db_public_domain",
    "version": "1.0.0"
  },
  {
    "id": "barbell_shoulder_press",
    "name_pt": "Desenvolvimento de Ombros com Barra",
    "name_en": "Barbell Shoulder Press",
    "modality": "forca",
    "movement_pattern": "strength",
    "equipment": [
      "barra",
      "banco"
    ],
    "environment": [
      "academia",
      "casa"
    ],
    "difficulty_candidate": "intermediario",
    "tracking": "reps",
    "requires_anchor": false,
    "requires_supports": [
      "banco"
    ],
    "is_curated_for_auto_proposal": true,
    "instructions_pt": "Sente-se em um banco com apoio para as costas em um rack de agachamento. Posicione uma barra a uma altura logo acima de sua cabeça. Segure a barra com uma pegada pronada (palmas voltadas para frente). Depois de pegar a barra com a largura correta de empunhadura, levante a barra acima da cabeça, travando os braços. Segure na altura dos ombros e ligeiramente à frente da cabeça. Esta é a sua posição inicial. Abaixe a barra até os ombros lentamente enquanto inspira. Levante a barra de volta à posição inicial enquanto expira. Repita pela quantidade recomendada de repetições.",
    "caution_pt": "Mantenha a postura alinhada, execute com ritmo controlado e respeite sua amplitude confortável.",
    "review_status": "catalogo_publico_verificado",
    "media_url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Shoulder_Press/0.jpg",
    "images": [
      "/exercises/Barbell_Shoulder_Press/0.jpg",
      "/exercises/Barbell_Shoulder_Press/1.jpg"
    ],
    "target_muscle": "Ombros & Deltoides",
    "primary_muscles": [
      "Ombros & Deltoides"
    ],
    "secondary_muscles": [
      "Peitoral",
      "Tríceps"
    ],
    "steps_pt": [
      "Sente-se em um banco com apoio para as costas em um rack de agachamento. Posicione uma barra a uma altura logo acima de sua cabeça. Segure a barra com uma pegada pronada (palmas voltadas para frente).",
      "Depois de pegar a barra com a largura correta de empunhadura, levante a barra acima da cabeça, travando os braços. Segure na altura dos ombros e ligeiramente à frente da cabeça. Esta é a sua posição inicial.",
      "Abaixe a barra até os ombros lentamente enquanto inspira.",
      "Levante a barra de volta à posição inicial enquanto expira.",
      "Repita pela quantidade recomendada de repetições."
    ],
    "source_kind": "free_exercise_db_public_domain",
    "version": "1.0.0"
  },
  {
    "id": "bent_over_barbell_row",
    "name_pt": "Remada Curvada com Barra",
    "name_en": "Bent Over Barbell Row",
    "modality": "forca",
    "movement_pattern": "strength",
    "equipment": [
      "barra",
      "paralelas"
    ],
    "environment": [
      "academia",
      "casa"
    ],
    "difficulty_candidate": "iniciante",
    "tracking": "reps",
    "requires_anchor": false,
    "requires_supports": [
      "paralelas"
    ],
    "is_curated_for_auto_proposal": true,
    "instructions_pt": "Segurando uma barra com pegada pronada (palmas voltadas para baixo), dobre levemente os joelhos e leve o tronco para frente, dobrando a cintura, mantendo as costas retas até ficarem quase paralelas ao chão. Dica: certifique-se de manter a cabeça erguida. A barra deve ficar pendurada diretamente à sua frente, enquanto seus braços ficam pendurados perpendicularmente ao chão e ao tronco. Esta é a sua posição inicial. Agora, mantendo o tronco parado, expire e levante a barra em sua direção. Mantenha os cotovelos próximos ao corpo e use apenas os antebraços para segurar o peso. Na posição contraída superior, contraia os músculos das costas e segure por uma breve pausa. Em seguida, inspire e abaixe lentamente a barra de volta à posição inicial. Repita pela quantidade recomendada de repetições.",
    "caution_pt": "Mantenha a postura alinhada, execute com ritmo controlado e respeite sua amplitude confortável.",
    "review_status": "catalogo_publico_verificado",
    "media_url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bent_Over_Barbell_Row/0.jpg",
    "images": [
      "/exercises/Bent_Over_Barbell_Row/0.jpg",
      "/exercises/Bent_Over_Barbell_Row/1.jpg"
    ],
    "target_muscle": "Costas & Romboides",
    "primary_muscles": [
      "Costas & Romboides"
    ],
    "secondary_muscles": [
      "Bíceps",
      "Dorsais / Latíssimo",
      "Ombros & Deltoides"
    ],
    "steps_pt": [
      "Segurando uma barra com pegada pronada (palmas voltadas para baixo), dobre levemente os joelhos e leve o tronco para frente, dobrando a cintura, mantendo as costas retas até ficarem quase paralelas ao chão. Dica: certifique-se de manter a cabeça erguida. A barra deve ficar pendurada diretamente à sua frente, enquanto seus braços ficam pendurados perpendicularmente ao chão e ao tronco. Esta é a sua posição inicial.",
      "Agora, mantendo o tronco parado, expire e levante a barra em sua direção. Mantenha os cotovelos próximos ao corpo e use apenas os antebraços para segurar o peso. Na posição contraída superior, contraia os músculos das costas e segure por uma breve pausa.",
      "Em seguida, inspire e abaixe lentamente a barra de volta à posição inicial.",
      "Repita pela quantidade recomendada de repetições."
    ],
    "source_kind": "free_exercise_db_public_domain",
    "version": "1.0.0"
  },
  {
    "id": "close-grip_front_lat_pulldown",
    "name_pt": "Close-Grip Front Puxada Alta",
    "name_en": "Close-Grip Front Lat Pulldown",
    "modality": "forca",
    "movement_pattern": "strength",
    "equipment": [
      "polia"
    ],
    "environment": [
      "academia",
      "casa"
    ],
    "difficulty_candidate": "iniciante",
    "tracking": "reps",
    "requires_anchor": false,
    "requires_supports": [],
    "is_curated_for_auto_proposal": true,
    "instructions_pt": "Sente-se em uma máquina suspensa com uma barra larga presa à polia superior. Certifique-se de ajustar a joelheira da máquina para se adequar à sua altura. Essas almofadas evitarão que seu corpo seja elevado pela resistência fixada na barra. Agarre a barra com as palmas voltadas para frente usando a pegada prescrita. Nota sobre empunhaduras: para uma empunhadura ampla, suas mãos precisam estar espaçadas a uma distância maior que a largura dos ombros. Para uma pegada média, suas mãos precisam estar espaçadas a uma distância igual à largura dos ombros e para uma pegada fechada a uma distância menor que a largura dos ombros. Como você tem os dois braços estendidos à sua frente - enquanto segura a barra na largura de pegada escolhida - traga o tronco para trás cerca de 30 graus ou mais enquanto cria uma curvatura na parte inferior das costas e estica o peito. Esta é a sua posição inicial. Ao expirar, abaixe a barra até tocar a parte superior do tórax, puxando os ombros e os braços para baixo e para trás. Dica: concentre-se em contrair os músculos das costas quando atingir a posição totalmente contraída. A parte superior do tronco deve permanecer imóvel (apenas os braços devem se mover). Os antebraços não devem realizar nenhum outro trabalho exceto segurar a barra; portanto, não tente puxar a barra para baixo usando os antebraços. Depois de um segundo na posição contraída, enquanto aperta as omoplatas, levante lentamente a barra de volta à posição inicial quando os braços estiverem totalmente estendidos e os dorsais totalmente esticados. Inspire durante esta parte do movimento. 6. Repita este movimento pela quantidade prescrita de repetições.",
    "caution_pt": "Mantenha a postura alinhada, execute com ritmo controlado e respeite sua amplitude confortável.",
    "review_status": "catalogo_publico_verificado",
    "media_url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Close-Grip_Front_Lat_Pulldown/0.jpg",
    "images": [
      "/exercises/Close-Grip_Front_Lat_Pulldown/0.jpg",
      "/exercises/Close-Grip_Front_Lat_Pulldown/1.jpg"
    ],
    "target_muscle": "Dorsais / Latíssimo",
    "primary_muscles": [
      "Dorsais / Latíssimo"
    ],
    "secondary_muscles": [
      "Bíceps",
      "Costas & Romboides",
      "Ombros & Deltoides"
    ],
    "steps_pt": [
      "Sente-se em uma máquina suspensa com uma barra larga presa à polia superior. Certifique-se de ajustar a joelheira da máquina para se adequar à sua altura. Essas almofadas evitarão que seu corpo seja elevado pela resistência fixada na barra.",
      "Agarre a barra com as palmas voltadas para frente usando a pegada prescrita. Nota sobre empunhaduras: para uma empunhadura ampla, suas mãos precisam estar espaçadas a uma distância maior que a largura dos ombros. Para uma pegada média, suas mãos precisam estar espaçadas a uma distância igual à largura dos ombros e para uma pegada fechada a uma distância menor que a largura dos ombros.",
      "Como você tem os dois braços estendidos à sua frente - enquanto segura a barra na largura de pegada escolhida - traga o tronco para trás cerca de 30 graus ou mais enquanto cria uma curvatura na parte inferior das costas e estica o peito. Esta é a sua posição inicial.",
      "Ao expirar, abaixe a barra até tocar a parte superior do tórax, puxando os ombros e os braços para baixo e para trás. Dica: concentre-se em contrair os músculos das costas quando atingir a posição totalmente contraída. A parte superior do tronco deve permanecer imóvel (apenas os braços devem se mover). Os antebraços não devem realizar nenhum outro trabalho exceto segurar a barra; portanto, não tente puxar a barra para baixo usando os antebraços.",
      "Depois de um segundo na posição contraída, enquanto aperta as omoplatas, levante lentamente a barra de volta à posição inicial quando os braços estiverem totalmente estendidos e os dorsais totalmente esticados. Inspire durante esta parte do movimento.",
      "6. Repita este movimento pela quantidade prescrita de repetições."
    ],
    "source_kind": "free_exercise_db_public_domain",
    "version": "1.0.0"
  },
  {
    "id": "alternate_hammer_curl",
    "name_pt": "Rosca Martelo Alternada com Halteres",
    "name_en": "Alternate Hammer Curl",
    "modality": "forca",
    "movement_pattern": "strength",
    "equipment": [
      "halteres"
    ],
    "environment": [
      "academia",
      "casa"
    ],
    "difficulty_candidate": "iniciante",
    "tracking": "reps",
    "requires_anchor": false,
    "requires_supports": [],
    "is_curated_for_auto_proposal": true,
    "instructions_pt": "Fique em pé com o tronco ereto e um halter em cada mão segurado com os braços estendidos. Os cotovelos devem estar próximos ao tronco. As palmas das mãos devem estar voltadas para o tronco. Esta será sua posição inicial. Enquanto mantém o braço parado, enrole o peso certo para a frente enquanto contrai o bíceps enquanto expira. Continue o movimento até que o bíceps esteja totalmente contraído e os halteres estejam na altura dos ombros. Mantenha a posição contraída por um segundo enquanto aperta o bíceps. Dica: Apenas os antebraços devem se mover. Lentamente, comece a trazer os halteres de volta à posição inicial enquanto inspira. Repita o movimento com a mão esquerda. Isso equivale a uma repetição. Continue alternando dessa maneira pela quantidade recomendada de repetições.",
    "caution_pt": "Mantenha a postura alinhada, execute com ritmo controlado e respeite sua amplitude confortável.",
    "review_status": "catalogo_publico_verificado",
    "media_url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Alternate_Hammer_Curl/0.jpg",
    "images": [
      "/exercises/Alternate_Hammer_Curl/0.jpg",
      "/exercises/Alternate_Hammer_Curl/1.jpg"
    ],
    "target_muscle": "Bíceps",
    "primary_muscles": [
      "Bíceps"
    ],
    "secondary_muscles": [
      "Antebraços"
    ],
    "steps_pt": [
      "Fique em pé com o tronco ereto e um halter em cada mão segurado com os braços estendidos. Os cotovelos devem estar próximos ao tronco.",
      "As palmas das mãos devem estar voltadas para o tronco. Esta será sua posição inicial.",
      "Enquanto mantém o braço parado, enrole o peso certo para a frente enquanto contrai o bíceps enquanto expira. Continue o movimento até que o bíceps esteja totalmente contraído e os halteres estejam na altura dos ombros. Mantenha a posição contraída por um segundo enquanto aperta o bíceps. Dica: Apenas os antebraços devem se mover.",
      "Lentamente, comece a trazer os halteres de volta à posição inicial enquanto inspira.",
      "Repita o movimento com a mão esquerda. Isso equivale a uma repetição.",
      "Continue alternando dessa maneira pela quantidade recomendada de repetições."
    ],
    "source_kind": "free_exercise_db_public_domain",
    "version": "1.0.0"
  },
  {
    "id": "barbell_curl",
    "name_pt": "Rosca Direta com Barra",
    "name_en": "Barbell Curl",
    "modality": "forca",
    "movement_pattern": "strength",
    "equipment": [
      "barra"
    ],
    "environment": [
      "academia",
      "casa"
    ],
    "difficulty_candidate": "iniciante",
    "tracking": "reps",
    "requires_anchor": false,
    "requires_supports": [],
    "is_curated_for_auto_proposal": true,
    "instructions_pt": "Fique em pé com o tronco ereto enquanto segura uma barra na largura dos ombros. A palma das mãos deve estar voltada para a frente e os cotovelos devem estar próximos ao tronco. Esta será sua posição inicial. Enquanto mantém os braços parados, enrole os pesos para a frente enquanto contrai os bíceps enquanto expira. Dica: Apenas os antebraços devem se mover. Continue o movimento até que os bíceps estejam totalmente contraídos e a barra esteja na altura dos ombros. Mantenha a posição contraída por um segundo e contraia os bíceps com força. Lentamente, comece a trazer a barra de volta à posição inicial enquanto inspira. Repita pela quantidade recomendada de repetições.",
    "caution_pt": "Mantenha a postura alinhada, execute com ritmo controlado e respeite sua amplitude confortável.",
    "review_status": "catalogo_publico_verificado",
    "media_url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Curl/0.jpg",
    "images": [
      "/exercises/Barbell_Curl/0.jpg",
      "/exercises/Barbell_Curl/1.jpg"
    ],
    "target_muscle": "Bíceps",
    "primary_muscles": [
      "Bíceps"
    ],
    "secondary_muscles": [
      "Antebraços"
    ],
    "steps_pt": [
      "Fique em pé com o tronco ereto enquanto segura uma barra na largura dos ombros. A palma das mãos deve estar voltada para a frente e os cotovelos devem estar próximos ao tronco. Esta será sua posição inicial.",
      "Enquanto mantém os braços parados, enrole os pesos para a frente enquanto contrai os bíceps enquanto expira. Dica: Apenas os antebraços devem se mover.",
      "Continue o movimento até que os bíceps estejam totalmente contraídos e a barra esteja na altura dos ombros. Mantenha a posição contraída por um segundo e contraia os bíceps com força.",
      "Lentamente, comece a trazer a barra de volta à posição inicial enquanto inspira.",
      "Repita pela quantidade recomendada de repetições."
    ],
    "source_kind": "free_exercise_db_public_domain",
    "version": "1.0.0"
  },
  {
    "id": "barbell_squat",
    "name_pt": "Agachamento Tradicional com Barra",
    "name_en": "Barbell Squat",
    "modality": "forca",
    "movement_pattern": "strength",
    "equipment": [
      "barra"
    ],
    "environment": [
      "academia",
      "casa"
    ],
    "difficulty_candidate": "iniciante",
    "tracking": "reps",
    "requires_anchor": false,
    "requires_supports": [],
    "is_curated_for_auto_proposal": true,
    "instructions_pt": "Este exercício é melhor realizado dentro de um rack de agachamento por motivos de segurança. Para começar, primeiro coloque a barra em um rack logo abaixo do nível dos ombros. Depois que a altura correta for escolhida e a barra carregada, passe por baixo da barra e coloque a parte de trás dos ombros (um pouco abaixo do pescoço) sobre ela. Segure-se na barra com os dois braços de cada lado e levante-a do rack empurrando primeiro com as pernas e ao mesmo tempo endireitando o tronco. Afaste-se do rack e posicione as pernas usando uma postura média na largura dos ombros, com os dedos dos pés ligeiramente apontados. Mantenha a cabeça erguida o tempo todo e mantenha as costas retas. Esta será sua posição inicial. (Nota: Para efeitos desta discussão, usaremos a postura média descrita acima, que visa o desenvolvimento geral; no entanto, você pode escolher qualquer uma das três posturas discutidas na seção de posturas dos pés). Comece a abaixar lentamente a barra dobrando os joelhos e quadris enquanto mantém uma postura reta com a cabeça erguida. Continue descendo até que o ângulo entre a coxa e as panturrilhas fique ligeiramente menor que 90 graus. Inspire ao realizar esta parte do movimento. Dica: Se você executou o exercício corretamente, a frente dos joelhos deve formar uma linha reta imaginária com os dedos dos pés perpendicular à frente. Se seus joelhos ultrapassarem essa linha imaginária (se ultrapassarem os dedos dos pés), você estará colocando uma pressão indevida no joelho e o exercício foi executado incorretamente. Comece a levantar a barra ao expirar, empurrando o chão com o calcanhar do pé enquanto estica as pernas novamente e volta à posição inicial. Repita pela quantidade recomendada de repetições.",
    "caution_pt": "Alinhe os joelhos com a ponta dos pés durante todo o movimento sem deixar que eles entrem (valgo).",
    "review_status": "catalogo_publico_verificado",
    "media_url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Squat/0.jpg",
    "images": [
      "/exercises/Barbell_Squat/0.jpg",
      "/exercises/Barbell_Squat/1.jpg"
    ],
    "target_muscle": "Quadríceps",
    "primary_muscles": [
      "Quadríceps"
    ],
    "secondary_muscles": [
      "Panturrilhas",
      "Glúteos",
      "Posterior de Coxa",
      "Lombar"
    ],
    "steps_pt": [
      "Este exercício é melhor realizado dentro de um rack de agachamento por motivos de segurança. Para começar, primeiro coloque a barra em um rack logo abaixo do nível dos ombros. Depois que a altura correta for escolhida e a barra carregada, passe por baixo da barra e coloque a parte de trás dos ombros (um pouco abaixo do pescoço) sobre ela.",
      "Segure-se na barra com os dois braços de cada lado e levante-a do rack empurrando primeiro com as pernas e ao mesmo tempo endireitando o tronco.",
      "Afaste-se do rack e posicione as pernas usando uma postura média na largura dos ombros, com os dedos dos pés ligeiramente apontados. Mantenha a cabeça erguida o tempo todo e mantenha as costas retas. Esta será sua posição inicial. (Nota: Para efeitos desta discussão, usaremos a postura média descrita acima, que visa o desenvolvimento geral; no entanto, você pode escolher qualquer uma das três posturas discutidas na seção de posturas dos pés).",
      "Comece a abaixar lentamente a barra dobrando os joelhos e quadris enquanto mantém uma postura reta com a cabeça erguida. Continue descendo até que o ângulo entre a coxa e as panturrilhas fique ligeiramente menor que 90 graus. Inspire ao realizar esta parte do movimento. Dica: Se você executou o exercício corretamente, a frente dos joelhos deve formar uma linha reta imaginária com os dedos dos pés perpendicular à frente. Se seus joelhos ultrapassarem essa linha imaginária (se ultrapassarem os dedos dos pés), você estará colocando uma pressão indevida no joelho e o exercício foi executado incorretamente.",
      "Comece a levantar a barra ao expirar, empurrando o chão com o calcanhar do pé enquanto estica as pernas novamente e volta à posição inicial.",
      "Repita pela quantidade recomendada de repetições."
    ],
    "source_kind": "free_exercise_db_public_domain",
    "version": "1.0.0"
  },
  {
    "id": "romanian_deadlift",
    "name_pt": "Levantamento Terra Romeno (Stiff)",
    "name_en": "Romanian Deadlift",
    "modality": "forca",
    "movement_pattern": "strength",
    "equipment": [
      "barra",
      "faixa_longa"
    ],
    "environment": [
      "academia",
      "casa"
    ],
    "difficulty_candidate": "intermediario",
    "tracking": "reps",
    "requires_anchor": false,
    "requires_supports": [],
    "is_curated_for_auto_proposal": true,
    "instructions_pt": "Coloque uma barra à sua frente no chão e agarre-a usando uma pegada pronada (palmas voltadas para baixo) um pouco mais larga que a largura dos ombros. Dica: Dependendo do peso utilizado, você pode precisar de bandagens para realizar o exercício e também de uma plataforma elevada para permitir melhor amplitude de movimento. Dobre ligeiramente os joelhos e mantenha as canelas verticais, os quadris para trás e as costas retas. Esta será sua posição inicial. Mantendo as costas e os braços sempre retos, use os quadris para levantar a barra enquanto expira. Dica: O movimento não deve ser rápido, mas constante e sob controle. Quando estiver completamente ereto, abaixe a barra empurrando os quadris para trás, dobrando apenas levemente os joelhos, ao contrário do agachamento. Dica: Respire fundo no início do movimento e mantenha o peito elevado. Prenda a respiração ao abaixar e expire ao completar o movimento. Repita pela quantidade recomendada de repetições.",
    "caution_pt": "Preserve a curvatura natural da lombar; acione o abdômen e evite arquear excessivamente as costas.",
    "review_status": "catalogo_publico_verificado",
    "media_url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Romanian_Deadlift/0.jpg",
    "images": [
      "/exercises/Romanian_Deadlift/0.jpg",
      "/exercises/Romanian_Deadlift/1.jpg"
    ],
    "target_muscle": "Posterior de Coxa",
    "primary_muscles": [
      "Posterior de Coxa"
    ],
    "secondary_muscles": [
      "Panturrilhas",
      "Glúteos",
      "Lombar"
    ],
    "steps_pt": [
      "Coloque uma barra à sua frente no chão e agarre-a usando uma pegada pronada (palmas voltadas para baixo) um pouco mais larga que a largura dos ombros. Dica: Dependendo do peso utilizado, você pode precisar de bandagens para realizar o exercício e também de uma plataforma elevada para permitir melhor amplitude de movimento.",
      "Dobre ligeiramente os joelhos e mantenha as canelas verticais, os quadris para trás e as costas retas. Esta será sua posição inicial.",
      "Mantendo as costas e os braços sempre retos, use os quadris para levantar a barra enquanto expira. Dica: O movimento não deve ser rápido, mas constante e sob controle.",
      "Quando estiver completamente ereto, abaixe a barra empurrando os quadris para trás, dobrando apenas levemente os joelhos, ao contrário do agachamento. Dica: Respire fundo no início do movimento e mantenha o peito elevado. Prenda a respiração ao abaixar e expire ao completar o movimento.",
      "Repita pela quantidade recomendada de repetições."
    ],
    "source_kind": "free_exercise_db_public_domain",
    "version": "1.0.0"
  },
  {
    "id": "barbell_glute_bridge",
    "name_pt": "Ponte de Glúteos com Barra",
    "name_en": "Barbell Glute Bridge",
    "modality": "forca",
    "movement_pattern": "powerlifting",
    "equipment": [
      "barra"
    ],
    "environment": [
      "academia",
      "casa"
    ],
    "difficulty_candidate": "intermediario",
    "tracking": "reps",
    "requires_anchor": false,
    "requires_supports": [],
    "is_curated_for_auto_proposal": true,
    "instructions_pt": "Comece sentado no chão com uma barra carregada sobre as pernas. Usar uma barra gorda ou ter uma almofada na barra pode reduzir bastante o desconforto causado por este exercício. Role a barra de modo que fique diretamente acima dos quadris e deite-se no chão. Comece o movimento avançando com os calcanhares, estendendo os quadris verticalmente através da barra. Seu peso deve ser sustentado pela parte superior das costas e pelos calcanhares dos pés. Estenda o máximo possível e depois inverta o movimento para retornar à posição inicial.",
    "caution_pt": "Mantenha a postura alinhada, execute com ritmo controlado e respeite sua amplitude confortável.",
    "review_status": "catalogo_publico_verificado",
    "media_url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Glute_Bridge/0.jpg",
    "images": [
      "/exercises/Barbell_Glute_Bridge/0.jpg",
      "/exercises/Barbell_Glute_Bridge/1.jpg"
    ],
    "target_muscle": "Glúteos",
    "primary_muscles": [
      "Glúteos"
    ],
    "secondary_muscles": [
      "Panturrilhas",
      "Posterior de Coxa"
    ],
    "steps_pt": [
      "Comece sentado no chão com uma barra carregada sobre as pernas. Usar uma barra gorda ou ter uma almofada na barra pode reduzir bastante o desconforto causado por este exercício. Role a barra de modo que fique diretamente acima dos quadris e deite-se no chão.",
      "Comece o movimento avançando com os calcanhares, estendendo os quadris verticalmente através da barra. Seu peso deve ser sustentado pela parte superior das costas e pelos calcanhares dos pés.",
      "Estenda o máximo possível e depois inverta o movimento para retornar à posição inicial."
    ],
    "source_kind": "free_exercise_db_public_domain",
    "version": "1.0.0"
  },
  {
    "id": "band_pull_apart",
    "name_pt": "Abertura de Escápulas com Faixa Elástica (Band Pull-Apart)",
    "name_en": "Band Pull Apart",
    "modality": "forca",
    "movement_pattern": "strength",
    "equipment": [
      "elasticos",
      "mini_band"
    ],
    "environment": [
      "casa",
      "ar_livre"
    ],
    "difficulty_candidate": "iniciante",
    "tracking": "reps",
    "requires_anchor": true,
    "requires_supports": [],
    "is_curated_for_auto_proposal": true,
    "instructions_pt": "Comece com os braços estendidos à sua frente, segurando a faixa com as duas mãos. Inicie o movimento realizando um movimento reverso, movendo as mãos lateralmente para os lados. Mantenha os cotovelos estendidos enquanto executa o movimento, trazendo a faixa até o peito. Certifique-se de manter os ombros para trás durante o exercício. Faça uma pausa ao completar o movimento, retornando à posição inicial sob controle.",
    "caution_pt": "Mantenha a postura alinhada, execute com ritmo controlado e respeite sua amplitude confortável.",
    "review_status": "catalogo_publico_verificado",
    "media_url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Band_Pull_Apart/0.jpg",
    "images": [
      "/exercises/Band_Pull_Apart/0.jpg",
      "/exercises/Band_Pull_Apart/1.jpg"
    ],
    "target_muscle": "Ombros & Deltoides",
    "primary_muscles": [
      "Ombros & Deltoides"
    ],
    "secondary_muscles": [
      "Costas & Romboides",
      "Trapézio"
    ],
    "steps_pt": [
      "Comece com os braços estendidos à sua frente, segurando a faixa com as duas mãos.",
      "Inicie o movimento realizando um movimento reverso, movendo as mãos lateralmente para os lados.",
      "Mantenha os cotovelos estendidos enquanto executa o movimento, trazendo a faixa até o peito. Certifique-se de manter os ombros para trás durante o exercício.",
      "Faça uma pausa ao completar o movimento, retornando à posição inicial sob controle."
    ],
    "source_kind": "free_exercise_db_public_domain",
    "version": "1.0.0"
  }
];
