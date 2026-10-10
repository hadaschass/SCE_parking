'use strict';

(function () {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  // Sequential blue ramp, light -> dark.
  const RAMP = ['#cde2fb', '#b7d3f6', '#9ec5f4', '#86b6ef', '#6da7ec', '#5598e7', '#3987e5', '#2a78d6', '#256abf', '#1c5cab', '#184f95', '#104281', '#0d366b'];
  // Fixed color domain so colors mean the same thing on every run.
  const SCALE_MAX = 0.7;
  const EXAMPLE = {
    traits: ['curious', 'detail-oriented', 'patient', 'creative', 'good communicator'],
    roles: ['data scientist', 'UX designer', 'DevOps engineer'],
  };

  const form = document.getElementById('similarityForm');
  const flash = document.getElementById('flashMessage');
  const results = document.getElementById('results');
  const tooltip = document.getElementById('tooltip');
  const submitBtn = form.querySelector('button[type="submit"]');

  const fmt = (x) => x.toFixed(2);
  const css = (name) => getComputedStyle(document.body).getPropertyValue(name).trim();

  function showFlash(message, kind) {
    flash.textContent = message;
    flash.className = `flash ${kind}`;
  }

  function rampColor(score) {
    const t = Math.min(Math.max(score / SCALE_MAX, 0), 1);
    const idx = Math.round(t * (RAMP.length - 1));
    return { fill: RAMP[idx], dark: idx >= 7 };
  }

  function strength(score) {
    if (score >= 0.5) return 'strong';
    if (score >= 0.3) return 'moderate';
    if (score >= 0.15) return 'weak';
    return 'very weak';
  }

  // ---------- tooltip ----------
  function attachTooltip(el, text) {
    el.addEventListener('pointerenter', () => {
      tooltip.textContent = text;
      tooltip.classList.remove('hidden');
    });
    el.addEventListener('pointermove', (e) => {
      const pad = 14;
      const w = tooltip.offsetWidth;
      const x = e.clientX + pad + w > window.innerWidth ? e.clientX - pad - w : e.clientX + pad;
      tooltip.style.left = `${Math.max(4, x)}px`;
      tooltip.style.top = `${e.clientY + pad}px`;
    });
    el.addEventListener('pointerleave', () => tooltip.classList.add('hidden'));
  }

  function svgEl(tag, attrs, text) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    if (text !== undefined) el.textContent = text;
    return el;
  }

  // ---------- role fit bars ----------
  function renderRoleBars(roleScores) {
    const container = document.getElementById('roleBars');
    const width = Math.max(280, container.clientWidth);
    // On narrow screens the role name sits above its bar instead of beside it.
    const stacked = width < 520;
    const labelW = stacked ? 0 : 170;
    const valueW = 120;
    const rowH = stacked ? 58 : 44;
    const barY = stacked ? 24 : 4;
    const height = roleScores.length * rowH + 8;
    const plotW = width - labelW - valueW;
    const svg = svgEl('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': 'Average similarity per role' });

    roleScores.forEach((r, i) => {
      const y = i * rowH + 8;
      const barW = Math.max(2, (Math.max(r.average, 0) / SCALE_MAX) * plotW);
      const g = svgEl('g', {});
      g.append(
        svgEl('text', { x: 0, y: stacked ? y + 14 : y + 20, 'font-size': 14, fill: css('--text-primary') }, r.role),
        svgEl('rect', { x: labelW, y: y + barY, width: plotW, height: 22, rx: 4, fill: css('--grid'), opacity: 0.5 }),
        svgEl('rect', { x: labelW, y: y + barY, width: Math.min(barW, plotW), height: 22, rx: 4, fill: css('--series-1') }),
        svgEl('text', { x: labelW + plotW + 10, y: y + barY + 16, 'font-size': 14, 'font-weight': 600, fill: css('--text-primary') }, `${fmt(r.average)} · ${r.strength}`),
        // Invisible full-row hit target for the tooltip.
        svgEl('rect', { x: 0, y, width, height: rowH - 4, fill: 'transparent' })
      );
      attachTooltip(g, `${r.role}: average similarity ${fmt(r.average)} (${r.strength}). Closest characteristic: ${r.closestTrait}.`);
      svg.append(g);
    });
    container.replaceChildren(svg);
  }

  // ---------- heatmap (doubles as the data table) ----------
  function renderHeatmap(data) {
    const table = document.getElementById('heatmap');
    const head = document.createElement('tr');
    head.append(Object.assign(document.createElement('th'), { textContent: '' }));
    data.roles.forEach((role) => head.append(Object.assign(document.createElement('th'), { scope: 'col', textContent: role })));
    const thead = document.createElement('thead');
    thead.append(head);

    const tbody = document.createElement('tbody');
    data.traits.forEach((trait, i) => {
      const tr = document.createElement('tr');
      tr.append(Object.assign(document.createElement('th'), { scope: 'row', textContent: trait }));
      const row = data.matrix[i];
      const bestIdx = row.indexOf(Math.max(...row));
      row.forEach((score, j) => {
        const td = document.createElement('td');
        const { fill, dark } = rampColor(score);
        td.textContent = fmt(score);
        td.style.background = fill;
        td.style.color = dark ? '#ffffff' : '#0b0b0b';
        if (j === bestIdx) td.classList.add('best');
        attachTooltip(td, `"${trait}" vs "${data.roles[j]}": ${fmt(score)} (${strength(score)})`);
        tr.append(td);
      });
      tbody.append(tr);
    });
    table.replaceChildren(thead, tbody);
    document.getElementById('scaleMax').textContent = `${SCALE_MAX}+`;
  }

  // ---------- semantic map ----------
  function renderMap(data) {
    const container = document.getElementById('semanticMap');
    const width = Math.max(280, container.clientWidth);
    const height = Math.round(Math.min(Math.max(width * 0.6, 300), 420));
    const side = Math.min(110, Math.round(width * 0.25));
    const pad = { top: 24, right: side, bottom: 24, left: side };
    const xs = data.points.map((p) => p.x);
    const ys = data.points.map((p) => p.y);
    const span = (arr) => Math.max(...arr) - Math.min(...arr) || 1;
    const sx = (x) => pad.left + ((x - Math.min(...xs)) / span(xs)) * (width - pad.left - pad.right);
    const sy = (y) => pad.top + ((Math.max(...ys) - y) / span(ys)) * (height - pad.top - pad.bottom);

    const svg = svgEl('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': 'Semantic map of characteristics and roles' });
    svg.append(svgEl('rect', { x: 0.5, y: 0.5, width: width - 1, height: height - 1, rx: 6, fill: 'none', stroke: css('--grid') }));

    const byLabel = Object.fromEntries(data.points.map((p) => [p.kind + p.label, p]));
    // Links: each trait to its closest role.
    data.traitMatches.forEach((m) => {
      const a = byLabel[`trait${m.trait}`];
      const b = byLabel[`role${m.closestRole}`];
      svg.append(svgEl('line', { x1: sx(a.x), y1: sy(a.y), x2: sx(b.x), y2: sy(b.y), stroke: css('--text-muted'), 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: 0.7 }));
    });

    data.points.forEach((p) => {
      const cx = sx(p.x);
      const cy = sy(p.y);
      const isRole = p.kind === 'role';
      const g = svgEl('g', {});
      const mark = isRole
        ? svgEl('rect', { x: cx - 7, y: cy - 7, width: 14, height: 14, rx: 2, fill: css('--series-2'), stroke: css('--surface-1'), 'stroke-width': 2 })
        : svgEl('circle', { cx, cy, r: 6, fill: css('--series-1'), stroke: css('--surface-1'), 'stroke-width': 2 });
      const anchorRight = cx > width / 2;
      g.append(
        svgEl('circle', { cx, cy, r: 16, fill: 'transparent' }),
        mark,
        svgEl('text', {
          x: anchorRight ? cx - 12 : cx + 12,
          y: cy + 4,
          'text-anchor': anchorRight ? 'end' : 'start',
          'font-size': 13,
          'font-weight': isRole ? 700 : 400,
          fill: css('--text-primary'),
        }, p.label)
      );
      const detail = isRole
        ? data.roleScores.find((r) => r.role === p.label)
        : data.traitMatches.find((m) => m.trait === p.label);
      attachTooltip(g, isRole
        ? `Role: ${p.label}. Average similarity ${fmt(detail.average)}.`
        : `Characteristic: ${p.label}. Closest role: ${detail.closestRole} (${fmt(detail.score)}).`);
      svg.append(g);
    });

    container.replaceChildren(svg);
  }

  function renderTraitMatches(matches) {
    const list = document.getElementById('traitMatches');
    list.replaceChildren(...matches.map((m) => {
      const li = document.createElement('li');
      const strong = document.createElement('strong');
      strong.textContent = m.trait;
      li.append(strong, ` → ${m.closestRole} (${fmt(m.score)}, ${m.strength})`);
      return li;
    }));
  }

  let lastData;

  function render(data) {
    lastData = data;
    const best = data.roleScores[0];
    document.getElementById('bestRole').textContent = best.role;
    document.getElementById('bestRoleDetail').textContent =
      `Average similarity ${fmt(best.average)} (${best.strength}). Its closest characteristic is “${best.closestTrait}”.`;
    renderHeatmap(data);
    renderTraitMatches(data.traitMatches);
    document.getElementById('modelNote').textContent =
      `Model: ${data.model}. For this model, scores above about 0.5 indicate a strong relation and below 0.15 almost none.`;
    results.classList.remove('hidden');
    // Draw charts after the section is visible so its width is known.
    renderRoleBars(data.roleScores);
    renderMap(data);
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Charts are drawn at the container's real width, so redraw on resize.
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (lastData && !results.classList.contains('hidden')) {
        renderRoleBars(lastData.roleScores);
        renderMap(lastData);
      }
    }, 150);
  });

  document.getElementById('exampleBtn').addEventListener('click', () => {
    form.querySelectorAll('input[name="trait"]').forEach((el, i) => { el.value = EXAMPLE.traits[i]; });
    form.querySelectorAll('input[name="role"]').forEach((el, i) => { el.value = EXAMPLE.roles[i]; });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = (name) => [...form.querySelectorAll(`input[name="${name}"]`)].map((el) => el.value.trim());
    submitBtn.disabled = true;
    submitBtn.textContent = 'Comparing…';
    flash.className = 'flash hidden';
    try {
      const res = await fetch('/api/similarity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ traits: values('trait'), roles: values('role') }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = data.details ? [...new Set(data.details.map((d) => d.message))].join(' ') : '';
        throw new Error(detail || data.error || 'Request failed.');
      }
      render(data);
    } catch (err) {
      showFlash(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Compare';
    }
  });
})();
