import { Page, Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export interface ViewportBleedItem {
  selector: string;
  text: string;
  left: number;
  right: number;
  width: number;
  overflowLeftPx: number;
  overflowRightPx: number;
}

export interface ContainerOverflowItem {
  selector: string;
  text: string;
  clientWidth: number;
  scrollWidth: number;
  overflowPx: number;
  overflowXStyle: string;
  textOverflow: string;
}

export interface ClippedControlItem {
  selector: string;
  text: string;
  clientWidth: number;
  scrollWidth: number;
  height: number;
}

export interface SmallTouchTargetItem {
  selector: string;
  text: string;
  width: number;
  height: number;
}

export interface OcclusionCheckResult {
  label: string;
  visible: boolean;
  inViewportFold1: boolean;
  occluded: boolean;
  hitElementSelector: string | null;
  boundingBox: { x: number; y: number; width: number; height: number } | null;
}

export interface MobileScreenInspection {
  screenName: string;
  viewport: { width: number; height: number };
  docScrollWidth: number;
  pageHorizontalOverflowPx: number;
  viewportBleeds: ViewportBleedItem[];
  containerOverflows: ContainerOverflowItem[];
  clippedControls: ClippedControlItem[];
  smallTouchTargets: SmallTouchTargetItem[];
}

export interface InspectOptions {
  /** Altura mínima recomendada para alvos de toque (default: 36px; Android Material: 48px) */
  minTouchTargetPx?: number;
  /** Tolerância em pixels para arredondamentos sub-pixel (default: 1.5px) */
  bleedTolerancePx?: number;
}

/**
 * Inspeciona geometricamente a árvore DOM em um viewport mobile/Android,
 * detectando elementos que vazam da tela, estouram containers pais,
 * têm texto cortado em controles interativos ou possuem área de toque reduzida.
 */
export async function inspectMobileViewport(
  page: Page,
  screenName: string,
  options: InspectOptions = {}
): Promise<MobileScreenInspection> {
  const minTouchTargetPx = options.minTouchTargetPx ?? 36;
  const bleedTolerancePx = options.bleedTolerancePx ?? 1.5;

  return await page.evaluate(
    ({ screenName, minTouchTargetPx, bleedTolerancePx }) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const docScrollWidth = document.documentElement.scrollWidth;

      const viewportBleeds: ViewportBleedItem[] = [];
      const containerOverflows: ContainerOverflowItem[] = [];
      const clippedControls: ClippedControlItem[] = [];
      const smallTouchTargets: SmallTouchTargetItem[] = [];

      const interactiveTags = new Set(['button', 'a', 'input', 'select', 'textarea']);
      const allElements = Array.from(document.querySelectorAll('body *'));

      for (const el of allElements) {
        const htmlEl = el as HTMLElement;
        const style = window.getComputedStyle(htmlEl);
        if (
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          Number(style.opacity) === 0 ||
          style.pointerEvents === 'none'
        ) {
          continue;
        }

        const rect = htmlEl.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;

        const tag = htmlEl.tagName.toLowerCase();
        const cls =
          typeof htmlEl.className === 'string'
            ? htmlEl.className
                .trim()
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 5)
                .join('.')
            : '';
        const selector = `${tag}${cls ? '.' + cls : ''}`;
        const rawText =
          htmlEl.innerText ||
          htmlEl.getAttribute('aria-label') ||
          htmlEl.getAttribute('title') ||
          htmlEl.textContent ||
          '';
        const text = rawText.trim().replace(/\s+/g, ' ').slice(0, 60);

        // Verifica se está dentro de um carrossel/container com rolagem horizontal intencional
        let hasScrollableAncestor = false;
        let parent = htmlEl.parentElement;
        while (parent && parent !== document.body) {
          const pStyle = window.getComputedStyle(parent);
          if (pStyle.overflowX === 'auto' || pStyle.overflowX === 'scroll') {
            hasScrollableAncestor = true;
            break;
          }
          parent = parent.parentElement;
        }

        // 1. Vazamento para fora da largura da tela do celular (Viewport Bleed)
        if (
          !hasScrollableAncestor &&
          (rect.right > vw + bleedTolerancePx || rect.left < -bleedTolerancePx)
        ) {
          viewportBleeds.push({
            selector,
            text,
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
            overflowLeftPx: Math.max(0, Math.round(-rect.left)),
            overflowRightPx: Math.max(0, Math.round(rect.right - vw)),
          });
        }

        // 2. Estouro de Container Pai (scrollWidth > clientWidth sem scroll horizontal intencional)
        if (
          htmlEl.scrollWidth > htmlEl.clientWidth + 2 &&
          style.overflowX !== 'auto' &&
          style.overflowX !== 'scroll' &&
          htmlEl.children.length <= 6
        ) {
          containerOverflows.push({
            selector,
            text,
            clientWidth: htmlEl.clientWidth,
            scrollWidth: htmlEl.scrollWidth,
            overflowPx: htmlEl.scrollWidth - htmlEl.clientWidth,
            overflowXStyle: style.overflowX,
            textOverflow: style.textOverflow,
          });
        }

        // 3. Controles interativos cortados (botões, inputs, selects com conteúdo estourando)
        const isInteractive =
          interactiveTags.has(tag) || htmlEl.getAttribute('role') === 'button';
        if (isInteractive && htmlEl.scrollWidth > htmlEl.clientWidth + 2) {
          clippedControls.push({
            selector,
            text,
            clientWidth: htmlEl.clientWidth,
            scrollWidth: htmlEl.scrollWidth,
            height: Math.round(rect.height),
          });
        }

        // 4. Alvos de toque abaixo do mínimo ergonômico
        if (
          isInteractive &&
          (rect.height < minTouchTargetPx || rect.width < minTouchTargetPx)
        ) {
          smallTouchTargets.push({
            selector,
            text,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          });
        }
      }

      return {
        screenName,
        viewport: { width: vw, height: vh },
        docScrollWidth,
        pageHorizontalOverflowPx: Math.max(0, docScrollWidth - vw),
        viewportBleeds: viewportBleeds.slice(0, 15),
        containerOverflows: containerOverflows.slice(0, 15),
        clippedControls: clippedControls.slice(0, 15),
        smallTouchTargets: smallTouchTargets.slice(0, 15),
      };
    },
    { screenName, minTouchTargetPx, bleedTolerancePx }
  );
}

/**
 * Verifica se um elemento interativo (ex.: botão CTA principal) está visível no Fold 1
 * e NÃO está coberto/obstruído por barras fixas (BottomNav, Header sticky, etc.)
 * usando `document.elementFromPoint(centerX, centerY)`.
 */
export async function checkElementNotOccluded(
  page: Page,
  locator: Locator,
  label: string,
  bottomNavHeightPx = 64
): Promise<OcclusionCheckResult> {
  const isVisible = await locator.isVisible().catch(() => false);
  if (!isVisible) {
    return {
      label,
      visible: false,
      inViewportFold1: false,
      occluded: true,
      hitElementSelector: null,
      boundingBox: null,
    };
  }

  const initialBox = await locator.boundingBox();
  if (!initialBox) {
    return {
      label,
      visible: false,
      inViewportFold1: false,
      occluded: true,
      hitElementSelector: null,
      boundingBox: null,
    };
  }

  const vpSize = page.viewportSize() || { width: 393, height: 851 };
  const inViewportFold1 =
    initialBox.y >= 0 &&
    initialBox.x >= 0 &&
    initialBox.x + initialBox.width <= vpSize.width + 2 &&
    initialBox.y + initialBox.height <= vpSize.height - bottomNavHeightPx;

  if (!inViewportFold1) {
    await locator.evaluate((el) => {
      el.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
    });
  }
  const box = (await locator.boundingBox()) || initialBox;

  const result = await locator.evaluate(
    (el, { box, inViewportFold1 }) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;

      if (centerX < 0 || centerX > vw || centerY < 0 || centerY > vh) {
        return {
          inViewportFold1,
          occluded: true,
          hitElementSelector: 'OUT_OF_VIEWPORT',
        };
      }

      const hitEl = document.elementFromPoint(centerX, centerY);
      if (!hitEl || !el) {
        return {
          inViewportFold1,
          occluded: true,
          hitElementSelector: null,
        };
      }

      const isSelfOrChild = el === hitEl || el.contains(hitEl) || hitEl.contains(el);
      const hitTag = hitEl.tagName.toLowerCase();
      const hitCls =
        typeof (hitEl as HTMLElement).className === 'string'
          ? (hitEl as HTMLElement).className.trim().split(/\s+/).slice(0, 3).join('.')
          : '';

      return {
        inViewportFold1,
        occluded: !isSelfOrChild,
        hitElementSelector: `${hitTag}${hitCls ? '.' + hitCls : ''}`,
      };
    },
    { box, inViewportFold1 }
  );

  return {
    label,
    visible: true,
    inViewportFold1: result.inViewportFold1,
    occluded: result.occluded,
    hitElementSelector: result.hitElementSelector,
    boundingBox: {
      x: Math.round(box.x),
      y: Math.round(box.y),
      width: Math.round(box.width),
      height: Math.round(box.height),
    },
  };
}

/**
 * Executa auditoria automatizada de acessibilidade mobile via @axe-core/playwright.
 */
export async function runMobileAxeAudit(page: Page, screenName: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();

  return {
    screenName,
    violationsCount: results.violations.length,
    violations: results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      help: v.help,
      nodesCount: v.nodes.length,
      sampleTargets: v.nodes.slice(0, 3).map((n) => n.target),
    })),
  };
}
