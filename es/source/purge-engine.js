(() => {
  "use strict";

  const EXISTING = document.getElementById("fa-purge-root");
  if (EXISTING) {
    EXISTING.remove();
    return;
  }

  const state = {
    running: false,
    cancelled: false,
    username: "",
    userId: null,
    posts: new Map(),
    topicStarters: [],
    replies: [],
    failures: [],
    profileUrl: "",
    profileDetails: [],
    externalUrls: new Set(),
    evidence: [],
    deletionResults: [],
    reportDownloaded: false
  };

  const root = document.createElement("div");
  root.id = "fa-purge-root";
  const rootMarkup = `
    <style>
      #fa-purge-root{all:initial;position:fixed;z-index:2147483647;inset:0;
        background:rgba(15,20,27,.68);display:flex;align-items:center;
        justify-content:center;font-family:Arial,sans-serif;color:#20242a}
      #fa-purge-root *{box-sizing:border-box}
      #fa-purge-panel{width:min(680px,calc(100vw - 28px));max-height:calc(100vh - 28px);
        overflow:auto;background:#fff;border-radius:12px;box-shadow:0 16px 60px #0008}
      #fa-purge-head{display:flex;align-items:center;justify-content:space-between;
        padding:17px 20px;color:#fff;background:#1769aa;border-radius:12px 12px 0 0}
      #fa-purge-head h2{margin:0;font:700 20px Arial,sans-serif;color:#fff}
      #fa-purge-close{border:0;background:transparent;color:#fff;font-size:26px;
        cursor:pointer;line-height:1}
      #fa-purge-body{padding:20px}
      #fa-purge-body label{display:block;margin:0 0 6px;font-weight:700}
      #fa-purge-user,#fa-purge-confirm{display:block;width:100%;padding:10px 11px;
        border:1px solid #aab2bd;border-radius:6px;font:14px Arial,sans-serif}
      #fa-purge-note{margin:8px 0 15px;color:#555;font-size:13px}
      #fa-purge-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}
      #fa-purge-actions button{padding:10px 14px;border:0;border-radius:6px;
        cursor:pointer;font-weight:700}
      #fa-purge-scan{color:#fff;background:#1769aa}
      #fa-purge-delete{color:#fff;background:#b3261e}
      #fa-purge-report{color:#fff;background:#26734d}
      #fa-purge-cancel{color:#222;background:#e4e7eb}
      #fa-purge-actions button:disabled{opacity:.5;cursor:not-allowed}
      #fa-purge-summary{display:none;margin:16px 0 0;padding:13px;border-radius:7px;
        background:#f0f4f8;border:1px solid #ccd6e0}
      #fa-purge-warning{display:none;margin:13px 0;padding:12px;border-radius:7px;
        color:#6d1a15;background:#fff0ef;border:1px solid #e3a19c;font-weight:700}
      #fa-purge-log{height:155px;margin-top:14px;padding:10px;overflow:auto;
        white-space:pre-wrap;border:1px solid #ccd2d8;border-radius:6px;
        background:#111820;color:#d7e2ec;font:12px/1.45 Consolas,monospace}
      #fa-purge-progress{width:100%;height:12px;margin-top:14px}
    </style>
    <section id="fa-purge-panel" role="dialog" aria-modal="true" aria-labelledby="fa-purge-title">
      <header id="fa-purge-head">
        <h2 id="fa-purge-title">Administración de spam · Foroactivo</h2>
        <button id="fa-purge-close" type="button" title="Cerrar">×</button>
      </header>
      <div id="fa-purge-body">
        <label for="fa-purge-user">Nombre exacto del usuario</label>
        <input id="fa-purge-user" type="text" autocomplete="off">
        <p id="fa-purge-note">Primero se realizará un análisis sin borrar nada.</p>
        <div id="fa-purge-actions">
          <button id="fa-purge-scan" type="button">Analizar mensajes</button>
          <button id="fa-purge-cancel" type="button" disabled>Cancelar proceso</button>
        </div>
        <div id="fa-purge-summary"></div>
        <div id="fa-purge-warning">
          Esta operación es irreversible. Se borrarán completos los temas iniciados
          por el usuario, incluidas las respuestas de otras personas.
        </div>
        <div id="fa-purge-report-wrap" hidden>
          <div id="fa-purge-actions">
            <button id="fa-purge-report" type="button">Descargar informe previo obligatorio</button>
          </div>
        </div>
        <div id="fa-purge-confirm-wrap" hidden>
          <label for="fa-purge-confirm">Para confirmar, escribe BORRAR <span></span></label>
          <input id="fa-purge-confirm" type="text" autocomplete="off">
          <div id="fa-purge-actions">
            <button id="fa-purge-delete" type="button" disabled>Eliminar definitivamente</button>
          </div>
        </div>
        <progress id="fa-purge-progress" value="0" max="1"></progress>
        <div id="fa-purge-log" aria-live="polite">Herramienta preparada. No se ha borrado nada.</div>
      </div>
    </section>`;
  const rootDocument = new DOMParser().parseFromString(rootMarkup, "text/html");
  const rootStyle = rootDocument.head.querySelector("style") || rootDocument.body.querySelector("style");
  const rootPanel = rootDocument.body.querySelector("#fa-purge-panel");
  if (rootStyle) root.appendChild(document.importNode(rootStyle, true));
  if (rootPanel) root.appendChild(document.importNode(rootPanel, true));
  document.documentElement.appendChild(root);

  const $ = (selector) => root.querySelector(selector);
  const ui = {
    close: $("#fa-purge-close"),
    user: $("#fa-purge-user"),
    scan: $("#fa-purge-scan"),
    cancel: $("#fa-purge-cancel"),
    summary: $("#fa-purge-summary"),
    warning: $("#fa-purge-warning"),
    reportWrap: $("#fa-purge-report-wrap"),
    report: $("#fa-purge-report"),
    confirmWrap: $("#fa-purge-confirm-wrap"),
    confirmLabel: $("#fa-purge-confirm-wrap span"),
    confirm: $("#fa-purge-confirm"),
    remove: $("#fa-purge-delete"),
    progress: $("#fa-purge-progress"),
    log: $("#fa-purge-log")
  };

  function log(message) {
    const time = new Date().toLocaleTimeString();
    ui.log.textContent += `\n[${time}] ${message}`;
    ui.log.scrollTop = ui.log.scrollHeight;
  }

  function setBusy(busy) {
    state.running = busy;
    ui.scan.disabled = busy;
    ui.user.disabled = busy;
    ui.cancel.disabled = !busy;
    ui.close.disabled = busy;
    ui.report.disabled = busy;
    if (!busy) ui.remove.disabled = !state.reportDownloaded || !confirmationIsValid();
  }

  function confirmationIsValid() {
    const normalize = value => String(value)
      .normalize("NFKC")
      .replace(/[\s\u00a0\u202f]+/g, " ")
      .trim()
      .toLocaleLowerCase("es-ES");
    return normalize(ui.confirm.value) === normalize(`BORRAR ${state.username}`);
  }

  function safeFilePart(value) {
    return value.replace(/[^a-z0-9_-]+/gi, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "usuario";
  }

  function canonicalProfileUrl(userId) {
    return userId ? `${location.origin}/u${userId}` : "";
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function downloadText(filename, content) {
    const blob = new Blob(["\ufeff", content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.documentElement.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }

  function absolute(url) {
    return new URL(url, location.origin).href;
  }

  function sameOrigin(url) {
    try { return new URL(url, location.origin).origin === location.origin; }
    catch (_) { return false; }
  }

  async function request(url, options = {}) {
    if (state.cancelled) throw new Error("Proceso cancelado.");
    if (!sameOrigin(url)) throw new Error("Se bloqueó una dirección externa.");
    const response = await fetch(absolute(url), {
      credentials: "include",
      redirect: "follow",
      cache: "no-store",
      ...options
    });
    if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
    return response;
  }

  async function getDocument(url) {
    const response = await request(url);
    const text = await response.text();
    const doc = new DOMParser().parseFromString(text, "text/html");
    return { doc, url: response.url, text };
  }

  function detectLogin(doc) {
    return !!doc.querySelector(
      'form[action*="login"], input[name="username"] + input[name="password"], input[name="password"]'
    );
  }

  function normalizeName(value) {
    return value.replace(/\s+/g, " ").trim().toLocaleLowerCase();
  }

  function usernameFromProfileLink(link) {
    const clone = link.cloneNode(true);
    clone.querySelectorAll("i,svg,img,.group-icon,.material-icons").forEach(node => node.remove());
    return normalizeName(clone.textContent || "");
  }

  function extractUserId(doc, username) {
    const wanted = normalizeName(username);
    for (const link of doc.querySelectorAll('a[href*="/u"],a[href*="profile?mode=viewprofile"]')) {
      if (usernameFromProfileLink(link) !== wanted) continue;
      const href = link.getAttribute("href") || "";
      const match = href.match(/\/u(\d+)\b|[?&]u=(\d+)\b/i);
      if (match) return Number(match[1] || match[2]);
    }
    return null;
  }

  function findProfileUrl(doc, username) {
    const wanted = normalizeName(username);
    for (const link of doc.querySelectorAll('a[href*="/u"],a[href*="profile?mode=viewprofile"]')) {
      if (usernameFromProfileLink(link) !== wanted) continue;
      return absolute(link.getAttribute("href"));
    }
    return "";
  }

  function extractIdentityFromPost(doc, postId, username) {
    const wanted = normalizeName(username);
    const target = findTargetContainer(doc, postId);
    const scopes = [target, doc].filter(Boolean);
    for (const scope of scopes) {
      const links = scope.querySelectorAll('a[href*="/u"],a[href*="profile?mode=viewprofile"]');
      for (const link of links) {
        const href = link.getAttribute("href") || "";
        const match = href.match(/\/u(\d+)\b|[?&]u=(\d+)\b/i);
        if (!match) continue;
        const linkName = usernameFromProfileLink(link) || normalizeName(link.getAttribute("title") || "");
        if (linkName === wanted || (target && links.length === 1)) {
          return {
            userId: Number(match[1] || match[2]),
            profileUrl: absolute(href)
          };
        }
      }
      if (target) break;
    }
    return null;
  }

  function extractProfileDetails(doc) {
    const main = doc.querySelector(
      "#profile-advanced-details, .profile, .profile-view, #page-body, main"
    ) || doc.body;
    if (!main) return [];
    const clone = main.cloneNode(true);
    clone.querySelectorAll("script,style,noscript,nav,form").forEach(node => node.remove());
    const seen = new Set();
    return (clone.innerText || clone.textContent || "")
      .split(/\n+/)
      .map(line => line.replace(/\s+/g, " ").trim())
      .filter(line => line.length >= 2 && line.length <= 300)
      .filter(line => {
        const key = line.toLocaleLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 60);
  }

  function postIdFromUrl(href) {
    const patterns = [
      /#p(\d+)\b/i,
      /#(\d+)\b/i,
      /[?&]p=(\d+)\b/i,
      /\/p(\d+)(?:-|$)/i,
      /t\d+p(\d+)-/i
    ];
    for (const pattern of patterns) {
      const match = href.match(pattern);
      if (match) return Number(match[1]);
    }
    return null;
  }

  function topicIdFromUrl(href) {
    const match = href.match(/\/t(\d+)(?:p\d+)?(?:-|$)|[?&]t=(\d+)\b/i);
    return match ? Number(match[1] || match[2]) : null;
  }

  function pageOffset(url) {
    try {
      const parsed = new URL(url, location.origin);
      const start = Number(parsed.searchParams.get("start"));
      if (Number.isFinite(start) && start > 0) return start;
      const match = parsed.pathname.match(/-(\d+)(?:\.html)?$/);
      return match ? Number(match[1]) : 0;
    } catch (_) { return 0; }
  }

  function pageKey(url) {
    try {
      const parsed = new URL(url, location.origin);
      parsed.hash = "";
      return parsed.href;
    } catch (_) { return url; }
  }

  function sameSearchSeries(currentUrl, candidateUrl) {
    try {
      const current = new URL(currentUrl, location.origin);
      const candidate = new URL(candidateUrl, location.origin);
      if (candidate.origin !== current.origin) return false;

      const friendly = path => path.replace(/\/(\d+)\/?$/, "").replace(/\/$/, "");
      if (/^\/(?:spa|sta)\//i.test(current.pathname)) {
        return friendly(candidate.pathname) === friendly(current.pathname);
      }
      if (current.pathname === "/search") {
        return candidate.pathname === "/search" &&
          candidate.searchParams.get("search_author") === current.searchParams.get("search_author") &&
          candidate.searchParams.get("show_results") === current.searchParams.get("show_results");
      }
      return candidate.pathname === current.pathname;
    } catch (_) { return false; }
  }

  function collectPostLinks(doc) {
    const found = [];
    const known = new Set();
    for (const link of doc.querySelectorAll("a[href]")) {
      const href = absolute(link.getAttribute("href"));
      const postId = postIdFromUrl(href);
      const topicId = topicIdFromUrl(href);
      if (!postId || !topicId) continue;
      if (known.has(postId)) continue;
      known.add(postId);
      found.push({ postId, topicId, url: href });
    }

    for (const node of doc.querySelectorAll('[id^="p"], [name^="p"]')) {
      const identity = node.id || node.getAttribute("name") || "";
      const match = identity.match(/^p(\d+)$/i);
      if (!match) continue;
      const postId = Number(match[1]);
      if (known.has(postId)) continue;
      const container = node.closest(".post, .postbody, .post-container, li, table, .search") || node.parentElement;
      const topicLink = container && [...container.querySelectorAll("a[href]")]
        .find(link => topicIdFromUrl(link.getAttribute("href") || ""));
      if (!topicLink) continue;
      const href = absolute(topicLink.getAttribute("href"));
      const topicId = topicIdFromUrl(href);
      if (!topicId) continue;
      known.add(postId);
      found.push({ postId, topicId, url: `${href.split("#")[0]}#${postId}` });
    }
    return found;
  }

  function collectStartedTopicLinks(doc) {
    const found = new Map();
    const selectors = [
      "a.topictitle[href]",
      "a.topic-title[href]",
      ".search a[href]",
      ".search-results a[href]",
      ".topiclist a[href]",
      "h2 a[href]",
      "h3 a[href]"
    ];
    let links = doc.querySelectorAll(selectors.join(","));
    if (!links.length) links = doc.querySelectorAll("a[href]");
    for (const link of links) {
      const href = absolute(link.getAttribute("href"));
      const topicId = topicIdFromUrl(href);
      if (topicId && !found.has(topicId)) found.set(topicId, { topicId, url: href });
    }
    return [...found.values()];
  }

  function collectExternalUrls(container) {
    const urls = new Set();
    if (!container) return [];
    for (const link of container.querySelectorAll("a[href]")) {
      try {
        const parsed = new URL(link.getAttribute("href"), location.origin);
        if (!/^https?:$/.test(parsed.protocol) || parsed.origin === location.origin) continue;
        urls.add(parsed.href);
      } catch (_) { /* enlace no válido */ }
    }
    const text = container.textContent || "";
    const matches = text.match(/https?:\/\/[^\s<>"']+/gi) || [];
    for (let value of matches) {
      value = value.replace(/[),.;!?\]]+$/g, "");
      try {
        const parsed = new URL(value);
        if (parsed.origin !== location.origin) urls.add(parsed.href);
      } catch (_) { /* texto parecido a URL, pero no válido */ }
    }
    return [...urls];
  }

  function buildReport(finalReport) {
    const now = new Date();
    const lines = [
      "REGISTRO DE SPAM · FOROACTIVO",
      "================================",
      `Tipo: ${finalReport ? "resultado final" : "informe previo al borrado"}`,
      `Fecha local: ${now.toLocaleString()}`,
      `Fecha ISO: ${now.toISOString()}`,
      `Foro: ${location.origin}`,
      `IDENTIFICADOR PRINCIPAL: ${canonicalProfileUrl(state.userId) || state.profileUrl || "no localizado"}`,
      `NOMBRE DE USUARIO: ${state.username}`,
      `ID NUMÉRICA: ${state.userId || "no localizada"}`,
      `Mensajes encontrados: ${state.posts.size}`,
      `Temas iniciados: ${state.topicStarters.length}`,
      `Respuestas en temas ajenos: ${state.replies.length}`,
      `URL externas únicas: ${state.externalUrls.size}`,
      "",
      "DATOS VISIBLES DEL PERFIL",
      "--------------------------",
      ...(state.profileDetails.length ? state.profileDetails : ["No se pudieron extraer datos visibles."]),
      "",
      "URL EXTERNAS PUBLICADAS",
      "-----------------------",
      ...([...state.externalUrls].length ? [...state.externalUrls].sort() : ["No se localizaron URL externas."]),
      "",
      "PUBLICACIONES LOCALIZADAS",
      "-------------------------"
    ];
    for (const item of state.evidence) {
      lines.push(
        `[${item.kind}] p${item.postId} · t${item.topicId}`,
        `Página: ${item.url}`,
        `Título: ${item.title || "sin título"}`,
        `URL externas: ${item.externalUrls.length ? item.externalUrls.join(" | ") : "ninguna"}`,
        ""
      );
    }
    if (finalReport) {
      lines.push("RESULTADO DEL BORRADO", "---------------------");
      if (!state.deletionResults.length) lines.push("No se ejecutó ninguna eliminación.");
      for (const result of state.deletionResults) {
        lines.push(
          `${result.ok ? "ELIMINADO" : "ERROR"} · p${result.postId} · t${result.topicId}`,
          result.detail,
          ""
        );
      }
      if (state.cancelled) lines.push("Proceso cancelado por el usuario.");
    }
    lines.push(
      "NOTA",
      "----",
      "Este archivo se generó localmente. No contiene cookies, contraseñas ni claves de sesión.",
      "Las URL pueden copiarse en la herramienta oficial de Foroactivo para denunciar el spam."
    );
    return lines.join("\r\n");
  }

  function renderSummary() {
    ui.summary.replaceChildren();

    const heading = document.createElement("strong");
    heading.textContent = "Análisis terminado";
    ui.summary.appendChild(heading);

    const addLine = (label, value) => {
      const line = document.createElement("div");
      const labelNode = document.createTextNode(`${label}: `);
      const valueNode = document.createElement("b");
      valueNode.textContent = String(value);
      line.append(labelNode, valueNode);
      ui.summary.appendChild(line);
    };

    addLine("Usuario", state.username);
    addLine("Identificador", canonicalProfileUrl(state.userId) || state.profileUrl || "no localizado");
    addLine("Temas iniciados por el usuario", state.topicStarters.length);
    addLine("Respuestas del usuario en temas ajenos", state.replies.length);
    addLine("Mensajes encontrados", state.posts.size);
    addLine("URL externas encontradas", state.externalUrls.size);

    if (state.failures.length) {
      const warning = document.createElement("div");
      warning.style.color = "#a12222";
      warning.textContent = `Comprobaciones dudosas: ${state.failures.length}`;
      ui.summary.appendChild(warning);
    }
  }

  function findNextSearchPage(doc, currentUrl) {
    const currentOffset = pageOffset(currentUrl);
    let candidate = null;
    let candidateOffset = Infinity;
    const selectors = [
      'a[rel="next"][href]',
      'a[href*="start="]',
      '.pagination a[href]',
      '.pag-img a[href]',
      '.pagination span a[href]',
      'a[href^="/spa/"]',
      'a[href^="/sta/"]'
    ];
    for (const link of doc.querySelectorAll(selectors.join(","))) {
      const href = absolute(link.getAttribute("href"));
      if (!sameSearchSeries(currentUrl, href)) continue;
      const offset = pageOffset(href);
      if (offset > currentOffset && offset < candidateOffset) {
        candidate = href;
        candidateOffset = offset;
      }
    }
    return candidate;
  }

  async function walkSearchPages(firstPage, label, collector) {
    const visited = new Set();
    let page = firstPage;
    for (let count = 0; count < 1000 && page; count++) {
      const key = pageKey(page.url);
      if (visited.has(key)) break;
      visited.add(key);
      collector(page.doc);
      log(`${label} ${count + 1}: ${state.posts.size} mensajes únicos localizados.`);
      const next = findNextSearchPage(page.doc, page.url);
      page = next && !visited.has(pageKey(next)) ? await getDocument(next) : null;
    }
  }

  async function resolveSearchUrl(username) {
    const candidates = [
      `/spa/${encodeURIComponent(username)}`,
      `/search?search_author=${encodeURIComponent(username)}&show_results=posts`,
      `/search?mode=searchuser&search_author=${encodeURIComponent(username)}&show_results=posts`
    ];
    const diagnostics = [];
    for (const candidate of candidates) {
      const result = await getDocument(candidate);
      if (detectLogin(result.doc)) throw new Error("La sesión del foro no está iniciada.");
      const messages = collectPostLinks(result.doc);
      const topics = [...result.doc.querySelectorAll("a[href]")]
        .filter(link => topicIdFromUrl(link.getAttribute("href") || "")).length;
      diagnostics.push(`${candidate}: ${messages.length} mensajes, ${topics} enlaces de tema`);
      if (messages.length || extractUserId(result.doc, username)) return result;
    }
    throw new Error(
      "Foroactivo no devolvió mensajes reconocibles. Diagnóstico: " +
      diagnostics.join(" | ")
    );
  }

  async function resolveStartedTopicsUrl(username) {
    const candidates = [
      `/sta/${encodeURIComponent(username)}`,
      `/search?search_author=${encodeURIComponent(username)}&show_results=topics`,
      `/search?mode=searchuser&search_author=${encodeURIComponent(username)}&show_results=topics`
    ];
    for (const candidate of candidates) {
      const result = await getDocument(candidate);
      if (detectLogin(result.doc)) throw new Error("La sesión del foro no está iniciada.");
      if (collectStartedTopicLinks(result.doc).length) return result;
    }
    return null;
  }

  async function scan() {
    state.cancelled = false;
    state.posts.clear();
    state.topicStarters = [];
    state.replies = [];
    state.failures = [];
    state.profileUrl = "";
    state.profileDetails = [];
    state.externalUrls = new Set();
    state.evidence = [];
    state.deletionResults = [];
    state.reportDownloaded = false;
    state.username = ui.user.value.trim();
    if (!state.username) throw new Error("Escribe el nombre exacto del usuario.");

    ui.summary.style.display = "none";
    ui.warning.style.display = "none";
    ui.confirmWrap.hidden = true;
    ui.reportWrap.hidden = true;
    ui.progress.value = 0;
    setBusy(true);
    log(`Buscando mensajes de “${state.username}”…`);

    let page = await resolveSearchUrl(state.username);
    state.userId = extractUserId(page.doc, state.username);
    state.profileUrl = findProfileUrl(page.doc, state.username);
    if (state.userId) state.profileUrl = canonicalProfileUrl(state.userId);
    if (state.profileUrl) {
      try {
        const profile = await getDocument(state.profileUrl);
        state.profileDetails = extractProfileDetails(profile.doc);
      } catch (error) {
        state.failures.push(`Perfil: ${error.message}`);
      }
    }
    await walkSearchPages(page, "Página de mensajes", doc => {
      for (const post of collectPostLinks(doc)) state.posts.set(post.postId, post);
    });

    log("Buscando también todos los temas iniciados por el usuario…");
    const startedTopics = new Map();
    const topicSearch = await resolveStartedTopicsUrl(state.username);
    if (topicSearch) {
      await walkSearchPages(topicSearch, "Página de temas", doc => {
        for (const topic of collectStartedTopicLinks(doc)) startedTopics.set(topic.topicId, topic);
      });
    }

    for (const topic of startedTopics.values()) {
      try {
        const topicPage = await getDocument(`/t${topic.topicId}-`);
        const ids = [...topicPage.doc.querySelectorAll('[id^="p"]')]
          .map(node => Number((node.id.match(/^p(\d+)$/) || [])[1]))
          .filter(Boolean);
        const firstPostId = ids[0] || collectPostLinks(topicPage.doc)[0]?.postId || null;
        if (!firstPostId) continue;
        const identity = extractIdentityFromPost(topicPage.doc, firstPostId, state.username);
        if (!identity) continue;
        if (state.userId && identity.userId !== state.userId) continue;
        if (!state.userId) state.userId = identity.userId;
        state.profileUrl = canonicalProfileUrl(state.userId) || identity.profileUrl;
        if (!state.posts.has(firstPostId)) {
          state.posts.set(firstPostId, {
            postId: firstPostId,
            topicId: topic.topicId,
            url: `${absolute(`/t${topic.topicId}-`).split("#")[0]}#p${firstPostId}`
          });
        }
      } catch (error) {
        state.failures.push(`Tema iniciado ${topic.topicId}: ${error.message}`);
      }
    }

    if (!state.posts.size) throw new Error("No se encontraron mensajes para ese usuario.");

    const posts = [...state.posts.values()];
    ui.progress.max = posts.length;
    ui.progress.value = 0;
    log("Comprobando mensajes y recopilando pruebas antes del borrado…");

    const topicFirstPosts = new Map();
    for (const post of posts) {
      if (state.cancelled) throw new Error("Proceso cancelado.");
      if (!topicFirstPosts.has(post.topicId)) {
        try {
          const { doc } = await getDocument(`/t${post.topicId}-`);
          const ids = [...doc.querySelectorAll('[id^="p"]')]
            .map(node => Number((node.id.match(/^p(\d+)$/) || [])[1]))
            .filter(Boolean);
          const links = collectPostLinks(doc).map(item => item.postId);
          const first = ids[0] || links[0] || null;
          topicFirstPosts.set(post.topicId, first);
        } catch (error) {
          topicFirstPosts.set(post.topicId, null);
          state.failures.push(`Tema ${post.topicId}: ${error.message}`);
        }
      }
      if (topicFirstPosts.get(post.topicId) === post.postId) state.topicStarters.push(post);
      else state.replies.push(post);
      try {
        const evidencePage = await getDocument(post.url);
        const container = findTargetContainer(evidencePage.doc, post.postId);
        const identity = extractIdentityFromPost(evidencePage.doc, post.postId, state.username);
        if (identity) {
          if (!state.userId) state.userId = identity.userId;
          state.profileUrl = canonicalProfileUrl(state.userId) || identity.profileUrl;
        }
        const externalUrls = collectExternalUrls(container);
        externalUrls.forEach(url => state.externalUrls.add(url));
        state.evidence.push({
          postId: post.postId,
          topicId: post.topicId,
          url: post.url,
          title: (evidencePage.doc.title || "").replace(/\s+/g, " ").trim(),
          externalUrls,
          kind: topicFirstPosts.get(post.topicId) === post.postId ? "TEMA COMPLETO" : "RESPUESTA"
        });
      } catch (error) {
        state.failures.push(`Prueba p${post.postId}: ${error.message}`);
      }
      ui.progress.value++;
      await new Promise(resolve => setTimeout(resolve, 120));
    }

    if (state.profileUrl && !state.profileDetails.length) {
      try {
        const profile = await getDocument(state.profileUrl);
        state.profileDetails = extractProfileDetails(profile.doc);
      } catch (error) {
        state.failures.push(`Perfil: ${error.message}`);
      }
    }

    renderSummary();
    ui.summary.style.display = "block";
    ui.warning.style.display = "block";
    ui.reportWrap.hidden = false;
    ui.report.textContent = "Descargar informe previo obligatorio";
    ui.confirmLabel.textContent = state.username;
    ui.confirm.value = "";
    ui.confirmWrap.hidden = false;
    setBusy(false);
    log("Análisis terminado. Descarga el informe previo antes de habilitar el borrado.");
  }

  function findTargetContainer(doc, postId) {
    const direct = doc.getElementById(`p${postId}`);
    if (direct) return direct.closest(".post, .postbody, .post-container, li, table") || direct;
    const anchor = doc.querySelector(
      `[name="p${postId}"],a[href$="#p${postId}"],a[href$="#${postId}"]`
    );
    return anchor ? (anchor.closest(".post, .postbody, .post-container, li, table") || anchor.parentElement) : null;
  }

  function findDeleteUrl(doc, postId) {
    const container = findTargetContainer(doc, postId);
    const scopes = [container, doc].filter(Boolean);
    const selectors = [
      'a[href*="mode=delete"][href*="p="]',
      'a[href*="/post"][href*="delete"]',
      'a[href*="delete"][href*="p="]'
    ];
    for (const scope of scopes) {
      for (const selector of selectors) {
        for (const link of scope.querySelectorAll(selector)) {
          const href = absolute(link.getAttribute("href"));
          const id = postIdFromUrl(href);
          if (!id || id === postId) return href;
        }
      }
    }
    return null;
  }

  function formDataFrom(form) {
    const data = new URLSearchParams();
    for (const field of form.elements) {
      if (!field.name || field.disabled) continue;
      if ((field.type === "checkbox" || field.type === "radio") && !field.checked) continue;
      if (field.type === "submit" && !/confirm|yes|delete|supprimer|eliminar/i.test(field.name + " " + field.value)) continue;
      data.append(field.name, field.value);
    }
    return data;
  }

  async function deletePost(post) {
    const topicPage = await getDocument(`/t${post.topicId}-#p${post.postId}`);
    if (detectLogin(topicPage.doc)) throw new Error("La sesión ha caducado.");
    const deleteUrl = findDeleteUrl(topicPage.doc, post.postId);
    if (!deleteUrl) throw new Error("No aparece la acción nativa de eliminar; revisa los permisos.");

    const confirmation = await getDocument(deleteUrl);
    if (detectLogin(confirmation.doc)) throw new Error("La sesión ha caducado.");
    const form = confirmation.doc.querySelector(
      'form[action*="mode=delete"], form[action*="/post"], form[action*="delete"]'
    );
    if (!form) throw new Error("No se encontró el formulario de confirmación de Foroactivo.");

    const action = absolute(form.getAttribute("action") || confirmation.url);
    const method = (form.getAttribute("method") || "post").toUpperCase();
    const data = formDataFrom(form);
    let hasConfirmationField = false;
    data.forEach((value, key) => {
      if (/confirm|delete|mode/i.test(key)) hasConfirmationField = true;
    });
    if (!hasConfirmationField) {
      data.append("confirm", "Sí");
    }
    let destination = action;
    let body;
    if (method === "GET") {
      const separator = destination.includes("?") ? "&" : "?";
      destination += separator + data.toString();
    } else {
      body = data;
    }
    const response = await request(destination, {
      method,
      body,
      referrer: confirmation.url.split("#")[0]
    });
    const text = await response.text();
    if (/not authorised|no est[aá]s autorizado|no tienes permiso|hacking attempt/i.test(text)) {
      throw new Error("Foroactivo rechazó la eliminación.");
    }
    const resultDoc = new DOMParser().parseFromString(text, "text/html");
    const repeatedConfirmation = resultDoc.querySelector(
      'form[action*="mode=delete"], form[action*="/post"][action*="delete"]'
    );
    if (repeatedConfirmation) {
      throw new Error(
        `Foroactivo devolvió otra vez la confirmación sin borrar. Destino: ${response.url}`
      );
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    const verificationResponse = await fetch(absolute(post.url), {
      credentials: "include",
      redirect: "follow",
      cache: "no-store"
    });
    if (verificationResponse.status === 404 || verificationResponse.status === 410) {
      return;
    }
    if (!verificationResponse.ok) {
      throw new Error(`No se pudo verificar el borrado: HTTP ${verificationResponse.status}`);
    }
    const verificationText = await verificationResponse.text();
    const verification = {
      doc: new DOMParser().parseFromString(verificationText, "text/html"),
      text: verificationText,
      url: verificationResponse.url
    };
    if (detectLogin(verification.doc)) throw new Error("La sesión ha caducado durante la comprobación.");
    const targetStillExists =
      !!verification.doc.getElementById(`p${post.postId}`) ||
      !!verification.doc.querySelector(`[name="p${post.postId}"]`) ||
      !!verification.doc.querySelector(`a[href$="#p${post.postId}"],a[href$="#${post.postId}"]`) ||
      new RegExp(`(?:id|name)=["']p${post.postId}["']`, "i").test(verification.text);
    if (targetStillExists) {
      const pageTitle = (resultDoc.title || "sin título").replace(/\s+/g, " ").trim();
      throw new Error(
        `Foroactivo respondió, pero p${post.postId} continúa visible. ` +
        `Respuesta: ${response.url} · ${pageTitle}`
      );
    }
  }

  async function removeAll() {
    state.cancelled = false;
    state.failures = [];
    state.deletionResults = [];
    setBusy(true);
    ui.remove.disabled = true;

    const topics = [...state.topicStarters];
    const topicIds = new Set(topics.map(item => item.topicId));
    const replies = state.replies.filter(item => !topicIds.has(item.topicId));
    const queue = [...topics, ...replies];
    ui.progress.max = queue.length || 1;
    ui.progress.value = 0;
    log(`Comienza el borrado de ${topics.length} temas completos y ${replies.length} respuestas.`);

    for (let index = 0; index < queue.length; index++) {
      if (state.cancelled) break;
      const item = queue[index];
      try {
        await deletePost(item);
        state.deletionResults.push({
          ok: true,
          postId: item.postId,
          topicId: item.topicId,
          detail: "Foroactivo confirmó la desaparición del contenido."
        });
        log(`${index + 1}/${queue.length}: eliminado p${item.postId}.`);
      } catch (error) {
        state.failures.push(`p${item.postId}: ${error.message}`);
        state.deletionResults.push({
          ok: false,
          postId: item.postId,
          topicId: item.topicId,
          detail: error.message
        });
        log(`${index + 1}/${queue.length}: ERROR en p${item.postId}: ${error.message}`);
        if (/sesión ha caducado/i.test(error.message)) break;
      }
      ui.progress.value = index + 1;
      await new Promise(resolve => setTimeout(resolve, 850));
    }

    setBusy(false);
    ui.remove.disabled = true;
    if (state.cancelled) {
      log("Proceso detenido por el usuario.");
    } else if (state.failures.length) {
      log(`Proceso terminado con ${state.failures.length} elementos sin eliminar. Revisa el registro.`);
    } else {
      log("Proceso terminado sin errores detectados.");
    }
    downloadText(
      `foroactivo-spam-${safeFilePart(state.username)}-registro-final.txt`,
      buildReport(true)
    );
    ui.report.textContent = "Descargar nuevamente el registro final";
  }

  ui.close.addEventListener("click", () => { if (!state.running) root.remove(); });
  ui.cancel.addEventListener("click", () => {
    state.cancelled = true;
    ui.cancel.disabled = true;
    log("Cancelación solicitada; se detendrá al finalizar la operación actual.");
  });
  ui.confirm.addEventListener("input", () => {
    ui.remove.disabled = state.running || !state.reportDownloaded || !confirmationIsValid();
  });
  ui.report.addEventListener("click", () => {
    const finalReport = state.deletionResults.length > 0;
    downloadText(
      `foroactivo-spam-${safeFilePart(state.username)}-${finalReport ? "registro-final" : "informe-previo"}.txt`,
      buildReport(finalReport)
    );
    if (!finalReport) {
      state.reportDownloaded = true;
      ui.remove.disabled = state.running || !confirmationIsValid();
      log("Informe previo descargado. Ya puedes confirmar el borrado.");
    }
  });
  ui.scan.addEventListener("click", async () => {
    try { await scan(); }
    catch (error) {
      log(`ERROR: ${error.message}`);
      setBusy(false);
    }
  });
  ui.remove.addEventListener("click", async () => {
    if (!state.reportDownloaded || !confirmationIsValid()) return;
    await removeAll();
  });
  ui.user.focus();
})();
