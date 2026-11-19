const STORAGE_KEY = "kek-study-state-v1";
const WASPAL_ARTICLES = new Set([
  "pp-40-2021|Pasal 2",
  "pp-40-2021|Pasal 29",
  "pp-40-2021|Pasal 30",
  "pp-40-2021|Pasal 58",
  "pp-40-2021|Pasal 59",
  "pp-40-2021|Pasal 71",
  "pp-40-2021|Pasal 73",
  "pp-40-2021|Pasal 89",
  "pp-71-2021|Pasal 5",
  "pp-71-2021|Pasal 6",
  "pp-28-2025|Pasal 2",
  "pp-28-2025|Pasal 4",
  "pp-28-2025|Pasal 8",
  "pp-28-2025|Pasal 14"
]);

const elements = {
  status: document.querySelector("#app-status"),
  progressLabel: document.querySelector("#progress-label"),
  progressBar: document.querySelector("#progress-bar"),
  progressDetail: document.querySelector("#progress-detail"),
  homeProgressLabel: document.querySelector("#home-progress-label"),
  homeProgressBar: document.querySelector("#home-progress-bar"),
  homeProgressDetail: document.querySelector("#home-progress-detail"),
  progressReadCount: document.querySelector("#progress-read-count"),
  progressCheckedCount: document.querySelector("#progress-checked-count"),
  progressTrackCount: document.querySelector("#progress-track-count"),
  lastRead: document.querySelector("#last-read"),
  completedArticles: document.querySelector("#completed-articles"),
  regulationFilter: document.querySelector("#regulation-filter"),
  topicFilter: document.querySelector("#topic-filter"),
  progressQuizCount: document.querySelector("#progress-quiz-count"),
  trackFilter: document.querySelector("#track-filter"),
  search: document.querySelector("#article-search"),
  routeNote: document.querySelector("#route-note"),
  visibleCount: document.querySelector("#visible-count"),
  articleList: document.querySelector("#article-list"),
  trackCards: document.querySelector("#track-cards"),
  sourceList: document.querySelector("#source-list"),
  reader: document.querySelector("#reader"),
  trackBuilder: document.querySelector("#track-builder"),
  trackBuilderToggle: document.querySelector("#build-track-toggle"),
  trackBuilderClose: document.querySelector("#build-track-close"),
  trackForm: document.querySelector("#track-form"),
  trackName: document.querySelector("#track-name"),
  trackSearch: document.querySelector("#track-search"),
  trackOptions: document.querySelector("#track-options"),
  trackSelectionCount: document.querySelector("#track-selection-count"),
  indexDetails: document.querySelector("#index-details")
};

let regulations = [];
let articles = [];
let learningContent = { version: "1.0.0", topics: [], articles: {} };
let currentArticle = null;
let articleViewMode = "structured";
let builderSelection = new Set();
let storageNotice = "";
let storageWritable = true;
let state = readState();

function emptyState() {
  return {
    completed: [],
    selfChecked: [],
    quizAnswers: {},
    lastArticle: "",
    activeTrack: "all",
    customTracks: []
  };
}

function readState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return emptyState();
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") throw new Error("Format progres tidak sesuai.");
    return {
      ...emptyState(),
      ...parsed,
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      selfChecked: Array.isArray(parsed.selfChecked) ? parsed.selfChecked : [],
      quizAnswers: (parsed.quizAnswers && typeof parsed.quizAnswers === "object") ? parsed.quizAnswers : {},
      customTracks: Array.isArray(parsed.customTracks) ? parsed.customTracks : []
    };
  } catch (error) {
    storageNotice = `Progres lokal tidak dapat dibaca (${error.message}). Progres baru tidak akan menggantikan data yang rusak.`;
    storageWritable = false;
    return emptyState();
  }
}

function saveState() {
  if (!storageWritable) {
    showStatus(storageNotice);
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (storageNotice.startsWith("Progres lokal tidak dapat disimpan")) {
      storageNotice = "";
    }
  } catch (error) {
    storageNotice = `Progres lokal tidak dapat disimpan (${error.message}). Coba aktifkan penyimpanan situs di browser.`;
    storageWritable = false;
  }
  showStatus(storageNotice);
}

function showStatus(message) {
  elements.status.textContent = message;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[character]);
}

function articleKey(article) {
  return `${article.regulationId}|${article.number}`;
}

function getRegulation(article) {
  return regulations.find((regulation) => regulation.id === article.regulationId);
}

function searchableText(article) {
  const regulation = getRegulation(article);
  const key = articleKey(article);
  const itemContent = learningContent.articles?.[key];
  let learningKeywords = "";
  if (itemContent) {
    const topicNames = (itemContent.topics || [])
      .map((tid) => learningContent.topics?.find((t) => t.id === tid)?.label || "")
      .join(" ");
    const core = itemContent.summary?.core || "";
    const terms = (itemContent.summary?.keyTerms || [])
      .map((t) => `${t.term} ${t.definition}`)
      .join(" ");
    learningKeywords = `${topicNames} ${core} ${terms}`;
  }

  return [
    regulation?.title,
    `PP ${regulation?.number} ${regulation?.year}`,
    article.number,
    article.chapter,
    article.part,
    article.text,
    article.explanation,
    learningKeywords
  ].filter(Boolean).join(" ").toLocaleLowerCase("id");
}

function formatRegulation(regulation) {
  return `PP ${regulation.number} Tahun ${regulation.year}`;
}

function loadArticles(data) {
  if (!Array.isArray(data.regulations) || data.regulations.length === 0) {
    throw new Error("Daftar peraturan kosong atau format datanya tidak sesuai.");
  }

  regulations = data.regulations;
  articles = regulations.flatMap((regulation) => {
    if (!Array.isArray(regulation.chapters)) {
      throw new Error(`${formatRegulation(regulation)} tidak memiliki daftar bab yang valid.`);
    }
    return regulation.chapters.flatMap((chapter) => {
      if (!Array.isArray(chapter.articles)) {
        throw new Error(`${formatRegulation(regulation)} memiliki bab tanpa daftar pasal yang valid.`);
      }
      return chapter.articles.map((article) => ({
        ...article,
        chapter: article.chapter || chapter.title,
        regulationId: regulation.id
      }));
    });
  });

  if (!articles.length) throw new Error("Tidak ada pasal yang dapat ditampilkan.");
}

function fillRegulationFilter() {
  const options = ['<option value="all">Semua peraturan</option>'];
  for (const regulation of regulations) {
    options.push(
      `<option value="${escapeHtml(regulation.id)}">${escapeHtml(formatRegulation(regulation))} · ${escapeHtml(regulation.title)}</option>`
    );
  }
  elements.regulationFilter.innerHTML = options.join("");
}

function fillTopicFilter() {
  if (!elements.topicFilter) return;
  const topics = learningContent.topics || [];
  const options = ['<option value="all">Semua topik</option>'];
  for (const topic of topics) {
    options.push(
      `<option value="${escapeHtml(topic.id)}">${escapeHtml(topic.label)}</option>`
    );
  }
  elements.topicFilter.innerHTML = options.join("");
}

function fillTrackFilter() {
  const selected = state.activeTrack || "all";
  const options = [
    '<option value="all">Gambaran umum</option>',
    '<option value="waspal">Waspal · draf</option>'
  ];
  for (const track of state.customTracks) {
    options.push(`<option value="${escapeHtml(track.id)}">${escapeHtml(track.name)}</option>`);
  }
  elements.trackFilter.innerHTML = options.join("");
  elements.trackFilter.value = options.some((option) => option.includes(`value="${selected}"`))
    ? selected
    : "all";
  state.activeTrack = elements.trackFilter.value;
}

function getVisibleArticles() {
  const regulationId = elements.regulationFilter.value;
  const trackId = elements.trackFilter.value;
  const topicId = elements.topicFilter ? elements.topicFilter.value : "all";
  const query = elements.search.value.trim().toLocaleLowerCase("id");

  return articles.filter((article) => {
    if (regulationId !== "all" && article.regulationId !== regulationId) return false;
    const key = articleKey(article);
    if (trackId === "waspal" && !WASPAL_ARTICLES.has(key)) return false;
    if (trackId !== "all" && trackId !== "waspal") {
      const track = state.customTracks.find((item) => item.id === trackId);
      if (!track || !track.articles.includes(key)) return false;
    }
    if (topicId !== "all") {
      const itemContent = learningContent.articles?.[key];
      if (!itemContent || !Array.isArray(itemContent.topics) || !itemContent.topics.includes(topicId)) {
        return false;
      }
    }
    return !query || searchableText(article).includes(query);
  });
}

function groupByRegulationAndChapter(items) {
  const groups = [];
  for (const regulation of regulations) {
    const regulationArticles = items.filter((article) => article.regulationId === regulation.id);
    if (!regulationArticles.length) continue;

    const chapters = [];
    for (const chapter of regulation.chapters) {
      const chapterArticles = regulationArticles.filter((article) => article.chapter === chapter.title);
      if (chapterArticles.length) {
        chapters.push({ title: chapter.title, articles: chapterArticles });
      }
    }
    groups.push({ regulation, chapters });
  }
  return groups;
}

function renderNavigation() {
  const visible = getVisibleArticles();
  elements.visibleCount.textContent = `${visible.length} pasal`;
  if (!visible.length) {
    elements.articleList.innerHTML = '<p class="empty-list">Tidak ada pasal yang cocok. Coba kata kunci lain atau pilih gambaran umum.</p>';
    return;
  }

  const groups = groupByRegulationAndChapter(visible);
  const hasSearch = Boolean(elements.search.value.trim());
  elements.articleList.innerHTML = groups.map(({ regulation, chapters }) => {
    const regulationArticleCount = chapters.reduce(
      (count, chapter) => count + chapter.articles.length,
      0
    );
    const regulationIsCurrent = currentArticle?.regulationId === regulation.id;

    return `
      <details class="regulation-group" ${regulationIsCurrent || hasSearch ? "open" : ""}>
        <summary>
          <span class="regulation-name" role="heading" aria-level="3">${escapeHtml(formatRegulation(regulation))}</span>
          <span class="regulation-count">${regulationArticleCount}</span>
        </summary>
        <div class="regulation-content">
          <p>${escapeHtml(regulation.title)}</p>
          ${chapters.map((chapter) => {
            const isCurrentChapter = currentArticle?.regulationId === regulation.id
              && currentArticle?.chapter === chapter.title;
            const detailsOpen = isCurrentChapter || hasSearch;
            const chapterTitle = chapter.title || "Pasal utama";
            return `
              <details class="chapter-group" ${detailsOpen ? "open" : ""}>
                <summary>${escapeHtml(chapterTitle)} <span>${chapter.articles.length}</span></summary>
                <div>
                  ${chapter.articles.map((article) => {
                    const key = articleKey(article);
                    const selected = currentArticle && articleKey(currentArticle) === key;
                    const completed = state.completed.includes(key);
                    const itemData = learningContent.articles?.[key];
                    const topicBadges = (itemData && Array.isArray(itemData.topics) && itemData.topics.length)
                      ? `<div class="article-item-tags">${itemData.topics.map((tId) => {
                          const topObj = learningContent.topics?.find((t) => t.id === tId);
                          return topObj ? `<span class="article-list-tag">${escapeHtml(topObj.label.split(" ")[0])}</span>` : "";
                        }).join("")}</div>`
                      : "";
                    return `
                      <button class="step-link" type="button" data-article-key="${escapeHtml(key)}" aria-current="${selected ? "true" : "false"}">
                        <span class="step-number">${escapeHtml(article.number.replace("Pasal ", ""))}</span>
                        <div class="step-label">
                          <span>${escapeHtml(article.number)}</span>
                          ${topicBadges}
                        </div>
                        ${completed ? '<span class="step-complete">Selesai</span>' : ""}
                      </button>
                    `;
                  }).join("")}
                </div>
              </details>
            `;
          }).join("")}
        </div>
      </details>
    `;
  }).join("");
}

function makePdfUrl(regulation, page) {
  return `${encodeURI(regulation.pdf)}#page=${Number(page) || 1}`;
}

function parseStructuredText(text) {
  const source = String(text)
    .replace(/\((\d)1(?=[A-Za-z\s.,:;]|$)/g, "($1)")
    .replace(/\bREFUBLIK\b/gi, "REPUBLIK")
    .replace(/\s*[_–-]\s*\d+\s*-?\s*$/gm, "");
  const numberedMarkers = [];
  const numberedPattern = /(^|\n)(\d+)\.[ \t]+/g;
  let match;

  while ((match = numberedPattern.exec(source))) {
    const start = match.index + match[1].length;
    numberedMarkers.push({
      start,
      contentStart: numberedPattern.lastIndex,
      number: match[2],
      type: "number"
    });
  }

  const markers = numberedMarkers.length ? numberedMarkers : [];
  if (!markers.length) {
    // PDF extraction can misread a closing parenthesis as "1", for example "(21 ".
    const paragraphPattern = /\((\d{1,2})\)[ \t]*|\((\d)1(?=[ \t])/g;
    while ((match = paragraphPattern.exec(source))) {
      const prefix = source.slice(0, match.index);
      const trimmedPrefix = prefix.trimEnd();
      const startsParagraph = !trimmedPrefix
        || prefix.endsWith("\n")
        || /[.!?:;]$/.test(trimmedPrefix);
      if (startsParagraph) {
        markers.push({
          start: match.index,
          contentStart: paragraphPattern.lastIndex,
          number: match[1] || match[2],
          type: "paragraph"
        });
      }
    }
  }

  if (!markers.length) return { introduction: source, points: [] };

  return {
    introduction: source.slice(0, markers[0].start).trimEnd(),
    points: markers.map((marker, index) => ({
      ...marker,
      text: source.slice(marker.contentStart, markers[index + 1]?.start ?? source.length).trim()
    }))
  };
}

function isDuplicateNumberedStub(points, index) {
  const point = points[index];
  return point.type === "number"
    && /^[^.]{1,32}(?:\s*\.)+\s*$/.test(point.text)
    && points.slice(index + 1, index + 3).some((following) =>
      following.type === "number" && following.number === point.number
    );
}

function parseLetteredPoints(text) {
  const source = String(text);
  const markers = [];
  const pattern = /(^|\n|[;:][ \t]+)([a-z])\.[ \t]+/g;
  let match;

  while ((match = pattern.exec(source))) {
    const start = match.index + match[1].length;
    markers.push({
      start,
      contentStart: pattern.lastIndex,
      label: `${match[2]}.`
    });
  }

  const introduction = markers.length ? source.slice(0, markers[0].start).trim() : "";
  if (!markers.length || (markers.length === 1 && !/[:;]$/.test(introduction))) return null;

  return {
    introduction,
    points: markers.map((marker, index) => ({
      ...marker,
      text: source.slice(marker.contentStart, markers[index + 1]?.start ?? source.length).trim()
    }))
  };
}

function definitionLabel(text, article) {
  if (article.number !== "Pasal 1" || !/KETENTUAN UMUM/i.test(article.chapter || "")) {
    return null;
  }

  const match = text.match(/^(.+?)\s+adalah\s+([\s\S]*)$/i);
  if (!match) return null;

  const alias = match[1].match(/^(.*?)\s+yang selanjutnya (?:disingkat|disebut)\s+(.+)$/i);
  return {
    label: alias ? `${alias[1]} (${alias[2]})` : match[1],
    text: `adalah ${match[2]}`
  };
}

function renderLetteredGroup(marker, list, article) {
  const heading = list.introduction
    ? `<p class="official-text">${renderTextWithReferences(list.introduction, article)}</p>`
    : "";
  return `
    <div class="provision-group">
      ${marker || heading ? `
        <div class="provision-group-heading ${marker ? "" : "provision-group-heading-plain"}">
          ${marker ? `<span class="provision-number">${escapeHtml(marker)}</span>` : ""}
          ${heading}
        </div>
      ` : ""}
      <div class="provision-sublist">
        ${list.points.map((point) => `
          <div class="provision-subpoint">
            <span class="provision-number">${escapeHtml(point.label)}</span>
            <p class="official-text">${renderTextWithReferences(point.text, article)}</p>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderTextWithReferences(text, article) {
  const source = String(text);
  const referencePattern = /Pasal\s+(\d+)|ayat\s+\((\d+)\)/gi;
  const paragraphNumbers = new Set(
    parseStructuredText(article.text).points
      .filter((point) => point.type === "paragraph")
      .map((point) => point.number)
  );
  let output = "";
  let lastIndex = 0;
  let match;

  while ((match = referencePattern.exec(source))) {
    output += escapeHtml(source.slice(lastIndex, match.index));
    const label = match[0];
    if (match[1]) {
      const target = articles.find((item) =>
        item.regulationId === article.regulationId && item.number === `Pasal ${match[1]}`
      );
      output += target
        ? `<button class="reference-chip" type="button" data-reference-kind="article" data-reference-key="${escapeHtml(articleKey(target))}" aria-haspopup="dialog" aria-controls="reference-preview" aria-expanded="false" aria-label="Intip isi ${escapeHtml(label)}">${escapeHtml(label)}</button>`
        : `<mark class="reference-highlight">${escapeHtml(label)}</mark>`;
    } else {
      output += paragraphNumbers.has(match[2])
        ? `<button class="reference-chip" type="button" data-reference-kind="paragraph" data-reference-number="${escapeHtml(match[2])}" aria-haspopup="dialog" aria-controls="reference-preview" aria-expanded="false" aria-label="Intip isi ayat (${escapeHtml(match[2])})">${escapeHtml(label)}</button>`
        : `<mark class="reference-highlight">${escapeHtml(label)}</mark>`;
    }
    lastIndex = referencePattern.lastIndex;
  }

  output += escapeHtml(source.slice(lastIndex));
  return output;
}

function renderOfficialText(text, article, mode = articleViewMode) {
  if (mode === "original") {
    return `<p class="official-text official-original">${renderTextWithReferences(text, article)}</p>`;
  }

  const { introduction, points } = parseStructuredText(text);
  if (!points.length) {
    const lettered = parseLetteredPoints(text);
    if (lettered) {
      return `<div class="provision-list">${renderLetteredGroup("", lettered, article)}</div>`;
    }
    return `<p class="official-text">${renderTextWithReferences(text, article)}</p>`;
  }

  const definitionArticle = article.number === "Pasal 1"
    && /KETENTUAN UMUM/i.test(article.chapter || "");
  const visiblePoints = points.filter((point, index) => !isDuplicateNumberedStub(points, index));
  const cards = visiblePoints.map((point) => {
    const definition = definitionArticle ? definitionLabel(point.text, article) : null;
    const lettered = definition ? null : parseLetteredPoints(point.text);
    if (lettered) {
      const marker = point.type === "number" ? `${point.number}.` : `(${point.number})`;
      return renderLetteredGroup(marker, lettered, article);
    }

    const body = definition ? definition.text : point.text;
    return `
      <div class="provision-card">
        <span class="provision-number">${escapeHtml(point.type === "number" ? `${point.number}.` : `(${point.number})`)}</span>
        <div class="provision-content">
          ${definition ? `<strong class="definition-term">${escapeHtml(definition.label)}</strong>` : ""}
          <p class="official-text">${renderTextWithReferences(body, article)}</p>
        </div>
      </div>
    `;
  });

  return `
    ${introduction.trim() ? `<p class="official-text provision-intro">${renderTextWithReferences(introduction, article)}</p>` : ""}
    <div class="provision-list">${cards.join("")}</div>
  `;
}

function closeReferencePreview() {
  const preview = elements.reader.querySelector("#reference-preview");
  if (!preview) return;
  const trigger = elements.reader.querySelector(".reference-chip[aria-expanded='true']");
  if (preview.matches(":popover-open")) preview.hidePopover();
  preview.replaceChildren();
  elements.reader.querySelectorAll(".reference-chip[aria-expanded='true']").forEach((button) => {
    button.setAttribute("aria-expanded", "false");
  });
  trigger?.focus({ preventScroll: true });
}

function positionReferencePreview(preview, button) {
  const gap = 8;
  const margin = 12;
  const triggerRect = button.getBoundingClientRect();
  const previewRect = preview.getBoundingClientRect();
  const maxLeft = window.innerWidth - previewRect.width - margin;
  const left = Math.max(margin, Math.min(triggerRect.left, maxLeft));
  const belowTop = triggerRect.bottom + gap;
  const top = belowTop + previewRect.height <= window.innerHeight - margin
    ? belowTop
    : Math.max(margin, triggerRect.top - previewRect.height - gap);

  preview.style.left = `${left}px`;
  preview.style.top = `${top}px`;
}

function updateReferencePreviewPosition(event) {
  const preview = elements.reader.querySelector("#reference-preview");
  if (!preview?.matches(":popover-open")) return;
  if (event?.target instanceof Node && preview.contains(event.target)) return;

  const trigger = elements.reader.querySelector(".reference-chip[aria-expanded='true']");
  if (!trigger) {
    closeReferencePreview();
    return;
  }

  const rect = trigger.getBoundingClientRect();
  if (rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth) {
    closeReferencePreview();
    return;
  }

  positionReferencePreview(preview, trigger);
}

function toggleReferencePreview(button) {
  const preview = elements.reader.querySelector("#reference-preview");
  if (!preview) return;

  const shouldClose = button.getAttribute("aria-expanded") === "true";
  closeReferencePreview();
  if (shouldClose) return;

  let title = "";
  let text = "";
  let regulation = getRegulation(currentArticle);
  let page = currentArticle.page;
  if (button.dataset.referenceKind === "article") {
    const target = articles.find((article) => articleKey(article) === button.dataset.referenceKey);
    if (!target) return;
    title = target.number;
    text = target.text;
    regulation = getRegulation(target);
    page = target.page;
  } else {
    const paragraph = parseStructuredText(currentArticle.text).points.find((point) =>
      point.type === "paragraph" && point.number === button.dataset.referenceNumber
    );
    if (!paragraph) return;
    title = `Ayat (${paragraph.number})`;
    text = paragraph.text;
  }

  preview.innerHTML = `
    <div class="reference-preview-heading">
      <h4 id="reference-preview-title">Intip ${escapeHtml(title)}</h4>
      <button class="text-button" id="reference-preview-close" type="button">Tutup</button>
    </div>
    <div class="reference-preview-body">
      <p class="official-text">${escapeHtml(text)}</p>
    </div>
    <a href="${escapeHtml(makePdfUrl(regulation, page))}" target="_blank" rel="noopener">Buka ${escapeHtml(title)} di PDF asli</a>
  `;
  preview.showPopover();
  button.setAttribute("aria-expanded", "true");
  positionReferencePreview(preview, button);
  preview.querySelector("#reference-preview-close").focus({ preventScroll: true });
}

function renderLearningSummary(key, article, regulation) {
  const itemContent = learningContent.articles?.[key];
  if (!itemContent || !itemContent.summary) {
    return `
      <section class="learning-summary-sheet" aria-labelledby="summary-title-${escapeHtml(article.number)}">
        <div class="summary-header">
          <div class="summary-badge-group">
            <span class="learning-badge" id="summary-title-${escapeHtml(article.number)}">Ringkasan belajar &mdash; bukan teks resmi</span>
          </div>
        </div>
        <div class="summary-empty">
          <strong>Ringkasan belum tersedia</strong>
          <p class="summary-empty-note">Materi pendalaman dan ringkasan terverifikasi untuk pasal ini sedang dalam proses penelaahan dokumen resmi.</p>
        </div>
      </section>
    `;
  }

  const { summary, status, topics = [] } = itemContent;
  const statusClass = status === "reviewed" ? "reviewed" : "draft";
  const statusLabel = status === "reviewed" ? "Ditinjau" : "Draf";

  const topicsHtml = topics.length
    ? `<div class="summary-topics-group">
        ${topics.map((tid) => {
          const tObj = learningContent.topics?.find((t) => t.id === tid);
          return tObj ? `<span class="topic-badge">${escapeHtml(tObj.label)}</span>` : "";
        }).join("")}
      </div>`
    : "";

  const pointsHtml = Array.isArray(summary.keyPoints) && summary.keyPoints.length
    ? `<span class="summary-section-title">Hal yang perlu dipahami:</span>
       <ul class="summary-points">
         ${summary.keyPoints.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}
       </ul>`
    : "";

  const termsHtml = Array.isArray(summary.keyTerms) && summary.keyTerms.length
    ? `<span class="summary-section-title">Istilah penting:</span>
       <div class="summary-terms">
         ${summary.keyTerms.map((term) => `
           <div class="summary-term-item">
             <strong>${escapeHtml(term.term)}:</strong>
             <span>${escapeHtml(term.definition)}</span>
           </div>
         `).join("")}
       </div>`
    : "";

  const sourcePage = Number(summary.sourcePage || article.page);
  const pdfUrl = makePdfUrl(regulation, sourcePage);
  const sourceFooter = `
    <div class="summary-source-footer">
      <span>Intisari terhubung ke halaman ${sourcePage} dari PDF sumber</span>
      <a href="${escapeHtml(pdfUrl)}" target="_blank" rel="noopener">Buka halaman PDF</a>
    </div>
  `;

  return `
    <section class="learning-summary-sheet" aria-labelledby="summary-title-${escapeHtml(article.number)}">
      <div class="summary-header">
        <div class="summary-badge-group">
          <span class="learning-badge" id="summary-title-${escapeHtml(article.number)}">Ringkasan belajar &mdash; bukan teks resmi</span>
          <span class="status-badge ${statusClass}">${escapeHtml(statusLabel)}</span>
        </div>
        ${topicsHtml}
      </div>
      <p class="summary-core">${escapeHtml(summary.core)}</p>
      ${pointsHtml}
      ${termsHtml}
      ${sourceFooter}
    </section>
  `;
}

function renderRelatedReferences(key) {
  const itemContent = learningContent.articles?.[key];
  if (!itemContent || !Array.isArray(itemContent.relations) || !itemContent.relations.length) {
    return "";
  }

  const cards = itemContent.relations.map((rel) => {
    const targetReg = regulations.find((r) => r.id === rel.targetRegulationId);
    const regLabel = targetReg ? formatRegulation(targetReg) : rel.targetRegulationId;
    const targetKey = `${rel.targetRegulationId}|${rel.targetArticle}`;
    const typeClass = rel.relationType === "explicit_reference" ? "explicit" : "topic";
    const typeLabel = rel.relationType === "explicit_reference" ? "Rujukan Eksplisit" : "Keterkaitan Topik";
    const targetPage = rel.sourcePage;
    const pdfUrl = targetReg && targetPage ? makePdfUrl(targetReg, targetPage) : "";

    return `
      <div class="relation-card">
        <div class="relation-header">
          <button class="relation-target-btn" type="button" data-open-article="${escapeHtml(targetKey)}" aria-label="Buka ${escapeHtml(regLabel)} ${escapeHtml(rel.targetArticle)}">
            <span>${escapeHtml(regLabel)} &middot; ${escapeHtml(rel.targetArticle)} &rarr;</span>
          </button>
          <span class="relation-type-badge ${typeClass}">${typeLabel}</span>
        </div>
        <p class="relation-note">${escapeHtml(rel.note)}</p>
        <div class="relation-footer">
          <span>${rel.relationLabel ? escapeHtml(rel.relationLabel) : "Rujukan pasal"}</span>
          ${pdfUrl ? `<a href="${escapeHtml(pdfUrl)}" target="_blank" rel="noopener">PDF Hal. ${Number(targetPage)}</a>` : ""}
        </div>
      </div>
    `;
  }).join("");

  return `
    <section class="related-references-sheet" aria-labelledby="references-title">
      <h3 id="references-title">Rujukan Terkait &amp; Lintas Regulasi</h3>
      <p class="references-note">Keterkaitan ketentuan ini dengan pasal lain yang dapat diklik langsung untuk membuka materinya.</p>
      <div class="relation-grid">${cards}</div>
    </section>
  `;
}

function renderQuizSheet(key) {
  const itemContent = learningContent.articles?.[key];
  if (!itemContent || !Array.isArray(itemContent.quiz) || !itemContent.quiz.length) {
    return "";
  }

  const quizzes = itemContent.quiz;
  const answeredCount = quizzes.filter((q) => state.quizAnswers && state.quizAnswers[q.id] !== undefined).length;

  const quizCards = quizzes.map((quiz, qIdx) => {
    const selectedOpt = state.quizAnswers ? state.quizAnswers[quiz.id] : undefined;
    const isAnswered = selectedOpt !== undefined;
    const isCorrect = isAnswered && selectedOpt === quiz.correctIndex;

    let feedbackHtml = "";
    if (isAnswered) {
      feedbackHtml = `
        <div class="quiz-feedback ${isCorrect ? "correct" : "incorrect"}" role="status">
          <div class="quiz-feedback-title">
            <span>${isCorrect ? "Jawaban Anda Benar! &#10003;" : "Jawaban Belum Tepat"}</span>
            <button class="quiz-retry-btn" type="button" data-quiz-retry="${escapeHtml(quiz.id)}">Ulangi soal</button>
          </div>
          <p>${escapeHtml(quiz.explanation)}</p>
          <span class="quiz-feedback-source">Sumber: ${escapeHtml(quiz.sourceReference)}</span>
        </div>
      `;
    }

    return `
      <div class="quiz-card" data-quiz-id="${escapeHtml(quiz.id)}">
        <div class="quiz-card-head">
          <span class="quiz-q-num">${qIdx + 1}</span>
          <p class="quiz-question-text">${escapeHtml(quiz.question)}</p>
        </div>
        <div class="quiz-options">
          ${quiz.options.map((opt, optIdx) => {
            const isSelected = selectedOpt === optIdx;
            return `
              <button class="quiz-option-btn ${isSelected ? "selected" : ""}" 
                      type="button" 
                      data-quiz-id="${escapeHtml(quiz.id)}" 
                      data-quiz-option="${optIdx}" 
                      aria-pressed="${isSelected}">
                <span class="quiz-option-indicator" aria-hidden="true"></span>
                <span>${escapeHtml(opt)}</span>
              </button>
            `;
          }).join("")}
        </div>
        ${feedbackHtml}
      </div>
    `;
  }).join("");

  return `
    <section class="quiz-sheet" aria-labelledby="quiz-title">
      <div class="quiz-heading">
        <h3 id="quiz-title">Kuis Pemahaman Cepat</h3>
        <span class="quiz-meta-badge">${answeredCount} dari ${quizzes.length} Dijawab</span>
      </div>
      <p class="quiz-intro">Uji pemahaman dasar dari bunyi pasal resmi. Hasil kuis tersimpan di perangkat ini dan bukan ukuran kelayakan hukum resmi.</p>
      <div class="quiz-list">${quizCards}</div>
    </section>
  `;
}

function renderReader() {
  const visible = getVisibleArticles();
  if (!currentArticle || !visible.some((article) => articleKey(article) === articleKey(currentArticle))) {
    currentArticle = visible[0] || null;
  }
  if (!currentArticle) {
    elements.reader.innerHTML = `
      <div class="reader-empty">
        <h2>Pasal yang dicari belum ditemukan.</h2>
        <p>Ubah kata kunci atau pilih gambaran umum untuk melihat semua materi.</p>
      </div>
    `;
    return;
  }

  const currentKey = articleKey(currentArticle);
  const regulation = getRegulation(currentArticle);
  const position = visible.findIndex((article) => articleKey(article) === currentKey);
  const previousDisabled = position <= 0;
  const nextDisabled = position < 0 || position >= visible.length - 1;
  const isComplete = state.completed.includes(currentKey);
  const hasExplanation = Boolean(currentArticle.explanation);
  const pdfUrl = makePdfUrl(regulation, currentArticle.page);
  const fullArticle = escapeHtml(currentArticle.text);
  const explanation = escapeHtml(currentArticle.explanation || "");
  const chapter = currentArticle.chapter || "Bagian pasal";
  const regulationIntro = regulation.generalExplanation
    ? `<details class="general-explanation"><summary>Baca penjelasan umum ${escapeHtml(formatRegulation(regulation))}</summary><p class="official-text">${escapeHtml(regulation.generalExplanation)}</p></details>`
    : "";

  const itemContent = learningContent.articles?.[currentKey];
  const headerTopics = (itemContent && Array.isArray(itemContent.topics) && itemContent.topics.length)
    ? `<div class="summary-topics-group">
        ${itemContent.topics.map((tid) => {
          const tObj = learningContent.topics?.find((t) => t.id === tid);
          return tObj ? `<span class="topic-badge">${escapeHtml(tObj.label)}</span>` : "";
        }).join("")}
      </div>`
    : "";

  elements.reader.innerHTML = `
    <article class="lesson">
      <header class="lesson-head">
        <div class="lesson-meta">
          <span class="step-chip"><span>LANGKAH</span> ${position + 1} / ${visible.length}</span>
          <span>${escapeHtml(formatRegulation(regulation))}</span>
          ${headerTopics}
        </div>
        <h2>${escapeHtml(currentArticle.number)}</h2>
        <p class="lesson-chapter">${escapeHtml(chapter)}</p>
      </header>
      <div class="lesson-body">
        <div class="source-callout">
          <div><strong>Bunyi resmi</strong><span>Halaman ${Number(currentArticle.page)} dari PDF</span></div>
          <a href="${escapeHtml(pdfUrl)}" target="_blank" rel="noopener">Buka PDF asli</a>
        </div>
        ${renderLearningSummary(currentKey, currentArticle, regulation)}
        <section aria-labelledby="official-title">
          <div class="official-heading">
            <h3 id="official-title">Teks pasal</h3>
            <div class="reading-mode" role="group" aria-label="Mode baca">
              <button type="button" data-reading-mode="structured" aria-pressed="${articleViewMode === "structured"}">Poin terstruktur</button>
              <button type="button" data-reading-mode="original" aria-pressed="${articleViewMode === "original"}">Teks utuh PDF</button>
            </div>
          </div>
          <p class="reading-mode-note">${articleViewMode === "structured" ? "Poin disusun dari teks sumber; fragmen duplikat yang terpotong disembunyikan." : "Teks mengikuti hasil ekstraksi PDF. Cocokkan dengan PDF asli bila redaksi terlihat janggal."}</p>
          ${renderOfficialText(currentArticle.text, currentArticle)}
          <div class="reference-preview" id="reference-preview" popover="auto" role="dialog" aria-labelledby="reference-preview-title"></div>
        </section>
        ${hasExplanation ? `
          <details class="explanation">
            <summary>Buka penjelasan resmi${currentArticle.explanationPage ? ` · halaman ${Number(currentArticle.explanationPage)}` : ""}</summary>
            <p class="official-text">${explanation}</p>
            ${currentArticle.explanationPage ? `<a href="${escapeHtml(makePdfUrl(regulation, currentArticle.explanationPage))}" target="_blank" rel="noopener">Lihat penjelasan di PDF</a>` : ""}
          </details>
        ` : ""}
        ${regulationIntro}
        ${renderRelatedReferences(currentKey)}
        ${renderQuizSheet(currentKey)}
        <section class="recall-sheet" aria-labelledby="recall-title">
          <div class="recall-heading">
            <h3 id="recall-title">Latihan ingatan mandiri</h3>
            <span>${state.selfChecked.includes(currentKey) ? "SUDAH DICEK" : "TANPA NILAI OTOMATIS"}</span>
          </div>
          <p>Tanpa melihat teks di atas, coba jelaskan inti ${escapeHtml(currentArticle.number)} dengan kata-katamu sendiri. Jawabanmu tidak dikirim atau disimpan.</p>
          <label class="visually-hidden" for="recall-answer">Catatan jawaban latihan ingatan</label>
          <textarea id="recall-answer" placeholder="Tulis jawabanmu di sini."></textarea>
          <div class="recall-actions">
            <button class="button button-outline" id="answer-check-toggle" type="button" aria-expanded="false">Bandingkan dengan teks</button>
            <span class="recall-feedback" id="recall-feedback" role="status"></span>
          </div>
          <div class="answer-check" id="answer-check" hidden>
            <strong>Rujukan untuk mengecek jawaban: bunyi resmi pasal</strong>
            <p class="official-text">${fullArticle}</p>
          </div>
        </section>
        <div class="lesson-actions">
          <button class="button button-outline" id="complete-toggle" type="button">${isComplete ? "Tandai belum selesai" : "Tandai selesai"}</button>
          <div class="lesson-actions-group">
            <button class="button button-outline" id="previous-article" type="button" ${previousDisabled ? "disabled" : ""}>Langkah sebelumnya</button>
            <button class="button button-primary" id="next-article" type="button" ${nextDisabled ? "disabled" : ""}>Langkah berikutnya</button>
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderProgress() {
  const total = articles.length;
  const completed = state.completed.filter((key) => articles.some((article) => articleKey(article) === key)).length;
  const selfChecked = state.selfChecked.filter((key) => articles.some((article) => articleKey(article) === key)).length;
  const progressText = `${completed} dari ${total} pasal`;

  elements.progressLabel.textContent = `${completed} dari ${total} pasal`;
  elements.progressBar.max = Math.max(total, 1);
  elements.progressBar.value = completed;
  elements.progressDetail.textContent = total
    ? `Tandai pasal selesai setelah dibaca. ${regulations.length} PDF sumber tersedia.`
    : "Belum ada pasal untuk ditampilkan.";
  elements.progressReadCount.textContent = String(completed);
  elements.progressCheckedCount.textContent = String(selfChecked);
  if (elements.progressQuizCount) {
    elements.progressQuizCount.textContent = String(Object.keys(state.quizAnswers || {}).length);
  }
  elements.progressTrackCount.textContent = String(state.customTracks.length);
  elements.homeProgressLabel.textContent = progressText;
  elements.homeProgressBar.max = Math.max(total, 1);
  elements.homeProgressBar.value = completed;
  elements.homeProgressDetail.textContent = "Progres tersimpan di browser ini.";

  const lastArticle = articles.find((article) => articleKey(article) === state.lastArticle);
  elements.lastRead.innerHTML = lastArticle
    ? `
      <button class="progress-entry-button" type="button" data-open-article="${escapeHtml(articleKey(lastArticle))}">
        <span>${escapeHtml(formatRegulation(getRegulation(lastArticle)))}</span>
        <strong>${escapeHtml(lastArticle.number)} · ${escapeHtml(lastArticle.chapter || "Bagian pasal")}</strong>
        <span>Lanjutkan membaca</span>
      </button>
    `
    : '<p class="empty-state">Belum ada bacaan terakhir. Pilih pasal untuk mulai belajar.</p>';

  const completedArticles = articles.filter((article) => state.completed.includes(articleKey(article)));
  elements.completedArticles.innerHTML = completedArticles.length
    ? completedArticles.map((article) => `
      <button class="completed-entry" type="button" data-open-article="${escapeHtml(articleKey(article))}">
        <span>${escapeHtml(formatRegulation(getRegulation(article)))}</span>
        <strong>${escapeHtml(article.number)}</strong>
        <span class="completion-mark">Selesai</span>
      </button>
    `).join("")
    : '<p class="empty-state">Belum ada pasal yang ditandai selesai.</p>';
}

function renderTrackCards() {
  const tracks = [
    {
      id: "all",
      title: "Gambaran umum",
      description: "Jelajahi seluruh pasal dari tiga peraturan yang tersedia.",
      count: articles.length
    },
    {
      id: "waspal",
      title: "Waspal · draf",
      description: "Jalur awal untuk pendalaman. Cocokkan pilihan pasalnya dengan pembimbing.",
      count: articles.filter((article) => WASPAL_ARTICLES.has(articleKey(article))).length
    },
    ...state.customTracks.map((track) => ({
      id: track.id,
      title: track.name,
      description: "Jalur buatan sendiri yang tersimpan di browser ini.",
      count: articles.filter((article) => track.articles.includes(articleKey(article))).length
    }))
  ];

  elements.trackCards.innerHTML = tracks.map((track) => `
    <article class="path-card ${state.activeTrack === track.id ? "is-active" : ""}">
      <div class="path-card-heading">
        <h3>${escapeHtml(track.title)}</h3>
        <span>${track.count} pasal</span>
      </div>
      <p>${escapeHtml(track.description)}</p>
      <button class="text-button" type="button" data-open-track="${escapeHtml(track.id)}">
        ${state.activeTrack === track.id ? "Lihat materi" : "Pilih jalur"}
      </button>
    </article>
  `).join("");
}

function renderSourceList() {
  elements.sourceList.innerHTML = regulations.map((regulation) => `
    <article class="source-card">
      <div class="source-card-heading">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5h8l4 4V21H6z"/><path d="M14 3.5V8h4M9 12h6M9 16h6"/></svg>
        <span>PDF · ${Number(regulation.pdfPages)} halaman</span>
      </div>
      <h3>${escapeHtml(formatRegulation(regulation))}</h3>
      <p>${escapeHtml(regulation.title)}</p>
      <a class="button button-primary" href="${escapeHtml(encodeURI(regulation.pdf))}" target="_blank" rel="noopener">Buka PDF asli</a>
    </article>
  `).join("");
}

function renderRouteNote() {
  const trackId = elements.trackFilter.value;
  if (trackId === "waspal") {
    elements.routeNote.textContent = "Jalur Waspal ini draf awal; cocokkan daftar pasalnya dengan pembimbing.";
  } else if (trackId !== "all") {
    const track = state.customTracks.find((item) => item.id === trackId);
    elements.routeNote.textContent = track
      ? `Jalur “${track.name}” hanya tersimpan di browser ini.`
      : "";
  } else {
    elements.routeNote.textContent = "";
  }
}

function renderAll() {
  renderTrackFilter();
  renderReader();
  renderNavigation();
  renderProgress();
  renderTrackCards();
  renderSourceList();
  renderRouteNote();
  showStatus(storageNotice);
}

function renderTrackFilter() {
  const selected = elements.trackFilter.value;
  fillTrackFilter();
  if (Array.from(elements.trackFilter.options).some((option) => option.value === selected)) {
    elements.trackFilter.value = selected;
    state.activeTrack = selected;
  }
}

function setCurrentArticle(key) {
  const article = articles.find((item) => articleKey(item) === key);
  if (!article) {
    showStatus("Pasal yang dipilih tidak ditemukan di daftar sumber.");
    return;
  }
  navigateToView("daftar-regulasi");
  currentArticle = article;
  state.lastArticle = key;
  saveState();
  renderAll();
  if (window.matchMedia("(max-width: 700px)").matches) {
    elements.indexDetails.open = false;
  }
  document.querySelector("#reader").focus({ preventScroll: true });
}

function showView(viewId) {
  const allowedViews = new Set(["jalur-belajar", "progres-saya", "daftar-regulasi", "tentang-sumber"]);
  const activeView = allowedViews.has(viewId) ? viewId : "jalur-belajar";
  document.querySelectorAll(".view-panel").forEach((panel) => {
    panel.hidden = panel.id !== activeView;
  });
  document.querySelectorAll("[data-view-link]").forEach((link) => {
    if (link.dataset.viewLink === activeView) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function syncViewFromLocation() {
  const hash = window.location.hash.slice(1);
  const legacyView = {
    reader: "daftar-regulasi",
    "article-controls": "daftar-regulasi",
    "progress-summary": "progres-saya",
    "source-notice": "tentang-sumber",
    "track-builder": "jalur-belajar"
  }[hash];
  showView(legacyView || hash);
}

function navigateToView(viewId) {
  if (window.location.hash !== `#${viewId}`) {
    window.history.pushState(null, "", `#${viewId}`);
  }
  showView(viewId);
}

function renderTrackOptions() {
  const query = elements.trackSearch.value.trim().toLocaleLowerCase("id");
  const matches = articles.filter((article) => !query || searchableText(article).includes(query));
  const groups = groupByRegulationAndChapter(matches);
  elements.trackOptions.innerHTML = groups.map(({ regulation, chapters }) => `
    <section class="track-option-group">
      <h3>${escapeHtml(formatRegulation(regulation))} · ${escapeHtml(regulation.title)}</h3>
      ${chapters.map((chapter) => chapter.articles.map((article) => {
        const key = articleKey(article);
        const checked = builderSelection.has(key);
        return `
          <label class="track-option">
            <input type="checkbox" value="${escapeHtml(key)}" ${checked ? "checked" : ""}>
            <span><strong>${escapeHtml(article.number)} · ${escapeHtml(chapter.title || article.chapter || "Pasal utama")}</strong><small>${escapeHtml(article.text.slice(0, 110))}${article.text.length > 110 ? "…" : ""}</small></span>
            <span class="option-regulation">${escapeHtml(formatRegulation(regulation))}</span>
          </label>
        `;
      }).join("")).join("")}
    </section>
  `).join("") || '<p class="empty-list">Tidak ada pasal yang cocok dengan pencarian.</p>';
  elements.trackSelectionCount.textContent = builderSelection.size
    ? `${builderSelection.size} pasal dipilih.`
    : "Belum ada pasal dipilih.";
}

function toggleTrackBuilder(open) {
  elements.trackBuilder.hidden = !open;
  elements.trackBuilderToggle.setAttribute("aria-expanded", String(open));
  if (open) {
    renderTrackOptions();
    elements.trackName.focus();
  } else {
    elements.trackBuilderToggle.focus();
  }
}

function handleArticleAction(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const readingModeButton = target.closest("[data-reading-mode]");
  if (readingModeButton) {
    const nextMode = readingModeButton.dataset.readingMode;
    if (nextMode === "structured" || nextMode === "original") {
      articleViewMode = nextMode;
      renderReader();
      elements.reader.querySelector(`[data-reading-mode="${nextMode}"]`).focus();
    }
    return;
  }

  const referenceButton = target.closest("[data-reference-kind]");
  if (referenceButton) {
    toggleReferencePreview(referenceButton);
    return;
  }

  if (target.id === "reference-preview-close") {
    closeReferencePreview();
    return;
  }

  const quizOptionBtn = target.closest("[data-quiz-id][data-quiz-option]");
  if (quizOptionBtn) {
    const quizId = quizOptionBtn.dataset.quizId;
    const optionIdx = parseInt(quizOptionBtn.dataset.quizOption, 10);
    state.quizAnswers = state.quizAnswers || {};
    state.quizAnswers[quizId] = optionIdx;
    saveState();
    renderReader();
    renderProgress();
    return;
  }

  const quizRetryBtn = target.closest("[data-quiz-retry]");
  if (quizRetryBtn) {
    const quizId = quizRetryBtn.dataset.quizRetry;
    if (state.quizAnswers && state.quizAnswers[quizId] !== undefined) {
      delete state.quizAnswers[quizId];
      saveState();
      renderReader();
      renderProgress();
    }
    return;
  }

  if (target.id === "complete-toggle" && currentArticle) {
    const key = articleKey(currentArticle);
    state.completed = state.completed.includes(key)
      ? state.completed.filter((item) => item !== key)
      : [...state.completed, key];
    saveState();
    renderAll();
    return;
  }

  if (target.id === "answer-check-toggle" && currentArticle) {
    const answer = document.querySelector("#answer-check");
    const isOpen = answer.hidden;
    answer.hidden = !isOpen;
    target.setAttribute("aria-expanded", String(isOpen));
    target.textContent = isOpen ? "Sembunyikan teks pembanding" : "Bandingkan dengan teks";
    if (isOpen) {
      const key = articleKey(currentArticle);
      if (!state.selfChecked.includes(key)) state.selfChecked.push(key);
      saveState();
      const recallStatus = document.querySelector(".recall-heading span");
      recallStatus.textContent = "SUDAH DICEK";
      const feedback = document.querySelector("#recall-feedback");
      feedback.textContent = "Cocokkan jawabanmu dengan bunyi resmi di atas.";
      renderNavigation();
    }
    return;
  }

  if ((target.id === "next-article" || target.id === "previous-article") && currentArticle) {
    const visible = getVisibleArticles();
    const index = visible.findIndex((article) => articleKey(article) === articleKey(currentArticle));
    const nextIndex = target.id === "next-article" ? index + 1 : index - 1;
    if (visible[nextIndex]) setCurrentArticle(articleKey(visible[nextIndex]));
  }
}

function handleTrackSubmit(event) {
  event.preventDefault();
  const name = elements.trackName.value.trim();
  if (!name) {
    elements.trackName.focus();
    showStatus("Isi nama jalur sebelum menyimpan.");
    return;
  }
  if (!builderSelection.size) {
    showStatus("Pilih setidaknya satu pasal untuk jalur ini.");
    elements.trackOptions.focus();
    return;
  }

  const track = {
    id: `custom-${Date.now()}`,
    name,
    articles: [...builderSelection]
  };
  state.customTracks = [...state.customTracks, track];
  state.activeTrack = track.id;
  builderSelection = new Set();
  elements.trackForm.reset();
  saveState();
  fillTrackFilter();
  elements.trackFilter.value = track.id;
  currentArticle = null;
  toggleTrackBuilder(false);
  renderAll();
  showStatus(`Jalur “${name}” tersimpan di browser ini.`);
}

async function start() {
  try {
    const [regResponse, learningResponse] = await Promise.all([
      fetch("data/regulations.json?v=2"),
      fetch("data/learning-content.json?v=2").catch(() => null)
    ]);
    if (!regResponse.ok) {
      throw new Error(`data/regulations.json tidak dapat dimuat (HTTP ${regResponse.status}).`);
    }
    const data = await regResponse.json();
    if (learningResponse && learningResponse.ok) {
      try {
        learningContent = await learningResponse.json();
      } catch (error) {
        console.warn("learning-content.json tidak dapat diproses:", error);
      }
    }
    loadArticles(data);
    elements.indexDetails.open = !window.matchMedia("(max-width: 700px)").matches;
    fillRegulationFilter();
    fillTopicFilter();
    fillTrackFilter();
    currentArticle = articles.find((article) => articleKey(article) === state.lastArticle) || articles[0];
    if (!window.location.hash) {
      window.history.replaceState(null, "", "#jalur-belajar");
    }
    syncViewFromLocation();
    saveState();
    renderAll();
  } catch (error) {
    elements.reader.innerHTML = `
      <div class="reader-empty">
        <h2>Daftar pasal tidak dapat dimuat.</h2>
        <p>${escapeHtml(error.message)} Jalankan website melalui server lokal, misalnya <code>python -m http.server 8000</code>, lalu buka <code>http://localhost:8000</code>.</p>
        <button class="button button-primary" id="retry-load" type="button">Coba lagi</button>
      </div>
    `;
    showStatus("Website perlu dijalankan melalui server lokal atau hosting statis agar file data dapat dibaca.");
  }
}

elements.articleList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-article-key]");
  if (button) setCurrentArticle(button.dataset.articleKey);
});

elements.trackCards.addEventListener("click", (event) => {
  const button = event.target.closest("[data-open-track]");
  if (!button) return;
  const trackId = button.dataset.openTrack;
  const hasTrack = trackId === "all"
    || trackId === "waspal"
    || state.customTracks.some((track) => track.id === trackId);
  if (!hasTrack) return;
  elements.trackFilter.value = trackId;
  state.activeTrack = trackId;
  currentArticle = null;
  saveState();
  renderAll();
  navigateToView("daftar-regulasi");
});

document.querySelector("#start-overview").addEventListener("click", () => {
  elements.trackFilter.value = "all";
  state.activeTrack = "all";
  currentArticle = null;
  saveState();
  renderAll();
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-open-article]");
  if (button) setCurrentArticle(button.dataset.openArticle);
});

window.addEventListener("hashchange", syncViewFromLocation);
window.addEventListener("popstate", syncViewFromLocation);
elements.reader.addEventListener("click", handleArticleAction);
elements.reader.addEventListener("toggle", (event) => {
  const preview = event.target;
  if (
    !(preview instanceof HTMLElement)
    || preview.id !== "reference-preview"
    || event.newState !== "closed"
    || preview.matches(":popover-open")
  ) {
    return;
  }

  const trigger = elements.reader.querySelector(".reference-chip[aria-expanded='true']");
  trigger?.setAttribute("aria-expanded", "false");
  if (trigger && preview.contains(document.activeElement)) {
    trigger.focus({ preventScroll: true });
  }
}, true);
elements.reader.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  const preview = elements.reader.querySelector("#reference-preview");
  if (!preview?.matches(":popover-open")) return;
  event.preventDefault();
  closeReferencePreview();
});
window.addEventListener("scroll", updateReferencePreviewPosition, true);
window.addEventListener("resize", updateReferencePreviewPosition);
elements.reader.addEventListener("click", (event) => {
  if (event.target.id === "retry-load") start();
});
elements.regulationFilter.addEventListener("change", () => {
  currentArticle = null;
  renderAll();
});
if (elements.topicFilter) {
  elements.topicFilter.addEventListener("change", () => {
    currentArticle = null;
    renderAll();
  });
}
elements.trackFilter.addEventListener("change", () => {
  state.activeTrack = elements.trackFilter.value;
  currentArticle = null;
  saveState();
  renderAll();
});
elements.search.addEventListener("input", () => {
  currentArticle = null;
  renderAll();
});
elements.trackBuilderToggle.addEventListener("click", () => {
  toggleTrackBuilder(elements.trackBuilder.hidden);
});
elements.trackBuilderClose.addEventListener("click", () => toggleTrackBuilder(false));
elements.trackForm.addEventListener("submit", handleTrackSubmit);
elements.trackSearch.addEventListener("input", renderTrackOptions);
elements.trackOptions.addEventListener("change", (event) => {
  const checkbox = event.target;
  if (!(checkbox instanceof HTMLInputElement) || checkbox.type !== "checkbox") return;
  if (checkbox.checked) {
    builderSelection.add(checkbox.value);
  } else {
    builderSelection.delete(checkbox.value);
  }
  elements.trackSelectionCount.textContent = builderSelection.size
    ? `${builderSelection.size} pasal dipilih.`
    : "Belum ada pasal dipilih.";
});

start();
