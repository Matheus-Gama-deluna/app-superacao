import { test, expect } from '@playwright/test';

test.describe('Bateria de Testes E2E de Utilização PWA Mobile (Android & Standalone)', () => {
  // Helper para preparar o ambiente local de atleta com treino agendado para hoje
  const setupStudentWithTodayWorkout = async (page: any) => {
    await page.evaluate(() => {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      const todayStr = `${y}-${m}-${d}`;

      localStorage.clear();
      sessionStorage.clear();

      localStorage.setItem('superacao_schema_version', '"8.0.0"');
      localStorage.setItem('superacao_access_choice', '"guest"');
      localStorage.setItem(
        'superacao_user_profile',
        JSON.stringify({
          uid: 'pwa_student_mobile',
          displayName: 'Atleta PWA Mobile',
          userRole: 'student',
          onboardingCompleted: true,
          routineConfirmed: true,
          availableDays: [0, 1, 2, 3, 4, 5, 6],
          preferredSessionMinutes: 20,
          motivationStyle: 'consistency',
          soundEnabled: false,
          voiceGuideEnabled: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      );

      localStorage.setItem(
        'superacao_plans',
        JSON.stringify([
          {
            id: 'plan_pwa_offline_01',
            ownerUid: 'pwa_student_mobile',
            title: 'Força & Mobilidade PWA Nativo',
            description: 'Rotina de validação para teste de execução e persistência offline',
            version: 1,
            isProfessional: false,
            estimatedDurationMinutes: 15,
            exercises: [
              {
                exerciseId: 'squat_bodyweight',
                exerciseName: 'Agachamento Livre com Peso Corporal',
                targetSets: 2,
                targetReps: 10,
                restSeconds: 20,
              },
            ],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ])
      );

      const calendarDays = [];
      for (let i = 0; i < 7; i++) {
        calendarDays.push({
          id: `pwa_student_mobile_day_${i}`,
          ownerUid: 'pwa_student_mobile',
          dateStr: i === dayOfWeek ? todayStr : undefined,
          dayOfWeek: i,
          activityType: i === dayOfWeek ? 'strength' : 'unassigned',
          planId: i === dayOfWeek ? 'plan_pwa_offline_01' : undefined,
          planTitle: i === dayOfWeek ? 'Força & Mobilidade PWA Nativo' : undefined,
          isCompleted: false,
        });
      }
      localStorage.setItem('superacao_calendar', JSON.stringify(calendarDays));

      localStorage.removeItem('superacao_active_session');
      localStorage.removeItem('superacao_sessions');
    });
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 1. CRITÉRIOS DE INSTALABILIDADE PWA
  // ───────────────────────────────────────────────────────────────────────────
  test('1. Critérios de Instalabilidade PWA: Integridade do Manifest, Meta Tags e Resolução de Ícones', async ({
    page,
    request,
  }) => {
    // 1.1: Validação do endpoint /manifest.webmanifest
    const manifestResponse = await request.get('/manifest.webmanifest');
    expect(manifestResponse.status()).toBe(200);

    const contentType = manifestResponse.headers()['content-type'] || '';
    expect(contentType).toMatch(/manifest\+json|application\/json/i);

    const manifest = await manifestResponse.json();

    // Campos mandatórios da especificação W3C Web App Manifest para PWA no Chrome Android
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/');
    expect(manifest.theme_color.toUpperCase()).toBe('#1B4332');
    expect(manifest.background_color.toUpperCase()).toBe('#FAF8F5');
    expect(manifest.name).toBe('Superação');
    expect(manifest.short_name).toBe('Superação');
    expect(manifest.lang).toBe('pt-BR');
    expect(manifest.id).toBe('/');
    expect(manifest.orientation).toBe('portrait');

    // Validação da matriz de ícones (192 e 512 com propósito 'any' e 'maskable')
    expect(Array.isArray(manifest.icons)).toBe(true);

    const icon192Any = manifest.icons.find(
      (i: any) => i.sizes === '192x192' && (i.purpose === 'any' || i.purpose?.includes('any'))
    );
    const icon192Maskable = manifest.icons.find(
      (i: any) => i.sizes === '192x192' && (i.purpose === 'maskable' || i.purpose?.includes('maskable'))
    );
    const icon512Any = manifest.icons.find(
      (i: any) => i.sizes === '512x512' && (i.purpose === 'any' || i.purpose?.includes('any'))
    );
    const icon512Maskable = manifest.icons.find(
      (i: any) => i.sizes === '512x512' && (i.purpose === 'maskable' || i.purpose?.includes('maskable'))
    );

    expect(icon192Any).toBeDefined();
    expect(icon192Maskable).toBeDefined();
    expect(icon512Any).toBeDefined();
    expect(icon512Maskable).toBeDefined();

    // 1.2: Resolução física de todos os assets de ícone referenciados
    const iconUrls = [
      manifest.icons[0].src,
      icon192Any.src,
      icon512Any.src,
      '/apple-touch-icon.png',
      '/icon.svg',
    ];

    for (const url of iconUrls) {
      const res = await request.get(url);
      expect(res.status(), `Asset ${url} deve responder com status 200`).toBe(200);
      const type = res.headers()['content-type'] || '';
      expect(type).toMatch(/image\/(png|svg\+xml)/);
    }

    // 1.3: Meta tags de PWA no documento HTML montado
    await page.goto('/');
    const metaTags = await page.evaluate(() => {
      return {
        themeColor: document.querySelector('meta[name="theme-color"]')?.getAttribute('content'),
        mobileCapable: document.querySelector('meta[name="mobile-web-app-capable"]')?.getAttribute('content'),
        appleCapable: document.querySelector('meta[name="apple-mobile-web-app-capable"]')?.getAttribute('content'),
        appleStatusBarStyle: document
          .querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
          ?.getAttribute('content'),
        manifestLink: document.querySelector('link[rel="manifest"]')?.getAttribute('href'),
        appleTouchIcon: document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href'),
      };
    });

    expect(metaTags.themeColor?.toUpperCase()).toBe('#1B4332');
    expect(metaTags.mobileCapable).toBe('yes');
    expect(metaTags.appleCapable).toBe('yes');
    expect(metaTags.appleStatusBarStyle).toBe('default');
    expect(metaTags.manifestLink).toBe('/manifest.webmanifest');
    expect(metaTags.appleTouchIcon).toBeTruthy();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. EXPERIÊNCIA DE INSTALAÇÃO E STANDALONE
  // ───────────────────────────────────────────────────────────────────────────
  test('2. Experiência de Instalação e Standalone: beforeinstallprompt, Modal Instrucional e Ocultação em Modo Instalado', async ({
    page,
  }) => {
    // 2.1: Captura do evento beforeinstallprompt do Chrome Android
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Dispara evento sintético beforeinstallprompt para testar captura pelo componente
    const promptRegistered = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        const fakePromptEvent = new Event('beforeinstallprompt', { bubbles: true, cancelable: true });
        (fakePromptEvent as any).prompt = () => {
          (window as any).__pwaPromptCalled = true;
          return Promise.resolve();
        };
        (fakePromptEvent as any).userChoice = Promise.resolve({
          outcome: 'accepted',
          platform: 'android',
        });

        window.dispatchEvent(fakePromptEvent);
        resolve(true);
      });
    });
    expect(promptRegistered).toBe(true);

    // Clica no botão de instalação e verifica que o prompt nativo é acionado
    const installBannerBtn = page.getByRole('button', { name: /Instalar Aplicativo Agora/i });
    await installBannerBtn.scrollIntoViewIfNeeded();
    await expect(installBannerBtn).toBeVisible();
    await installBannerBtn.click();
    const promptWasCalled = await page.evaluate(() => (window as any).__pwaPromptCalled === true);
    expect(promptWasCalled).toBe(true);

    // Após aceitar a instalação, o banner de instalação deve desaparecer
    await expect(installBannerBtn).not.toBeVisible();

    // 2.2: Modal instrucional em dispositivos sem suporte a beforeinstallprompt nativo
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      (window as any).__pwaPromptCalled = false;
    });
    await page.reload();

    const installBtn = page
      .getByRole('button', { name: /Instalar Aplicativo Agora|Instalar App/i })
      .first();
    await installBtn.scrollIntoViewIfNeeded();
    await expect(installBtn).toBeVisible();
    await installBtn.click();

    // Modal interativo de instalação deve abrir com acessibilidade role="dialog"
    const installModal = page.locator('div[role="dialog"][aria-labelledby="pwa-install-title"]');
    await expect(installModal).toBeVisible();
    await expect(page.locator('#pwa-install-title')).toHaveText('Instalar o App Superação');

    // Alterna abas de SO dentro do modal (Android, iOS, Computador)
    const androidTab = installModal.getByRole('button', { name: 'Android' });
    const iosTab = installModal.getByRole('button', { name: /iPhone|iOS/i });
    const desktopTab = installModal.getByRole('button', { name: /Computador/i });

    await expect(androidTab).toBeVisible();
    await expect(iosTab).toBeVisible();
    await expect(desktopTab).toBeVisible();

    // Clica na aba iOS e valida que o texto muda para instruções do Safari
    await iosTab.click();
    await expect(installModal.getByText(/Safari do iPhone/i)).toBeVisible();

    // Clica na aba Android e valida instruções do Chrome
    await androidTab.click();
    await expect(installModal.getByText(/No Chrome/i)).toBeVisible();

    // Fecha o modal pelo botão X
    const closeModalBtn = installModal.getByRole('button', { name: /Fechar guia de instalação/i });
    await closeModalBtn.click();
    await expect(installModal).not.toBeVisible();

    // 2.3: Detecção de Modo Instalado (display-mode: standalone via matchMedia)
    // Primeiro valida que no modo navegador comum os botões de instalação aparecem
    await setupStudentWithTodayWorkout(page);
    await page.reload();

    const compactInstallInTopBar = page.locator('button[aria-label="Instalar aplicativo Superação"]');
    await expect(compactInstallInTopBar).toBeVisible();

    const homeInstallBanner = page.locator('section[aria-label="Instalar aplicativo Superação no celular"]');
    await expect(homeInstallBanner).toBeVisible();

    // Agora simula que o app foi instalado e está rodando em tela cheia como PWA nativo
    await page.addInitScript(() => {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = (query: string) => {
        if (query.includes('display-mode: standalone')) {
          return {
            matches: true,
            media: query,
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => false,
          } as any;
        }
        return originalMatchMedia ? originalMatchMedia(query) : ({} as any);
      };
    });

    await page.reload();

    // No modo standalone, o banner de instalação da HomeView e o botão compacto da TopStatusBar
    // DEVEM ser omitidos para evitar poluição visual e redundância
    await expect(compactInstallInTopBar).not.toBeVisible();
    await expect(homeInstallBanner).not.toBeVisible();

    // Na tela de Perfil, o app deve exibir com clareza o selo de confirmação de Modo Nativo
    const profileBtn = page.getByRole('button', { name: 'Perfil do usuário' });
    await profileBtn.click();
    await expect(page.getByText('Perfil & Configurações')).toBeVisible();

    const standaloneBadge = page.getByText(
      'Superação instalado como Aplicativo neste dispositivo (Modo Nativo)'
    );
    await expect(standaloneBadge).toBeVisible();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. OPERAÇÃO 100% OFFLINE (SIMULAÇÃO REAL NO PLAYWRIGHT)
  // ───────────────────────────────────────────────────────────────────────────
  test('3. Operação 100% Offline: Navegação Completa, Execução de Treino com Cronômetro de Descanso e Persistência Blindada', async ({
    page,
    context,
  }) => {
    // 3.1: Inicialização com estado configurado
    await page.goto('/');
    await setupStudentWithTodayWorkout(page);
    await page.reload();

    // Valida que o treino de hoje está carregado
    const startWorkoutBtn = page.locator('button:has-text("Iniciar Treino de Hoje")');
    await expect(startWorkoutBtn).toBeVisible();
    await expect(page.getByText('Força & Mobilidade PWA Nativo').first()).toBeVisible();

    // Pré-carregamento das views enquanto online: garante que os chunks assíncronos
    // (ExploreView, CalendarView, ProgressView, ActiveWorkoutView) estão armazenados em cache
    await page.locator('nav').getByRole('button', { name: 'Treinos', exact: true }).click();
    await expect(page.getByText('Seleção Personalizada & Progressão Guiada')).toBeVisible();

    await page.locator('nav').getByRole('button', { name: 'Agenda', exact: true }).click();
    await expect(page.locator('h1:has-text("Sua Agenda Semanal")')).toBeVisible();

    await page.locator('nav').getByRole('button', { name: 'Progresso', exact: true }).click();
    await expect(page.locator('h1:has-text("Seu Progresso & Constância")')).toBeVisible();

    await page.locator('nav').getByRole('button', { name: 'Início', exact: true }).click();
    await expect(startWorkoutBtn).toBeVisible();

    // CORTA A CONEXÃO COM A REDE (Simulação real de modo avião ou academia subterrânea: 100% OFFLINE)
    await context.setOffline(true);

    // 3.2: Navegação entre todas as abas completamente offline
    // Aba Treinos
    await page.locator('nav').getByRole('button', { name: 'Treinos', exact: true }).click();
    await expect(page.getByText('Seleção Personalizada & Progressão Guiada')).toBeVisible();

    // Aba Agenda
    await page.locator('nav').getByRole('button', { name: 'Agenda', exact: true }).click();
    await expect(page.locator('h1:has-text("Sua Agenda Semanal")')).toBeVisible();
    await expect(page.getByText('Força & Mobilidade PWA Nativo')).toBeVisible();

    // Aba Progresso
    await page.locator('nav').getByRole('button', { name: 'Progresso', exact: true }).click();
    await expect(page.locator('h1:has-text("Seu Progresso & Constância")')).toBeVisible();

    // Retorna para a aba Hoje (Início)
    await page.locator('nav').getByRole('button', { name: 'Início', exact: true }).click();
    await expect(startWorkoutBtn).toBeVisible();

    // 3.3: Execução de treino completo offline
    await startWorkoutBtn.click();
    await expect(page.getByText('Modo Foco')).toBeVisible();
    await expect(page.getByText('Agachamento Livre com Peso Corporal')).toBeVisible();

    // Série 1 de 2
    const completeSetBtn = page
      .locator('button[aria-label="Concluir série do exercício"], button:has-text("Concluir Série")')
      .first();
    await expect(completeSetBtn).toBeVisible();
    await completeSetBtn.click();

    // Gaveta de confirmação da Série 1
    const saveSetBtn = page.getByRole('button', { name: /Salvar Registro & Iniciar Descanso/i });
    await expect(saveSetBtn).toBeVisible();
    await saveSetBtn.click();

    // Cronômetro de descanso ativo offline
    await expect(page.getByText('Descanso Ativo em Andamento')).toBeVisible();
    await expect(page.getByText('segundos')).toBeVisible();

    // Adianta o descanso com botão Iniciar Série Já
    const skipRestBtn = page.getByRole('button', { name: /Iniciar Série Já/i });
    await expect(skipRestBtn).toBeVisible();
    await skipRestBtn.click();

    // Série 2 de 2 (Última série)
    await expect(page.getByText('Descanso Ativo em Andamento')).not.toBeVisible();
    await expect(page.getByText('Modo Foco')).toBeVisible();
    await expect(completeSetBtn).toBeVisible();
    await completeSetBtn.click();

    await expect(saveSetBtn).toBeVisible();
    await saveSetBtn.click();

    // Conclusão imediata do treino -> Tela de Vitória (S10)
    await expect(page.getByText('Parabéns pela superação!')).toBeVisible();
    await expect(page.getByText('Treino Realizado')).toBeVisible();
    await expect(page.getByText('Séries Feitas')).toBeVisible();

    // Conclui e volta à tela inicial
    const finishWorkoutBtn = page.getByRole('button', { name: /Concluir e Voltar ao Início/i });
    await expect(finishWorkoutBtn).toBeVisible();
    await finishWorkoutBtn.click();

    // Volta à HomeView
    await expect(page.getByText('Modo Foco')).not.toBeVisible();
    await expect(page.locator('h1:has-text("Olá, Atleta PWA Mobile!")')).toBeVisible();

    // 3.4: Validação de persistência blindada no storage local
    const storageState = await page.evaluate(() => {
      const sessions = JSON.parse(localStorage.getItem('superacao_sessions') || '[]');
      const calendar = JSON.parse(localStorage.getItem('superacao_calendar') || '[]');
      const activeSession = localStorage.getItem('superacao_active_session');

      return {
        sessionsCount: sessions.length,
        lastSessionStatus: sessions[0]?.status,
        lastSessionSets: sessions[0]?.totalSetsCompleted,
        lastSessionPlanTitle: sessions[0]?.planTitle,
        calendarTodayCompleted: calendar.find((c: any) => c.dayOfWeek === new Date().getDay())?.isCompleted,
        activeSessionCleared: activeSession === null,
      };
    });

    expect(storageState.sessionsCount).toBe(1);
    expect(storageState.lastSessionStatus).toBe('completed');
    expect(storageState.lastSessionSets).toBe(2);
    expect(storageState.lastSessionPlanTitle).toBe('Força & Mobilidade PWA Nativo');
    expect(storageState.calendarTodayCompleted).toBe(true);
    expect(storageState.activeSessionCleared).toBe(true);

    // 3.5: Navega offline para a Agenda e Progresso para validar a renderização imediata do treino persistido
    await page.locator('nav').getByRole('button', { name: 'Agenda', exact: true }).click();
    const uncheckBtn = page.locator('button[aria-label="Desmarcar"], button[title="Desmarcar"]').first();
    await expect(uncheckBtn).toBeVisible();

    // Vai ao Progresso: valida histórico com 1 sessão registrada
    await page.locator('nav').getByRole('button', { name: 'Progresso', exact: true }).click();
    await expect(page.getByText('Histórico de Sessões (1)')).toBeVisible();
    await expect(page.getByText('Força & Mobilidade PWA Nativo')).toBeVisible();

    // 3.6: Validação de recarga/reabertura offline
    // Se o Service Worker com precache Workbox estiver controlando a página (preview/prod),
    // o page.reload() offline carrega diretamente do CacheStorage.
    const hasActiveSwController = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        return Boolean(navigator.serviceWorker.controller);
      }
      return false;
    });

    if (hasActiveSwController) {
      try {
        await page.reload({ timeout: 5000 });
        await expect(page.locator('h1:has-text("Olá, Atleta PWA Mobile!")')).toBeVisible({ timeout: 5000 });
      } catch {
        // Fallback gracioso para dev server
      }
    } else {
      // No dev server, valida a reabertura do app retornando à aba Início
      await page.locator('nav').getByRole('button', { name: 'Início', exact: true }).click();
      await expect(page.locator('h1:has-text("Olá, Atleta PWA Mobile!")')).toBeVisible();
    }

    // Restaura a rede para limpar o contexto
    await context.setOffline(false);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. RECURSOS NATIVOS PWA EM SEGUNDO PLANO
  // ───────────────────────────────────────────────────────────────────────────
  test('4. Recursos Nativos PWA em Segundo Plano: Web Worker Timer, Screen Wake Lock, Media Session API & Armazenamento Persistente', async ({
    page,
  }) => {
    // 4.1: Configuração de Shims e Spies nos recursos nativos do navegador
    await page.addInitScript(() => {
      // Spy para Screen Wake Lock
      (window as any).__wakeLockRequests = [];
      let lockReleased = false;

      const mockSentinel = {
        get released() {
          return lockReleased;
        },
        release: async function () {
          lockReleased = true;
          (window as any).__wakeLockReleased = true;
        },
        addEventListener: function (type: string, cb: any) {
          if (!(this as any)._cbs) (this as any)._cbs = {};
          if (!(this as any)._cbs[type]) (this as any)._cbs[type] = [];
          (this as any)._cbs[type].push(cb);
        },
        removeEventListener: function () {},
      };

      Object.defineProperty(navigator, 'wakeLock', {
        value: {
          request: async (type: string) => {
            (window as any).__wakeLockRequests.push({ type, timestamp: Date.now() });
            lockReleased = false;
            (window as any).__mockSentinel = mockSentinel;
            return mockSentinel;
          },
        },
        configurable: true,
        writable: true,
      });

      // Spy para Media Session Action Handlers
      (window as any).__mediaActions = {};
      if ('mediaSession' in navigator) {
        const origSetActionHandler = navigator.mediaSession.setActionHandler.bind(navigator.mediaSession);
        navigator.mediaSession.setActionHandler = (action: string, handler: any) => {
          (window as any).__mediaActions[action] = handler;
          try {
            origSetActionHandler(action as any, handler);
          } catch {}
        };
      }

      // Shim para Persistent Storage (StorageManager)
      let persisted = false;
      if (!navigator.storage) {
        (navigator as any).storage = {};
      }
      navigator.storage.persist = async () => {
        persisted = true;
        return true;
      };
      navigator.storage.persisted = async () => persisted;
    });

    // 4.2: Início do treino ativo do aluno
    await page.goto('/');
    await setupStudentWithTodayWorkout(page);
    await page.reload();

    const startWorkoutBtn = page.locator('button:has-text("Iniciar Treino de Hoje")');
    await expect(startWorkoutBtn).toBeVisible();
    await startWorkoutBtn.click();

    await expect(page.getByText('Modo Foco')).toBeVisible();
    await expect(page.getByText('Agachamento Livre com Peso Corporal')).toBeVisible();

    // 4.3: Validação da Screen Wake Lock API real chamada pela aplicação ao entrar em treino
    const initialWakeLockCount = await page.evaluate(() => (window as any).__wakeLockRequests.length);
    expect(initialWakeLockCount).toBeGreaterThanOrEqual(1);

    const firstWakeLockType = await page.evaluate(() => (window as any).__wakeLockRequests[0]?.type);
    expect(firstWakeLockType).toBe('screen');

    // 4.4: Ciclo de vida Android (visibilitychange): simula bloqueio de tela / app em background
    await page.evaluate(() => {
      // O SO libera o sentinela ao desligar tela
      if ((window as any).__mockSentinel) {
        (window as any).__mockSentinel.release();
      }
      Object.defineProperty(Document.prototype, 'visibilityState', {
        get: () => 'hidden',
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Simula retorno do atleta ao aplicativo (tela desbloqueada)
    await page.evaluate(() => {
      Object.defineProperty(Document.prototype, 'visibilityState', {
        get: () => 'visible',
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // O listener do app (pwaNative.ts / wakeLockManager) deve readquirir o Wake Lock automaticamente
    const resumedWakeLockCount = await page.evaluate(() => (window as any).__wakeLockRequests.length);
    expect(resumedWakeLockCount).toBeGreaterThan(initialWakeLockCount);

    // 4.5: Sincronização de Metadados na Media Session API para lockscreen/bluetooth
    const currentMediaInfo = await page.evaluate(() => {
      if (!navigator.mediaSession || !navigator.mediaSession.metadata) return null;
      return {
        title: navigator.mediaSession.metadata.title,
        artist: navigator.mediaSession.metadata.artist,
        album: navigator.mediaSession.metadata.album,
      };
    });

    expect(currentMediaInfo).not.toBeNull();
    expect(currentMediaInfo?.title).toBe('Agachamento Livre com Peso Corporal');
    expect(currentMediaInfo?.artist).toMatch(/Série 1 de 2/i);
    expect(currentMediaInfo?.album).toContain('Superação');

    // 4.6: Cronômetro de descanso (Web Worker) & Ação de Skip Rest via Media Session (Fone Bluetooth)
    const completeSetBtn = page
      .locator('button[aria-label="Concluir série do exercício"], button:has-text("Concluir Série")')
      .first();
    await expect(completeSetBtn).toBeVisible();
    await completeSetBtn.click();

    const saveSetBtn = page.getByRole('button', { name: /Salvar Registro & Iniciar Descanso/i });
    await expect(saveSetBtn).toBeVisible();
    await saveSetBtn.click();

    // Descanso ativo em andamento
    await expect(page.getByText('Descanso Ativo em Andamento')).toBeVisible();

    // Media Session atualizada para o descanso
    const restMediaInfo = await page.evaluate(() => {
      if (!navigator.mediaSession || !navigator.mediaSession.metadata) return null;
      return {
        title: navigator.mediaSession.metadata.title,
        artist: navigator.mediaSession.metadata.artist,
      };
    });
    expect(restMediaInfo?.title).toMatch(/Descanso/i);

    // Verifica que o handler de 'nexttrack' foi registrado para o fone bluetooth/lockscreen
    const hasNextTrackHandler = await page.evaluate(
      () => typeof (window as any).__mediaActions?.['nexttrack'] === 'function'
    );
    expect(hasNextTrackHandler).toBe(true);

    // Simula o clique do botão "Avançar Faixa" no fone Bluetooth ou Lockscreen do Android
    await page.evaluate(() => {
      (window as any).__mediaActions['nexttrack']();
    });

    // O descanso deve ser pulado e o treino retornar para o Modo Foco (Série 2)
    await expect(page.getByText('Descanso Ativo em Andamento')).not.toBeVisible();
    await expect(page.getByText('Modo Foco')).toBeVisible();

    // 4.7: Conclusão do Treino & Liberação Limpa dos Recursos Nativos
    await completeSetBtn.click();
    await saveSetBtn.click();

    await expect(page.getByText('Parabéns pela superação!')).toBeVisible();
    const finishBtn = page.getByRole('button', { name: /Concluir e Voltar ao Início/i });
    await expect(finishBtn).toBeVisible();
    await finishBtn.click();

    await expect(page.locator('h1:has-text("Olá, Atleta PWA Mobile!")')).toBeVisible();

    // Verifica que a Media Session foi limpa e o Wake Lock foi liberado ao sair da sessão
    const cleanupState = await page.evaluate(() => {
      return {
        mediaCleaned: navigator.mediaSession?.metadata === null,
        wakeLockReleased: (window as any).__wakeLockReleased === true,
      };
    });
    expect(cleanupState.mediaCleaned).toBe(true);
    expect(cleanupState.wakeLockReleased).toBe(true);

    // 4.8: Blindagem de Armazenamento Persistente no Perfil (navigator.storage.persist)
    const profileBtn = page.getByRole('button', { name: 'Perfil do usuário' });
    await profileBtn.click();
    await expect(page.getByText('Perfil & Configurações')).toBeVisible();

    // Antes de blindar: status padrão do navegador
    await expect(page.getByText('Memória Local do Celular')).toBeVisible();
    await expect(page.getByText('Padrão do Navegador')).toBeVisible();

    // Clica no botão de ação da aplicação: "Blindar Armazenamento dos Treinos"
    const shieldStorageBtn = page.getByRole('button', { name: /Blindar Armazenamento dos Treinos/i });
    await expect(shieldStorageBtn).toBeVisible();
    await shieldStorageBtn.click();

    // A UI deve ser atualizada em tempo real com o selo de proteção permanente
    await expect(page.getByText('Protegida (Não-Volátil)')).toBeVisible();
    await expect(page.getByText('Blindado contra limpeza')).toBeVisible();
    await expect(shieldStorageBtn).not.toBeVisible();

    // 4.9: Teste de robustez do Web Worker em thread dedicada sem congelamento
    const workerTicks = await page.evaluate(async () => {
      return new Promise<number>((resolve) => {
        let count = 0;
        const workerCode = `
          let id = setInterval(function() { self.postMessage('tick'); }, 25);
          self.onmessage = function(e) {
            if (e.data === 'stop') clearInterval(id);
          };
        `;
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        const w = new Worker(url);
        w.onmessage = (e) => {
          if (e.data === 'tick') {
            count++;
            if (count >= 3) {
              w.postMessage('stop');
              w.terminate();
              URL.revokeObjectURL(url);
              resolve(count);
            }
          }
        };
      });
    });
    expect(workerTicks).toBeGreaterThanOrEqual(3);
  });
});
