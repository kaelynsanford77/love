/**
 * Love IDE - Preview Probe Script
 * Injected into preview iframes to enable:
 * 1. Click-to-edit: highlight elements and post source locations
 * 2. Runtime error forwarding
 * 3. Console forwarding
 * 4. Theme toggle
 * 5. Design token overlay (press D)
 * 6. Auth simulation
 * 7. Accessibility audit
 */
(function() {
  'use strict';

  const parent = window.parent;

  function postMessage(type, data) {
    try {
      parent.postMessage({ type: 'lovable:' + type, ...data }, '*');
    } catch (e) {}
  }

  // ─── 1. Click-to-edit ─────────────────────────────────────────────────────
  let hoverOverlay = null;
  let inspectMode = false;

  function createOverlay() {
    const el = document.createElement('div');
    el.style.cssText = [
      'position: fixed',
      'pointer-events: none',
      'z-index: 2147483646',
      'border: 2px solid oklch(0.55 0.18 265)',
      'background: oklch(0.55 0.18 265 / 0.08)',
      'border-radius: 3px',
      'transition: all 0.1s ease',
      'display: none',
    ].join(';');
    document.body.appendChild(el);
    return el;
  }

  window.addEventListener('message', function(e) {
    if (e.data?.type === 'lovable:inspect-mode') {
      inspectMode = e.data.enabled;
      if (!inspectMode && hoverOverlay) {
        hoverOverlay.style.display = 'none';
      }
    }
  });

  document.addEventListener('mousemove', function(e) {
    if (!inspectMode) return;
    if (!hoverOverlay) hoverOverlay = createOverlay();

    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || el === hoverOverlay) return;

    const rect = el.getBoundingClientRect();
    hoverOverlay.style.display = 'block';
    hoverOverlay.style.left = (rect.left + window.scrollX) + 'px';
    hoverOverlay.style.top = (rect.top + window.scrollY) + 'px';
    hoverOverlay.style.width = rect.width + 'px';
    hoverOverlay.style.height = rect.height + 'px';
  });

  document.addEventListener('click', function(e) {
    if (!inspectMode) return;
    e.preventDefault();
    e.stopPropagation();

    const el = e.target;
    // Try to find React fiber
    const fiberKey = Object.keys(el).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'));
    let source = null;

    if (fiberKey) {
      let fiber = el[fiberKey];
      while (fiber) {
        if (fiber._debugSource) {
          source = fiber._debugSource;
          break;
        }
        fiber = fiber.return;
      }
    }

    postMessage('open-source', {
      element: el.tagName,
      source,
      rect: el.getBoundingClientRect(),
    });
  }, true);

  // ─── 2. Runtime error forwarding ──────────────────────────────────────────
  window.onerror = function(message, source, lineno, colno, error) {
    postMessage('error', {
      message: String(message),
      source,
      lineno,
      colno,
      stack: error?.stack,
    });
    return false;
  };

  window.addEventListener('unhandledrejection', function(e) {
    postMessage('error', {
      message: 'Unhandled Promise Rejection: ' + (e.reason?.message || String(e.reason)),
      stack: e.reason?.stack,
    });
  });

  // ─── 3. Console forwarding ────────────────────────────────────────────────
  const consoleMethods = ['log', 'warn', 'error', 'info', 'debug'];
  const originalConsole = {};

  consoleMethods.forEach(function(method) {
    originalConsole[method] = console[method].bind(console);
    console[method] = function() {
      originalConsole[method].apply(console, arguments);
      const args = Array.from(arguments).map(function(a) {
        try {
          return typeof a === 'object' ? JSON.stringify(a) : String(a);
        } catch (e) {
          return '[unserializable]';
        }
      });
      postMessage('console', {
        level: method,
        message: args.join(' '),
        time: new Date().toLocaleTimeString(),
      });
    };
  });

  // ─── 4. Theme toggle ──────────────────────────────────────────────────────
  window.addEventListener('message', function(e) {
    if (e.data?.type === 'lovable:theme') {
      const theme = e.data.theme;
      document.documentElement.classList.toggle('dark', theme === 'dark');
      document.documentElement.classList.toggle('light', theme === 'light');
    }
  });

  // ─── 5. Design token overlay ──────────────────────────────────────────────
  let tokenOverlayActive = false;
  const tokenBadges = [];

  document.addEventListener('keydown', function(e) {
    if (e.key === 'd' || e.key === 'D') {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      tokenOverlayActive = !tokenOverlayActive;

      if (tokenOverlayActive) {
        showDesignTokens();
      } else {
        hideDesignTokens();
      }
    }
  });

  function showDesignTokens() {
    const styles = getComputedStyle(document.documentElement);
    const elements = document.querySelectorAll('[class]');
    elements.forEach(function(el) {
      const cs = getComputedStyle(el);
      const color = cs.backgroundColor;
      if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
        const badge = document.createElement('div');
        badge.style.cssText = [
          'position: absolute',
          'z-index: 2147483645',
          'background: #1a1a1a',
          'border: 1px solid #2a2a2a',
          'color: #e8e8e8',
          'font: 10px/1.4 monospace',
          'padding: 2px 6px',
          'border-radius: 4px',
          'pointer-events: none',
          'white-space: nowrap',
        ].join(';');
        badge.textContent = color;
        const rect = el.getBoundingClientRect();
        badge.style.left = (rect.left + window.scrollX) + 'px';
        badge.style.top = (rect.top + window.scrollY - 24) + 'px';
        document.body.appendChild(badge);
        tokenBadges.push(badge);
      }
    });
  }

  function hideDesignTokens() {
    tokenBadges.forEach(b => b.remove());
    tokenBadges.length = 0;
  }

  // ─── 6. Auth simulation ───────────────────────────────────────────────────
  window.addEventListener('message', function(e) {
    if (e.data?.type === 'lovable:auth') {
      const mockSession = {
        user: {
          id: 'mock-user-id',
          email: e.data.email || 'user@example.com',
          role: 'authenticated',
        },
        access_token: 'mock-access-token',
        expires_at: Date.now() + 3600000,
      };

      // Try to inject into Supabase auth state if available
      if (window.supabase) {
        try {
          window.supabase.auth._saveSession(mockSession);
        } catch (err) {}
      }

      // Store in localStorage as well
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        currentSession: mockSession,
        expiresAt: mockSession.expires_at,
      }));

      postMessage('auth-simulated', { email: mockSession.user.email });
    }
  });

  // ─── 7. Accessibility audit ───────────────────────────────────────────────
  window.addEventListener('message', function(e) {
    if (e.data?.type === 'lovable:a11y-audit') {
      // Run basic a11y checks
      const issues = [];

      // Check images for alt text
      document.querySelectorAll('img').forEach(function(img) {
        if (!img.alt) {
          issues.push({ type: 'error', rule: 'img-alt', element: img.outerHTML.slice(0, 100), message: 'Image missing alt attribute' });
        }
      });

      // Check buttons for accessible names
      document.querySelectorAll('button').forEach(function(btn) {
        if (!btn.textContent?.trim() && !btn.getAttribute('aria-label') && !btn.getAttribute('title')) {
          issues.push({ type: 'warning', rule: 'button-name', element: btn.outerHTML.slice(0, 100), message: 'Button has no accessible name' });
        }
      });

      // Check form inputs for labels
      document.querySelectorAll('input, textarea, select').forEach(function(input) {
        const id = input.id;
        if (!id || !document.querySelector(`label[for="${id}"]`)) {
          if (!input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
            issues.push({ type: 'warning', rule: 'label', element: input.outerHTML.slice(0, 100), message: 'Form element missing label' });
          }
        }
      });

      // Check color contrast (basic)
      document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a').forEach(function(el) {
        const cs = getComputedStyle(el);
        if (cs.fontSize && parseFloat(cs.fontSize) < 12) {
          issues.push({ type: 'warning', rule: 'font-size', element: el.tagName, message: 'Text may be too small to read' });
        }
      });

      postMessage('a11y-results', { issues, timestamp: Date.now() });
    }
  });

  // Signal that probe is loaded
  postMessage('ready', { url: window.location.href });

  console.log('%c🔴 Love IDE probe loaded', 'color: oklch(0.55 0.18 265); font-weight: bold');
})();
