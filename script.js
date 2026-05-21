'use strict';

/* ─── CONSTANTS ─── */
const STORAGE_KEY_PROP = 'akila_propietarios';
const STORAGE_KEY_INQ  = 'akila_inquilinos';
const BASE_COUNT       = 143;
const EMAIL_RE         = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE         = /^(\+598\s?)?0?9\d[\s\-.]?\d{3}[\s\-.]?\d{3}$/;
const SM_URL           = 'https://api.sheetmonkey.io/form/2tLSgLhSMQMmrCfiCAdpc4';

/* ─── HONEYPOT ─── */
function isBot(form) {
    const hp = form.querySelector('.hp-field');
    return hp && hp.value.length > 0;
}

/* ─── SHEETMONKEY ─── */
function sendSheet(data) {
    fetch(SM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).catch(function() {});
}

/* ─── UTILS ─── */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ─── STORAGE ─── */
function getList(rol) {
    const key = rol === 'propietario' ? STORAGE_KEY_PROP : STORAGE_KEY_INQ;
    try { return JSON.parse(localStorage.getItem(key) || '[]'); }
    catch { return []; }
}

function addToList(entry) {
    const key  = entry.rol === 'propietario' ? STORAGE_KEY_PROP : STORAGE_KEY_INQ;
    const list = getList(entry.rol);
    list.push({ ...entry, ts: Date.now() });
    try { localStorage.setItem(key, JSON.stringify(list)); } catch {}
    return getCount();
}

function getCount() {
    return BASE_COUNT + getList('propietario').length + getList('inquilino').length;
}

/* ─── COUNTER ANIMATION ─── */
function animCount(el, from, to, ms = 1200) {
    const start = performance.now();
    const diff  = to - from;
    (function tick(now) {
        const t = Math.min((now - start) / ms, 1);
        const e = 1 - Math.pow(1 - t, 3); // ease out cubic
        el.textContent = Math.round(from + diff * e);
        if (t < 1) requestAnimationFrame(tick);
    })(performance.now());
}

function initCounters() {
    const total = getCount();
    $$('#hero-count, #waitlist-count').forEach(el => {
        el.textContent = BASE_COUNT;
        new IntersectionObserver(([e], obs) => {
            if (!e.isIntersecting) return;
            animCount(el, Math.max(0, total - 18), total, 1400);
            obs.disconnect();
        }, { threshold: 0.5 }).observe(el);
    });
}

function updateCounters(n) {
    $$('#hero-count, #waitlist-count').forEach(el =>
        animCount(el, parseInt(el.textContent) || BASE_COUNT, n, 700)
    );
}

/* ─── VALIDATION ─── */
function setErr(input, el, msg) {
    input.classList.add('is-error');
    input.setAttribute('aria-invalid', 'true');
    el.textContent = msg;
}

function clearErr(input, el) {
    input.classList.remove('is-error');
    input.removeAttribute('aria-invalid');
    el.textContent = '';
}

function checkEmail(input, el) {
    const v = input.value.trim();
    if (!v)                { setErr(input, el, 'El email es requerido.'); return false; }
    if (!EMAIL_RE.test(v)) { setErr(input, el, 'Ingresá un email válido.'); return false; }
    clearErr(input, el); return true;
}

function checkPhone(input, el) {
    const v = input.value.trim().replace(/\s/g, '');
    if (!v)                { setErr(input, el, 'El teléfono es requerido.'); return false; }
    if (!PHONE_RE.test(v)) { setErr(input, el, 'Ingresá un celular uruguayo (ej: 099 123 456).'); return false; }
    clearErr(input, el); return true;
}

function checkRol(radios, el) {
    if (!radios.some(r => r.checked)) { el.textContent = 'Seleccioná si sos propietario o inquilino.'; return false; }
    el.textContent = ''; return true;
}

/* ─── SUCCESS TEMPLATES ─── */
function successHtml(count, isLight) {
    const tc = isLight ? 'form-success__title--light' : '';
    const sc = isLight ? 'form-success__text--light'  : '';
    return `<div class="form-success">
        <span class="form-success__icon">🎉</span>
        <p class="form-success__title ${tc}">¡Ya estás en la lista!</p>
        <p class="form-success__text ${sc}">Te avisamos cuando lancemos.<br>Ya son <strong>${count}</strong> personas esperando.</p>
    </div>`;
}

/* ─── HERO FORM ─── */
function initHeroForm() {
    const form = $('#hero-form');
    if (!form) return;
    const eIn = $('#h-email'), pIn = $('#h-phone'), rIn = $('#h-rec');
    const eEl = $('#h-email-err'), pEl = $('#h-phone-err'), rEl = $('#h-rol-err');
    const rads = $$('input[name="hrol"]', form);

    eIn.addEventListener('input', () => clearErr(eIn, eEl));
    pIn.addEventListener('input', () => clearErr(pIn, pEl));

    form.addEventListener('submit', ev => {
        ev.preventDefault();
        if (isBot(form)) return;
        const ok = checkEmail(eIn, eEl) & checkPhone(pIn, pEl) & checkRol(rads, rEl);
        if (!ok) return;
        const rol   = rads.find(r => r.checked).value;
        const count = addToList({ email: eIn.value.trim(), phone: pIn.value.trim(), rol, rec: rIn?.value.trim() || '' });
        updateCounters(count);
        $('.hero__form-card').innerHTML = successHtml(count, false);
    });
}

/* ─── WAITLIST FORM ─── */
function initWaitlistForm() {
    const form = $('#waitlist-form');
    if (!form) return;
    const eIn = $('#w-email'), pIn = $('#w-phone'), rIn = $('#w-rec');
    const eEl = $('#w-email-err'), pEl = $('#w-phone-err'), rEl = $('#w-rol-err');
    const rads = $$('input[name="wrol"]', form);

    eIn.addEventListener('input', () => clearErr(eIn, eEl));
    pIn.addEventListener('input', () => clearErr(pIn, pEl));

    form.addEventListener('submit', ev => {
        ev.preventDefault();
        if (isBot(form)) return;
        const ok = checkEmail(eIn, eEl) & checkPhone(pIn, pEl) & checkRol(rads, rEl);
        if (!ok) return;
        const rol   = rads.find(r => r.checked).value;
        const count = addToList({ email: eIn.value.trim(), phone: pIn.value.trim(), rol, rec: rIn?.value.trim() || '' });
        updateCounters(count);
        form.innerHTML = successHtml(count, true);
    });
}

/* ─── MODAL FORMS ─── */
function initModalForm(formId, rol) {
    const form = $(formId);
    if (!form) return;
    const errs  = $$('.form-error', form);
    const eIn   = $('input[type="email"]', form);
    const pIn   = $('input[type="tel"]',   form);
    const rIn   = $('textarea', form);
    const eEl   = errs[0], pEl = errs[1];

    if (eIn && eEl) eIn.addEventListener('input', () => clearErr(eIn, eEl));
    if (pIn && pEl) pIn.addEventListener('input', () => clearErr(pIn, pEl));

    form.addEventListener('submit', ev => {
        ev.preventDefault();
        if (isBot(form)) return;
        const ok = checkEmail(eIn, eEl) & checkPhone(pIn, pEl);
        if (!ok) return;
        const count = addToList({ email: eIn.value.trim(), phone: pIn.value.trim(), rol, rec: rIn?.value.trim() || '' });
        updateCounters(count);
        form.innerHTML = `<div class="form-success" style="min-height:200px">
            <span class="form-success__icon">${rol === 'propietario' ? '🏠' : '🔑'}</span>
            <p class="form-success__title">¡Ya estás en la lista!</p>
            <p class="form-success__text">${rol === 'propietario'
                ? 'Te avisamos cuando puedas publicar tu propiedad.'
                : 'Te avisamos cuando puedas buscar tu próximo hogar.'
            }</p>
        </div>`;
    });
}

/* ─── MODALS ─── */
let lastFocus = null;

function openModal(id) {
    const m = $(`#${id}`);
    if (!m) return;
    lastFocus = document.activeElement;
    m.classList.add('is-open');
    m.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const first = $('input, button:not(.modal-close)', m);
    if (first) setTimeout(() => first.focus(), 180);
    trapFocus(m);
}

function closeModal(m) {
    if (!m) return;
    m.classList.remove('is-open');
    m.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
    if (m._trap) { m.removeEventListener('keydown', m._trap); delete m._trap; }
}

function trapFocus(m) {
    const focusable = $$('button, input, a[href], [tabindex]:not([tabindex="-1"])', m);
    if (focusable.length < 2) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    m._trap = ev => {
        if (ev.key !== 'Tab') return;
        if (ev.shiftKey) { if (document.activeElement === first) { ev.preventDefault(); last.focus(); } }
        else             { if (document.activeElement === last)  { ev.preventDefault(); first.focus(); } }
    };
    m.addEventListener('keydown', m._trap);
}

function initModals() {
    ['#nav-propietario', '#propuesta-propietario'].forEach(s => {
        const b = $(s); if (b) b.addEventListener('click', () => openModal('modal-propietario'));
    });
    ['#nav-inquilino', '#propuesta-inquilino'].forEach(s => {
        const b = $(s); if (b) b.addEventListener('click', () => openModal('modal-inquilino'));
    });
    $$('[data-close-modal]').forEach(el =>
        el.addEventListener('click', ev => closeModal(ev.target.closest('.modal')))
    );
    document.addEventListener('keydown', ev => {
        if (ev.key === 'Escape') { const m = $('.modal.is-open'); if (m) closeModal(m); }
    });
    initModalForm('#modal-prop-form', 'propietario');
    initModalForm('#modal-inq-form',  'inquilino');
}

/* ─── NAV SCROLL ─── */
function initNav() {
    const nav = $('#nav');
    if (!nav) return;
    function tick() {
        const scrolled = window.scrollY > 60;
        nav.classList.toggle('nav--scrolled', scrolled);
        nav.classList.toggle('nav--top',      !scrolled);
    }
    window.addEventListener('scroll', tick, { passive: true });
    tick();
}

/* ─── SCROLL ANIMATIONS ─── */
function initFadeIn() {
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target); }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    $$('.fade-in').forEach(el => obs.observe(el));
}

/* ─── SMOOTH SCROLL ─── */
function initScroll() {
    $$('a[href^="#"]').forEach(a => {
        a.addEventListener('click', ev => {
            const t = $(a.getAttribute('href'));
            if (!t) return;
            ev.preventDefault();
            const offset = ($('#nav')?.offsetHeight || 70) + 12;
            window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
        });
    });
}

/* ─── QUICK SURVEY ─── */
const STORAGE_KEY_SURVEY = 'akila_survey';
const SURVEY_LABELS = { comision: 'Comisión', garantias: 'Garantías', trato: 'Trato', tiempo: 'Tiempo' };

function getSurveyVotes() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_SURVEY) || '{}'); }
    catch { return {}; }
}

function addSurveyVote(key) {
    const votes = getSurveyVotes();
    votes[key] = (votes[key] || 0) + 1;
    try { localStorage.setItem(STORAGE_KEY_SURVEY, JSON.stringify(votes)); } catch {}
    sendSheet({ tipo: 'survey', voto: SURVEY_LABELS[key] });
    return votes;
}

function renderSurveyResults(votes, selectedKey) {
    const resultsEl = $('#survey-results');
    if (!resultsEl) return;
    const total = Object.values(votes).reduce((a, b) => a + b, 0) || 1;
    const maxVotes = Math.max(...Object.values(votes));
    const order = Object.keys(SURVEY_LABELS).sort((a, b) => (votes[b] || 0) - (votes[a] || 0));
    resultsEl.innerHTML = order.map(key => {
        const v = votes[key] || 0;
        const pct = Math.round((v / total) * 100);
        const isWinner = v === maxVotes && v > 0;
        return `<div class="survey-result-row">
            <span class="survey-result-label">${SURVEY_LABELS[key]}</span>
            <div class="survey-result-bar-wrap">
                <div class="survey-result-bar-fill${isWinner ? ' survey-result-bar-fill--winner' : ''}" style="width:0%" data-pct="${pct}"></div>
            </div>
            <span class="survey-result-pct">${pct}%</span>
        </div>`;
    }).join('') + `<p class="survey-thanks">¡Gracias! ${total} voto${total !== 1 ? 's' : ''} registrado${total !== 1 ? 's' : ''}.</p>`;
    resultsEl.hidden = false;
    // Animate bars
    requestAnimationFrame(() => {
        $$('.survey-result-bar-fill', resultsEl).forEach(bar => {
            setTimeout(() => { bar.style.width = bar.dataset.pct + '%'; }, 60);
        });
    });
}

function initSurvey() {
    const opts = $$('.survey-opt');
    if (!opts.length) return;

    // Check if already voted
    const existing = getSurveyVotes();
    if (Object.values(existing).some(v => v > 0)) {
        opts.forEach(o => { o.disabled = true; o.setAttribute('aria-pressed', 'false'); });
        renderSurveyResults(existing, null);
        return;
    }

    opts.forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.key;
            opts.forEach(o => { o.disabled = true; o.setAttribute('aria-pressed', 'false'); });
            btn.setAttribute('aria-pressed', 'true');
            btn.classList.add('is-selected');
            const votes = addSurveyVote(key);
            renderSurveyResults(votes, key);
        });
    });
}

/* ─── SUGERENCIAS ─── */
const STORAGE_KEY_SUG = 'akila_sugerencias';

const SUGGEST_PLACEHOLDERS = [
    'Me gustaría que Akila tenga...',
    'Sería genial un lugar para...',
    'Echaría de menos si no tuviera...',
    'Lo que más me importa es...',
    'Me ayudaría mucho poder...',
    'Sería un problema si no hay...',
    'Mi mayor miedo al alquilar es...',
];

function saveSuggestion(text) {
    try {
        const list = JSON.parse(localStorage.getItem(STORAGE_KEY_SUG) || '[]');
        list.push({ text, ts: Date.now() });
        localStorage.setItem(STORAGE_KEY_SUG, JSON.stringify(list));
    } catch {}
    sendSheet({ tipo: 'sugerencia', texto: text });
}

function initSuggestForm() {
    const form  = $('#suggest-form');
    const input = $('#suggest-input');
    if (!form || !input) return;

    /* — Rotating placeholders — */
    let phIdx = 0;
    function cyclePlaceholder() {
        input.classList.add('placeholder-fade');
        setTimeout(() => {
            phIdx = (phIdx + 1) % SUGGEST_PLACEHOLDERS.length;
            input.placeholder = SUGGEST_PLACEHOLDERS[phIdx];
            input.classList.remove('placeholder-fade');
        }, 300);
    }
    input.placeholder = SUGGEST_PLACEHOLDERS[0];
    const phTimer = setInterval(cyclePlaceholder, 3200);
    input.addEventListener('focus', () => clearInterval(phTimer));

    /* — Submit — */
    form.addEventListener('submit', ev => {
        ev.preventDefault();
        const val = input.value.trim();
        if (!val) { input.focus(); return; }
        saveSuggestion(val);
        form.innerHTML = `<p class="suggest-thanks">¡Gracias! Tu sugerencia fue guardada 🙌</p>`;
    });
}

/* ─── PROGRESS BAR ─── */
function initProgressBar() {
    const fill = document.querySelector('.progress-fill');
    if (!fill) return;
    const pct = parseInt(fill.dataset.pct) || 0;
    new IntersectionObserver(([e], obs) => {
        if (!e.isIntersecting) return;
        fill.style.width = pct + '%';
        obs.disconnect();
    }, { threshold: 0.5 }).observe(fill);
}

/* ─── BETA ACCESS ─── */
// MVP URL — reemplazá con la URL real de tu deploy
const BETA_URL  = 'https://akila-web-mvp.vercel.app';
// Hash SHA-256 de tu contraseña — generalo con el comando del README
// y reemplazá este string. NUNCA pongas la contraseña en texto plano.
const BETA_HASH = 'e791ef1e2734943f36037baa85a4fb9dc547538a2d4409b78e71a8725ecd4328';

async function sha256(text) {
    const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function initBetaAccess() {
    const trigger = document.getElementById('beta-trigger');
    const form    = document.getElementById('beta-form');
    const input   = document.getElementById('beta-pwd');
    const errEl   = document.getElementById('beta-err');
    if (!trigger || !form) return;

    trigger.addEventListener('click', () => openModal('modal-beta'));

    form.addEventListener('submit', async ev => {
        ev.preventDefault();
        errEl.textContent = '';
        const hash = await sha256(input.value);
        if (hash === BETA_HASH) {
            window.location.href = BETA_URL;
        } else {
            errEl.textContent = 'Contraseña incorrecta.';
            input.value = '';
            input.focus();
        }
    });

    input.addEventListener('input', () => { errEl.textContent = ''; });
}

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initModals();
    initHeroForm();
    initWaitlistForm();
    initFadeIn();
    initCounters();
    initScroll();
    initHeroEntrance();
    initSuggestForm();
    initSurvey();
    initProgressBar();
    initBetaAccess();
});

/* ─── HERO ENTRANCE ─── */
function initHeroEntrance() {
    // No animar si el usuario prefiere movimiento reducido
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const hero = document.querySelector('.hero');
    if (!hero) return;

    // Pequeño delay para que el browser pinte primero
    requestAnimationFrame(() => {
        setTimeout(() => {
            document.body.classList.add('hero-animated');
        }, 80);
    });
}
