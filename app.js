"use strict";

const STORAGE_KEY = "vox-liturgiae-progress";
const CACHE_NAME = "vox-liturgiae-v4";
const CORE_PATHS = [
  "./index.html", "./styles.css", "./app.js", "./manifest.webmanifest",
  "./assets/icon.svg", "./assets/icon-192.png", "./assets/icon-512.png",
  "./assets/audio/ave-maria.ogg", "./assets/audio/gloria-patri.ogg", "./assets/audio/salve-regina.ogg"
];
const AUDIO_PATH = "./assets/audio/ave-maria.ogg";
const AUDIO_CREDITS = {
  "ave": "“Ave Maria in Latin language,” OrbiliusMagister. Spoken in ecclesiastical pronunciation by an Italian speaker; public domain. Wikimedia Commons.",
  "gloria": "“Gloria Patri recitato da voce italiana,” Antonella Nigro. Spoken in Latin by an Italian speaker; public domain. Wikimedia Commons.",
  "salve-regina": "“Salve regina,” Geremia. Latin prayer pronunciation; public domain. Wikimedia Commons."
};
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
let noticeTimer = 0;
let persistenceBlocked = false;

const VOCAB = [
  { id: "salve", latin: "Salve", english: "Hail; greetings", syllables: ["sal", "ve"] },
  { id: "dominus", latin: "Dominus", english: "the Lord", syllables: ["Dó", "mi", "nus"] },
  { id: "vobiscum", latin: "vobiscum", english: "with you (plural)", syllables: ["vo", "bís", "cum"] },
  { id: "spiritu", latin: "spiritu", english: "spirit", syllables: ["spí", "ri", "tu"] },
  { id: "pater", latin: "Pater", english: "father", syllables: ["Pá", "ter"] },
  { id: "noster", latin: "noster", english: "our", syllables: ["nós", "ter"] },
  { id: "caelis", latin: "caelis", english: "in heaven", syllables: ["cæ", "lis"] },
  { id: "nomen", latin: "nomen", english: "name", syllables: ["nó", "men"] },
  { id: "sanctificetur", latin: "sanctificetur", english: "may it be hallowed", syllables: ["sanc", "ti", "fi", "cé", "tur"] },
  { id: "regnum", latin: "regnum", english: "kingdom", syllables: ["rég", "num"] },
  { id: "panem", latin: "panem", english: "bread", syllables: ["pá", "nem"] },
  { id: "hodie", latin: "hodie", english: "today", syllables: ["hó", "di", "e"] },
  { id: "ave", latin: "Ave", english: "hail", syllables: ["Á", "ve"] },
  { id: "gratia", latin: "gratia", english: "grace", syllables: ["grá", "ti", "a"] },
  { id: "plena", latin: "plena", english: "full", syllables: ["plé", "na"] },
  { id: "tecum", latin: "tecum", english: "with you (singular)", syllables: ["té", "cum"] },
  { id: "ora", latin: "ora", english: "pray", syllables: ["ó", "ra"] },
  { id: "nobis", latin: "nobis", english: "for us", syllables: ["nó", "bis"] },
  { id: "gloria", latin: "Gloria", english: "glory", syllables: ["Gló", "ri", "a"] },
  { id: "saecula", latin: "saecula", english: "ages", syllables: ["sæ", "cu", "la"] },
  { id: "sacramentum", latin: "sacramentum", english: "sacrament", syllables: ["sa", "cra", "mén", "tum"] },
  { id: "adoramus", latin: "adoramus", english: "we adore", syllables: ["a", "do", "rá", "mus"] },
  { id: "benedicimus", latin: "benedicimus", english: "we bless", syllables: ["be", "ne", "dí", "ci", "mus"] },
  { id: "amen", latin: "Amen", english: "so be it; truly", syllables: ["Á", "men"] }
];
const VOCAB_BY_ID = new Map(VOCAB.map((word) => [word.id, word]));

const LESSONS = [
  {
    id: "mass",
    title: "At Holy Mass",
    level: "BEGINNER · RESPONSES",
    tag: "Mass responses",
    description: "Learn the short exchanges heard throughout the liturgy.",
    intro: "The assembly answers the celebrant. Learn each response as a complete phrase.",
    kind: "mass-response",
    words: ["dominus", "vobiscum", "spiritu", "amen"],
    lines: [
      { latin: "Dominus vobiscum.", translation: "The Lord be with you.", syllables: ["Dó-mi-nus", "vo-bís-cum"] },
      { latin: "Et cum spiritu tuo.", translation: "And with your spirit.", syllables: ["Et", "cum", "spí-ri-tu", "tu-o"] },
      { latin: "Per omnia saecula saeculorum.", translation: "For ever and ever.", syllables: ["Per", "óm-ni-a", "sæ-cu-la", "sæ-cu-ló-rum"] },
      { latin: "Amen.", translation: "So be it.", syllables: ["Á-men"] }
    ]
  },
  {
    id: "salve-regina",
    title: "Salve Regina",
    level: "BEGINNER · ANTIPHON",
    tag: "Prayer · reference audio",
    description: "Learn the Salve Regina with a bundled reference recitation.",
    intro: "Read the Latin and translation alongside the included public-domain prayer recording.",
    kind: "prayer",
    words: ["salve", "ora", "nobis", "amen"],
    audio: "./assets/audio/salve-regina.ogg",
    lines: [
      { latin: "Salve, Regina, mater misericordiae;", translation: "Hail, Queen, mother of mercy;" },
      { latin: "vita, dulcedo, et spes nostra, salve.", translation: "our life, sweetness, and hope, hail." },
      { latin: "Ad te clamamus, exsules filii Evae.", translation: "To thee do we cry, poor banished children of Eve." },
      { latin: "Ad te suspiramus, gementes et flentes in hac lacrimarum valle.", translation: "To thee do we send up our sighs, mourning and weeping in this valley of tears." },
      { latin: "Eia ergo, advocata nostra, illos tuos misericordes oculos ad nos converte.", translation: "Turn then, most gracious advocate, thine eyes of mercy toward us." },
      { latin: "Et Iesum, benedictum fructum ventris tui, nobis post hoc exsilium ostende.", translation: "And after this our exile, show unto us the blessed fruit of thy womb, Jesus." },
      { latin: "O clemens, O pia, O dulcis Virgo Maria.", translation: "O clement, O loving, O sweet Virgin Mary." }
    ]
  },
  {
    id: "pater",
    title: "Pater Noster",
    level: "BEGINNER · PRAYER",
    tag: "Prayer",
    description: "Follow the familiar words of the Lord's Prayer.",
    intro: "Read a line, consider its meaning, then use the vocabulary cards to review the key words.",
    kind: "prayer",
    words: ["pater", "noster", "caelis", "nomen", "sanctificetur", "regnum", "panem", "hodie"],
    lines: [
      { latin: "Pater noster, qui es in caelis,", translation: "Our Father, who art in heaven," },
      { latin: "sanctificetur nomen tuum.", translation: "hallowed be thy name." },
      { latin: "adveniat regnum tuum.", translation: "thy kingdom come." },
      { latin: "fiat voluntas tua, sicut in caelo et in terra.", translation: "thy will be done, on earth as it is in heaven." },
      { latin: "Panem nostrum quotidianum da nobis hodie.", translation: "Give us this day our daily bread." },
      { latin: "Et dimitte nobis debita nostra, sicut et nos dimittimus debitoribus nostris.", translation: "And forgive us our trespasses, as we forgive those who trespass against us." },
      { latin: "Et ne nos inducas in tentationem,", translation: "And lead us not into temptation," },
      { latin: "sed libera nos a malo.", translation: "but deliver us from evil." }
    ]
  },
  {
    id: "ave",
    title: "Ave Maria",
    level: "BEGINNER · PRAYER",
    tag: "Prayer · reference audio",
    description: "Listen to an ecclesiastical Latin reference recording.",
    intro: "Listen to the complete prayer, then practise a line or an individual word with an optional device voice.",
    kind: "prayer",
    words: ["ave", "gratia", "plena", "dominus", "tecum", "ora", "nobis", "amen"],
    audio: AUDIO_PATH,
    lines: [
      { latin: "Ave Maria, gratia plena, Dominus tecum.", translation: "Hail Mary, full of grace, the Lord is with thee.", syllables: ["Á-ve", "Ma-rí-a", "grá-ti-a", "plé-na", "Dó-mi-nus", "té-cum"] },
      { latin: "Benedicta tu in mulieribus, et benedictus fructus ventris tui, Iesus.", translation: "Blessed art thou among women, and blessed is the fruit of thy womb, Jesus." },
      { latin: "Sancta Maria, Mater Dei, ora pro nobis peccatoribus, nunc et in hora mortis nostrae. Amen.", translation: "Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen." }
    ]
  },
  {
    id: "gloria",
    title: "Gloria Patri",
    level: "BEGINNER · DOXOLOGY",
    tag: "Prayer",
    description: "Learn the traditional doxology.",
    intro: "A compact prayer that appears in many offices and devotions.",
    kind: "prayer",
    words: ["gloria", "pater", "saecula", "amen"],
    audio: "./assets/audio/gloria-patri.ogg",
    lines: [
      { latin: "Gloria Patri, et Filio, et Spiritui Sancto,", translation: "Glory be to the Father, and to the Son, and to the Holy Spirit," },
      { latin: "sicut erat in principio, et nunc, et semper,", translation: "as it was in the beginning, is now, and ever shall be," },
      { latin: "et in saecula saeculorum. Amen.", translation: "world without end. Amen." }
    ]
  },
  {
    id: "tantum",
    title: "Tantum Ergo",
    level: "BEGINNER · HYMN",
    tag: "Hymn memorisation",
    description: "Memorise the opening of a Eucharistic hymn.",
    intro: "Read each line, then hide the Latin and try to recall it from the English meaning.",
    kind: "hymn",
    words: ["sacramentum", "adoramus", "benedicimus", "amen"],
    lines: [
      { latin: "Tantum ergo Sacramentum veneremur cernui,", translation: "Therefore so great a Sacrament let us venerate with heads bowed," },
      { latin: "et antiquum documentum novo cedat ritui;", translation: "and let the old observance give way to the new rite;" },
      { latin: "praestet fides supplementum sensuum defectui.", translation: "let faith provide a supplement to the defect of the senses." },
      { latin: "Genitori Genitoque laus et iubilatio,", translation: "To the Begetter and the Begotten be praise and jubilation," },
      { latin: "salus, honor, virtus quoque sit et benedictio;", translation: "salvation, honour, strength, and blessing too;" },
      { latin: "procedenti ab utroque compar sit laudatio. Amen.", translation: "to the One proceeding from both be equal praise. Amen." }
    ]
  }
];
const LESSON_BY_ID = new Map(LESSONS.map((lesson) => [lesson.id, lesson]));
const VALID_EVENT_TYPES = new Set(["quiz", "mass-response", "card", "listening", "self-check", "hymn", "recognition"]);
const DEFAULT_STATE = () => ({ version: 1, history: [], cards: {}, selfChecks: [], hymns: {} });

let state = loadProgress();
let activeLesson = null;
let quizItems = [];
let quizIndex = 0;
let quizStartedAt = 0;
let quizAnswered = false;
let currentCard = null;
let reviewedCards = new Set();
let voices = [];
let selectedVoice = null;
let mediaRecorder = null;
let recordedChunks = [];
let recordingUrl = null;
let recognitionConstructor = null;
let latinRecognitionStatus = "unsupported";
let recognitionMessage = "This browser does not expose a verified local Latin speech-recognition API.";
let recognitionProbeError = "";

function showNotice(message, isError = false) {
  const notice = $("#notice");
  notice.textContent = message;
  notice.classList.toggle("error", isError);
  notice.hidden = false;
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => { notice.hidden = true; }, 6500);
}

function loadProgress() {
  let raw;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    persistenceBlocked = true;
    showNotice(`Local progress storage is unavailable: ${error.message}. Practice may not persist in this browser.`, true);
    return DEFAULT_STATE();
  }
  if (!raw) return DEFAULT_STATE();
  try {
    return sanitizeProgress(JSON.parse(raw));
  } catch (error) {
    persistenceBlocked = true;
    showNotice(`Saved progress could not be read: ${error.message}. Your original local data was not overwritten. Use Import to restore a valid backup.`, true);
    return DEFAULT_STATE();
  }
}

function sanitizeProgress(input) {
  if (!input || input.version !== 1 || !Array.isArray(input.history) || !input.cards || typeof input.cards !== "object" || !Array.isArray(input.selfChecks) || !input.hymns || typeof input.hymns !== "object") {
    throw new Error("unsupported or incomplete progress file");
  }
  if (input.history.length > 5000 || input.selfChecks.length > 500) throw new Error("progress file is too large");
  const history = input.history.filter((event) => (
    event && VALID_EVENT_TYPES.has(event.type) &&
    typeof event.item === "string" && event.item.length <= 80 &&
    typeof event.at === "string" &&
    (event.correct === undefined || typeof event.correct === "boolean") &&
    (event.durationMs === undefined || (Number.isFinite(event.durationMs) && event.durationMs >= 0 && event.durationMs <= 3600000)) &&
    (event.similarity === undefined || (Number.isFinite(event.similarity) && event.similarity >= 0 && event.similarity <= 100))
  )).slice(-5000);
  const cards = {};
  for (const word of VOCAB) {
    const card = input.cards[word.id];
    if (card && Number.isFinite(card.dueAt) && Number.isFinite(card.interval) && Number.isInteger(card.reps) && Number.isInteger(card.lapses) && Number.isInteger(card.reviews)) {
      cards[word.id] = {
        dueAt: Math.max(0, card.dueAt),
        interval: Math.max(0, Math.min(365, card.interval)),
        reps: Math.max(0, Math.min(1000, card.reps)),
        lapses: Math.max(0, Math.min(1000, card.lapses)),
        reviews: Math.max(0, Math.min(1000, card.reviews))
      };
    }
  }
  const selfChecks = input.selfChecks.filter((item) => item && typeof item.at === "string" && Array.isArray(item.checked) && item.checked.every((value) => ["vowels", "consonants", "stress", "pace"].includes(value))).slice(-500);
  const hymns = { "tantum-ergo": input.hymns["tantum-ergo"] === true };
  return { version: 1, history, cards, selfChecks, hymns };
}

function saveProgress() {
  state.history = state.history.slice(-5000);
  if (persistenceBlocked) {
    showNotice("Progress was not saved because existing local data could not be read. Import a valid backup before saving new progress.", true);
    return false;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    renderHome();
    return true;
  } catch (error) {
    showNotice(`Progress could not be saved on this device: ${error.message}`, true);
    return false;
  }
}

function addHistory(event) {
  state.history.push({ ...event, at: new Date().toISOString() });
  state.history = state.history.slice(-5000);
  return saveProgress();
}

function showView(name) {
  $$(".view").forEach((view) => {
    const active = view.id === `view-${name}`;
    view.classList.toggle("active", active);
    view.hidden = !active;
  });
  $$(".nav-button").forEach((button) => {
    const active = button.dataset.viewTarget === name;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  if (name === "home") renderHome();
  if (name === "cards") renderCards();
  if (name === "device") refreshCapabilities();
}

function createLessonTile(lesson) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "lesson-tile";
  button.dataset.openLesson = lesson.id;
  const tag = document.createElement("span");
  tag.className = "tag";
  tag.textContent = lesson.tag;
  const title = document.createElement("strong");
  title.textContent = lesson.title;
  const description = document.createElement("span");
  description.textContent = lesson.description;
  button.append(tag, title, description);
  return button;
}

function renderLessonLists() {
  $("#lesson-list").replaceChildren(...LESSONS.map(createLessonTile));
  $("#home-lessons").replaceChildren(...LESSONS.slice(0, 3).map(createLessonTile));
}

function renderHome() {
  const quizzes = state.history.filter((event) => ["quiz", "mass-response"].includes(event.type) && typeof event.correct === "boolean");
  const correctCount = quizzes.filter((event) => event.correct).length;
  $("#stat-answered").textContent = String(quizzes.length);
  $("#stat-accuracy").textContent = quizzes.length ? `${Math.round(correctCount / quizzes.length * 100)}%` : "—";
  $("#stat-cards").textContent = String(Object.values(state.cards).reduce((sum, card) => sum + card.reviews, 0));
  renderRecommendations();
}

function renderRecommendations() {
  const recommendations = [];
  const now = Date.now();
  const due = VOCAB.filter((word) => !state.cards[word.id] || state.cards[word.id].dueAt <= now);
  if (due.length) {
    recommendations.push({ icon: "◇", text: `${due.length} vocabulary card${due.length === 1 ? "" : "s"} ready to review.`, label: "Review cards", view: "cards" });
  }

  const missed = new Map();
  for (const event of state.history.filter((item) => item.type === "quiz" && item.correct === false).slice(-24)) {
    missed.set(event.item, (missed.get(event.item) || 0) + 1);
  }
  const repeated = [...missed.entries()].sort((a, b) => b[1] - a[1]).find(([, count]) => count >= 2);
  if (repeated) {
    const word = VOCAB_BY_ID.get(repeated[0]);
    if (word) recommendations.push({ icon: "↻", text: `Review “${word.latin}” — it has been missed more than once.`, label: "Open cards", view: "cards" });
  }

  const lastCheck = state.selfChecks.at(-1);
  if (!lastCheck || lastCheck.checked.length < 3) {
    recommendations.push({ icon: "◉", text: "Practise the marked stress, then make a quick self-assessment.", label: "Practise", view: "practice" });
  }
  if (!state.hymns["tantum-ergo"]) {
    recommendations.push({ icon: "♪", text: "Try recalling the opening of Tantum Ergo without looking.", label: "Learn hymn", lesson: "tantum" });
  }
  const recentAnswers = state.history.filter((event) => ["quiz", "mass-response"].includes(event.type) && Number.isFinite(event.durationMs)).slice(-8);
  if (recentAnswers.length >= 3) {
    const averageSeconds = recentAnswers.reduce((sum, event) => sum + event.durationMs, 0) / recentAnswers.length / 1000;
    if (averageSeconds > 10) recommendations.push({ icon: "◷", text: "Recent answers are taking a little longer; revisit a short lesson at your own pace.", label: "Choose a lesson", view: "lessons" });
  }
  const massEvents = state.history.filter((event) => event.type === "mass-response").slice(-8);
  if (massEvents.length && massEvents.some((event) => !event.correct)) {
    recommendations.push({ icon: "✝", text: "Practise the Mass responses once more.", label: "At Holy Mass", lesson: "mass" });
  }
  const listening = state.history.filter((event) => event.type === "listening").at(-1);
  if (listening?.correct === false) {
    recommendations.push({ icon: "♫", text: "Replay the reference prayer and try the listening check again.", label: "Listening lab", view: "practice" });
  }
  if (!recommendations.length) recommendations.push({ icon: "✦", text: "Your recent practice is steady. Choose a new lesson or revisit a hymn.", label: "Browse lessons", view: "lessons" });

  $("#recommendations").replaceChildren(...recommendations.slice(0, 4).map((item) => {
    const row = document.createElement("div");
    row.className = "recommendation";
    const icon = document.createElement("span");
    icon.className = "recommend-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = item.icon;
    const text = document.createElement("p");
    text.textContent = item.text;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "text-button";
    button.textContent = item.label;
    if (item.lesson) button.dataset.openLesson = item.lesson;
    else button.dataset.go = item.view;
    row.append(icon, text, button);
    return row;
  }));
}

function openLesson(lessonId) {
  activeLesson = LESSON_BY_ID.get(lessonId);
  if (!activeLesson) return;
  $("#lesson-index").hidden = true;
  $("#lesson-detail").hidden = false;
  $("#lesson-level").textContent = activeLesson.level;
  $("#lesson-name").textContent = activeLesson.title;
  $("#lesson-tag").textContent = activeLesson.tag;
  $("#lesson-intro").textContent = activeLesson.intro;
  $("#lesson-lines").replaceChildren(...activeLesson.lines.map((line, index) => createLessonLine(line, index)));
  $("#hymn-tools").hidden = activeLesson.kind !== "hymn";
  $("#hymn-reveal").textContent = "Hide the Latin";
  if (activeLesson.audio) {
    const audio = $("#reference-audio");
    audio.src = activeLesson.audio;
    audio.hidden = false;
    $(".audio-actions", $(".lesson-audio")).hidden = false;
    $(".speed-control", $(".lesson-audio")).hidden = false;
    $("#lesson-audio-note").textContent = "Bundled reference recording; replay it at normal, slow, very slow, or adjustable speed.";
    $("#audio-credit").textContent = AUDIO_CREDITS[activeLesson.id] || "";
    $("#lesson-open-lab").hidden = true;
  } else {
    $("#reference-audio").removeAttribute("src");
    $("#reference-audio").hidden = true;
    $(".audio-actions", $(".lesson-audio")).hidden = true;
    $(".speed-control", $(".lesson-audio")).hidden = true;
    $("#lesson-audio-note").textContent = "There is no recording bundled for this lesson. Open the Pronunciation Lab for the included ecclesiastical Latin reference recording; local device voices are optional and unverified.";
    $("#audio-credit").textContent = "";
    $("#lesson-open-lab").hidden = false;
  }
  if (activeLesson.kind === "hymn") setHymnMask(true);
  startQuiz();
  refreshVoiceControls();
  showView("lessons");
  $("#lesson-index").hidden = true;
  $("#lesson-detail").hidden = false;
}

function createLessonLine(line, index) {
  const article = document.createElement("article");
  article.className = "lesson-line";
  const latin = document.createElement("p");
  latin.className = "latin";
  latin.lang = "la";
  latin.textContent = line.latin;
  const translation = document.createElement("p");
  translation.className = "translation";
  translation.textContent = line.translation;
  const tools = document.createElement("div");
  tools.className = "line-tools";
  const speak = document.createElement("button");
  speak.type = "button";
  speak.className = "button button-outline word-line-speak";
  speak.dataset.line = String(index);
  speak.textContent = "Play line with local voice";
  speak.disabled = !selectedVoice;
  speak.title = "Optional practice voice only; reference recording is authoritative.";
  tools.append(speak);
  const words = document.createElement("div");
  words.className = "word-play-list";
  for (const token of line.latin.split(/\s+/).filter(Boolean)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "text-button word-button";
    button.dataset.word = token.replace(/^[^A-Za-zÀ-ž]+|[^A-Za-zÀ-ž]+$/g, "");
    button.textContent = token;
    button.disabled = !selectedVoice;
    button.setAttribute("aria-label", `Play ${token} with the selected local voice; not an authoritative reference`);
    words.append(button);
  }
  tools.append(words);
  if (line.syllables) {
    const syllableButton = document.createElement("button");
    syllableButton.type = "button";
    syllableButton.className = "button button-outline syllable-speak";
    syllableButton.dataset.line = String(index);
    syllableButton.textContent = "Play syllables";
    syllableButton.disabled = !selectedVoice;
    syllableButton.title = "Syllable playback uses an optional device voice, not the reference recording.";
    tools.append(syllableButton);
  }
  article.append(latin, translation, tools);
  return article;
}

function startQuiz() {
  if (activeLesson.kind === "mass-response") {
    quizItems = activeLesson.lines.map((line, index) => ({
      id: `${activeLesson.id}-${index}`,
      latin: line.latin.replace(/[.,;]/g, ""),
      english: line.translation
    }));
  } else {
    const words = activeLesson.words.map((id) => VOCAB_BY_ID.get(id)).filter(Boolean);
    quizItems = words.length ? words : VOCAB.slice(0, 4);
  }
  quizIndex = 0;
  renderQuiz();
}

function renderQuiz() {
  const prompt = $("#quiz-prompt");
  const options = $("#quiz-options");
  const feedback = $("#quiz-feedback");
  const next = $("#quiz-next");
  feedback.textContent = "";
  feedback.classList.remove("error");
  options.replaceChildren();
  quizAnswered = false;
  if (quizIndex >= quizItems.length) {
    prompt.textContent = "Practice complete. Your result has been saved on this device.";
    next.hidden = true;
    return;
  }
  const target = quizItems[quizIndex];
  prompt.textContent = `Choose the Latin for “${target.english}”. (${quizIndex + 1} of ${quizItems.length})`;
  quizStartedAt = performance.now();
  const source = activeLesson.kind === "mass-response" ? quizItems : VOCAB;
  const distractors = source.filter((word) => word.id !== target.id);
  const offset = (quizIndex * 3) % distractors.length;
  const rotated = [...distractors.slice(offset), ...distractors.slice(0, offset)];
  const pool = [target, ...rotated.slice(0, 3)];
  const ordered = pool.sort((a, b) => a.id.localeCompare(b.id));
  for (const option of ordered) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-button";
    button.textContent = option.latin;
    button.dataset.answerId = option.id;
    options.append(button);
  }
  next.hidden = true;
}

function answerQuiz(answerId, button) {
  if (quizAnswered || !activeLesson) return;
  quizAnswered = true;
  const target = quizItems[quizIndex];
  const correct = answerId === target.id;
  const durationMs = Math.max(0, Math.round(performance.now() - quizStartedAt));
  const type = activeLesson.kind === "mass-response" ? "mass-response" : "quiz";
  addHistory({ type, item: target.id, lessonId: activeLesson.id, correct, durationMs });
  $$(".choice-button", $("#quiz-options")).forEach((option) => {
    option.disabled = true;
    if (option.dataset.answerId === target.id) option.classList.add("correct");
    else if (option === button && !correct) option.classList.add("incorrect");
  });
  $("#quiz-feedback").textContent = correct
    ? `Correct. Answered in ${(durationMs / 1000).toFixed(1)} seconds.`
    : `Not quite — ${target.latin} means “${target.english}”.`;
  $("#quiz-feedback").classList.toggle("error", !correct);
  $("#quiz-next").hidden = false;
  $("#quiz-next").textContent = quizIndex + 1 === quizItems.length ? "Finish practice" : "Next question";
}

function getDueWords() {
  const now = Date.now();
  return VOCAB.filter((word) => !reviewedCards.has(word.id) && (!state.cards[word.id] || state.cards[word.id].dueAt <= now))
    .sort((a, b) => {
      const aMisses = state.history.filter((event) => event.type === "quiz" && event.item === a.id && !event.correct).length;
      const bMisses = state.history.filter((event) => event.type === "quiz" && event.item === b.id && !event.correct).length;
      return bMisses - aMisses || (state.cards[a.id]?.dueAt || 0) - (state.cards[b.id]?.dueAt || 0);
    });
}

function renderCards() {
  const due = getDueWords();
  $("#card-empty").hidden = due.length !== 0;
  $("#flashcard").hidden = due.length === 0;
  if (!due.length) {
    const allReviewed = reviewedCards.size > 0 && VOCAB.some((word) => !state.cards[word.id] || state.cards[word.id].dueAt <= Date.now());
    $("#card-empty").querySelector("h2").textContent = allReviewed ? "Review complete for now" : "All caught up";
    $("#card-empty").querySelector("p").textContent = allReviewed
      ? "You have reviewed today's due cards. Your answers are saved on this device."
      : "Choose a lesson to add its vocabulary to your review.";
    return;
  }
  currentCard = due[0];
  $("#card-counter").textContent = `${due.length} READY TO REVIEW`;
  $("#card-category").textContent = LESSONS.find((lesson) => lesson.words.includes(currentCard.id))?.tag || "Vocabulary";
  $("#card-front").textContent = currentCard.latin;
  $("#card-hint").textContent = currentCard.syllables.join(" · ");
  $("#card-back").textContent = currentCard.english;
  $("#card-answer").hidden = true;
  $("#card-reveal").hidden = false;
  $("#card-rating").hidden = true;
  $("#card-schedule").textContent = "";
  $("#card-speak").disabled = !selectedVoice;
  $("#card-speak-note").textContent = selectedVoice ? "Optional local device voice; not authoritative." : "Select a local device voice on the Device page to try this.";
}

function rateCard(remembered) {
  if (!currentCard) return;
  const previous = state.cards[currentCard.id] || { dueAt: 0, interval: 0, reps: 0, lapses: 0, reviews: 0 };
  const intervals = [1, 3, 7, 14, 30];
  const reps = remembered ? previous.reps + 1 : 0;
  const interval = remembered ? intervals[Math.min(reps - 1, intervals.length - 1)] : 0;
  state.cards[currentCard.id] = {
    dueAt: remembered ? Date.now() + interval * 86400000 : Date.now(),
    interval,
    reps,
    lapses: previous.lapses + (remembered ? 0 : 1),
    reviews: previous.reviews + 1
  };
  reviewedCards.add(currentCard.id);
  state.history.push({ type: "card", item: currentCard.id, correct: remembered, at: new Date().toISOString() });
  const message = remembered ? `Next review in ${interval} day${interval === 1 ? "" : "s"}.` : "This word will come back again soon.";
  saveProgress();
  $("#card-schedule").textContent = message;
  renderCards();
  showNotice(message);
}

function setHymnMask(masked) {
  $$(".lesson-line .latin", $("#lesson-lines")).forEach((line) => { line.hidden = masked; });
  $("#hymn-reveal").textContent = masked ? "Show the Latin" : "Hide the Latin";
}

function speakText(text, rate = Number($("#tts-rate")?.value || 0.82)) {
  if (!("speechSynthesis" in window) || !selectedVoice || selectedVoice.localService !== true) {
    showNotice("Select a voice reported as a local synthesizer on the Device page. Bundled reference audio remains available.", true);
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = selectedVoice;
  utterance.lang = selectedVoice.lang || "la";
  utterance.rate = rate;
  utterance.onerror = (event) => showNotice(`The selected device voice could not speak this text: ${event.error}.`, true);
  window.speechSynthesis.speak(utterance);
}

function refreshVoiceControls() {
  $$(".word-line-speak, .word-button, .syllable-speak").forEach((button) => { button.disabled = !selectedVoice; });
  const cardSpeak = $("#card-speak");
  if (cardSpeak) cardSpeak.disabled = !selectedVoice;
}

function updateVoices() {
  if (!("speechSynthesis" in window)) {
    voices = [];
    selectedVoice = null;
    renderVoiceList();
    refreshVoiceControls();
    return;
  }
  voices = window.speechSynthesis.getVoices();
  const select = $("#voice-select");
  const previous = select.value;
  select.replaceChildren(new Option("No local voice selected", ""));
  voices.forEach((voice, index) => {
    const option = new Option(`${voice.name} — ${voice.lang}${voice.localService ? " (local)" : " (remote)"}`, String(index));
    option.disabled = voice.localService !== true;
    option.dataset.local = String(voice.localService === true);
    select.add(option);
  });
  if (previous && voices[Number(previous)]?.localService === true) select.value = previous;
  selectedVoice = select.value && voices[Number(select.value)]?.localService === true ? voices[Number(select.value)] : null;
  renderVoiceList();
  refreshVoiceControls();
}

function renderVoiceList() {
  const list = $("#voice-list");
  if (!("speechSynthesis" in window)) {
    list.replaceChildren(Object.assign(document.createElement("li"), { textContent: "Browser speech synthesis is not available." }));
    return;
  }
  const localLatin = voices.some((voice) => voice.localService === true && /^la(?:-|$)/i.test(voice.lang));
  $("#voice-selected-note").textContent = localLatin
    ? "A local voice reports Latin support; its pronunciation quality still needs listening and the reference recording remains authoritative."
    : "No local voice reports Latin support. A selected local voice may still be tried, but it may pronounce Latin incorrectly; reference audio remains authoritative.";
  if (!voices.length) {
    list.replaceChildren(Object.assign(document.createElement("li"), { textContent: "No voices have been reported yet; check again after device voices load." }));
    return;
  }
  list.replaceChildren(...voices.map((voice) => {
    const item = document.createElement("li");
    const latin = /^la(?:-|$)/i.test(voice.lang) ? " · reports Latin" : "";
    const local = voice.localService === true
      ? "local synthesizer; offline operation not independently verified"
      : "remote service; never used";
    item.textContent = `${voice.name} (${voice.lang}) — ${local}${latin}`;
    return item;
  }));
}

function updateNetworkStatus() {
  const pill = $("#network-status");
  const online = navigator.onLine;
  pill.textContent = online ? "Online" : "Offline";
  pill.classList.toggle("offline", !online);
  pill.title = "Browser connection signal; cached lessons and audio remain available offline.";
}

function browserLabel() {
  const ua = navigator.userAgent || "";
  const android = /Android/i.test(ua);
  const browser = /SamsungBrowser\/([\d.]+)/.exec(ua) ? `Samsung Internet ${RegExp.$1}`
    : /EdgA?\/([\d.]+)/.exec(ua) ? `Edge ${RegExp.$1}`
      : /Chrome\/([\d.]+)/.exec(ua) ? `Chrome ${RegExp.$1}`
        : /Firefox\/([\d.]+)/.exec(ua) ? `Firefox ${RegExp.$1}`
          : /Version\/([\d.]+).*Safari/.exec(ua) ? `Safari ${RegExp.$1}`
            : "Browser not identified";
  return `${browser}${android ? " on Android" : ""}`;
}

function setDefinitionList(list, entries) {
  list.replaceChildren(...entries.flatMap(([label, value]) => {
    const term = document.createElement("dt");
    term.textContent = label;
    const description = document.createElement("dd");
    description.textContent = value;
    return [term, description];
  }));
}

async function checkCachedAssets() {
  if (!("caches" in window)) return "Cache Storage is unavailable";
  try {
    const cache = await caches.open(CACHE_NAME);
    const missing = [];
    for (const path of CORE_PATHS) {
      if (!await cache.match(new URL(path, location.href).href)) missing.push(path.replace("./", ""));
    }
    return missing.length ? `Not fully cached (${missing.join(", ")})` : "All essential assets cached";
  } catch (error) {
    return `Cache check failed: ${error.message}`;
  }
}

async function probeLocalRecognition() {
  recognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  const recognitionList = $("#recognition-capabilities");
  const labCard = $("#recognition-card");
  const labStatus = $("#recognition-lab-status");
  const installButton = $("#recognition-install");
  const startButton = $("#recognition-start");
  const prototype = recognitionConstructor?.prototype;
  const hasLocalControls = !!recognitionConstructor &&
    !!prototype && "processLocally" in prototype &&
    typeof recognitionConstructor.available === "function";

  if (!hasLocalControls) {
    latinRecognitionStatus = "unsupported";
    recognitionMessage = "No local-only recognition API is exposed in this browser.";
    setDefinitionList(recognitionList, [
      ["Recognition API", recognitionConstructor ? "Present, but local-only controls are missing" : "Not exposed"],
      ["Local processing", "Unavailable or not verifiable"],
      ["Latin language pack", "Cannot be checked in this browser"],
      ["Remote recognition", "Never used by this app"]
    ]);
    labCard.hidden = true;
    installButton.hidden = true;
    return;
  }

  try {
    const result = await recognitionConstructor.available({ langs: ["la"], processLocally: true });
    latinRecognitionStatus = result;
    recognitionProbeError = "";
    const availableText = result === "available" ? "Available locally"
      : result === "downloadable" ? "Not installed; local pack can be requested"
        : result === "downloading" ? "Local language pack is downloading"
          : result === "unavailable" ? "Latin is not available for local recognition"
            : `Browser reported: ${result}`;
    recognitionMessage = `${availableText}.`;
    setDefinitionList(recognitionList, [
      ["Recognition API", "Exposed with explicit local-processing controls"],
      ["Local processing", "Required; remote fallback is disabled"],
      ["Latin language pack", availableText],
      ["Remote recognition", "Never used by this app"]
    ]);
    labCard.hidden = result === "unavailable";
    labStatus.textContent = result === "available"
      ? "Latin is reported available on-device. Recognition will set processLocally = true and never fall back to a remote service."
      : result === "downloadable"
        ? "A local Latin pack is available to install. The browser may download the pack after you confirm."
        : availableText;
    startButton.disabled = result !== "available";
    installButton.hidden = result !== "downloadable" || typeof recognitionConstructor.install !== "function";
  } catch (error) {
    latinRecognitionStatus = "error";
    recognitionProbeError = error.message;
    recognitionMessage = `Local language support could not be verified: ${error.message}`;
    setDefinitionList(recognitionList, [
      ["Recognition API", "Present"],
      ["Local processing", "Could not be verified"],
      ["Latin language pack", "Unknown"],
      ["Remote recognition", "Never used by this app"]
    ]);
    labCard.hidden = true;
    installButton.hidden = true;
  }
}

async function refreshCapabilities() {
  updateVoices();
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
  const microphone = !!navigator.mediaDevices?.getUserMedia && typeof window.MediaRecorder !== "undefined";
  const controller = !!navigator.serviceWorker?.controller;
  const cacheStatus = await checkCachedAssets();
  const localLatin = voices.some((voice) => voice.localService === true && /^la(?:-|$)/i.test(voice.lang));
  setDefinitionList($("#basic-capabilities"), [
    ["Browser / device", browserLabel()],
    ["Network signal", navigator.onLine ? "Browser reports online (may be approximate)" : "Browser reports offline"],
    ["PWA display", standalone ? "Installed / standalone" : "Running in browser"],
    ["Service worker", controller ? "Controlling this page" : "Not controlling yet; reload after first visit"],
    ["Essential assets", cacheStatus],
    ["System TTS", "speechSynthesis" in window ? `${voices.length} voice(s) reported` : "Not exposed"],
    ["Local Latin voice", localLatin ? "Reported; pronunciation quality unverified" : "None reported"],
    ["Browser on-device AI", "LanguageModel" in window ? "API exposed; not used by this tutor" : "No local model API exposed"],
    ["Android Gemini Nano / ML Kit", "Native Android app APIs; not callable from this website"],
    ["Microphone recording", microphone ? "Supported; permission requested only on tap" : "Not supported in this browser/context"]
  ]);
  await probeLocalRecognition();
}

function normalizedWords(text) {
  return text.toLocaleLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\s]/g, " ")
    .trim().split(/\s+/).filter(Boolean);
}

function transcriptSimilarity(actual, expected) {
  const left = normalizedWords(actual);
  const right = normalizedWords(expected);
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i++) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j++) {
      const above = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (left[i - 1] === right[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  const denominator = Math.max(left.length, right.length);
  return denominator ? Math.round((1 - row[right.length] / denominator) * 100) : 100;
}

async function installLatinPack() {
  if (latinRecognitionStatus !== "downloadable" || typeof recognitionConstructor?.install !== "function") return;
  const accepted = window.confirm("Your browser may download a Latin speech-recognition language pack. Recognition itself will be required to run on-device; the app never enables remote recognition. Continue?");
  if (!accepted) return;
  $("#recognition-install").disabled = true;
  $("#recognition-note").textContent = "Requesting the local Latin pack from the browser. The app will not switch to a remote recognizer.";
  try {
    await recognitionConstructor.install({ langs: ["la"] });
    await probeLocalRecognition();
    showNotice("The browser completed the local language-pack request. Check the detected status before using recognition.");
  } catch (error) {
    $("#recognition-note").textContent = `The browser could not install the local Latin pack: ${error.message}`;
    showNotice(`Local language-pack installation failed: ${error.message}`, true);
  } finally {
    $("#recognition-install").disabled = false;
  }
}

function startLocalRecognition() {
  if (latinRecognitionStatus !== "available" || !recognitionConstructor) {
    showNotice("Local Latin recognition has not been verified as available. No recognition was started.", true);
    return;
  }
  const recognizer = new recognitionConstructor();
  recognizer.lang = "la";
  recognizer.processLocally = true;
  recognizer.continuous = false;
  recognizer.interimResults = false;
  $("#recognition-start").disabled = true;
  $("#recognition-result").textContent = "Listening locally for Latin speech…";
  recognizer.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript || "";
    if (!transcript) {
      $("#recognition-result").textContent = "The local recognizer returned no transcript.";
      return;
    }
    const expected = LESSON_BY_ID.get("ave").lines.map((line) => line.latin).join(" ");
    const similarity = transcriptSimilarity(transcript, expected);
    $("#recognition-result").textContent = `Transcript: “${transcript}” · Transcript similarity: ${similarity}%. This compares recognized text only, not pronunciation quality.`;
    addHistory({ type: "recognition", item: "ave-maria-transcript", similarity });
  };
  recognizer.onerror = (event) => {
    $("#recognition-result").textContent = `Local recognition failed: ${event.error}. Remote recognition was not attempted.`;
    showNotice(`Local recognition failed: ${event.error}.`, true);
  };
  recognizer.onend = () => { $("#recognition-start").disabled = latinRecognitionStatus !== "available"; };
  try {
    recognizer.start();
  } catch (error) {
    $("#recognition-result").textContent = `Could not start local recognition: ${error.message}. Remote recognition was not attempted.`;
    $("#recognition-start").disabled = false;
  }
}

function setAudioRate(audio, speed, slider, output) {
  audio.playbackRate = Number(speed);
  if (slider) slider.value = String(speed);
  if (output) output.value = `${Number(speed).toFixed(2)}×`;
}

function bindAudioControls(audioSelector, speedSelector, repeatSelector, sliderSelector, outputSelector) {
  const audio = $(audioSelector);
  $$(speedSelector).forEach((button) => button.addEventListener("click", () => setAudioRate(audio, button.dataset.speed, $(sliderSelector), $(outputSelector))));
  $(repeatSelector).addEventListener("click", (event) => {
    audio.loop = !audio.loop;
    event.currentTarget.textContent = `Repeat: ${audio.loop ? "on" : "off"}`;
    event.currentTarget.setAttribute("aria-pressed", String(audio.loop));
  });
  $(sliderSelector).addEventListener("input", (event) => setAudioRate(audio, event.target.value, event.target, $(outputSelector)));
  audio.addEventListener("error", () => {
    if (audio.getAttribute("src")) showNotice("The bundled audio could not be loaded. Check that the app finished caching, then reload.", true);
  });
}

async function startRecording() {
  if (!navigator.mediaDevices?.getUserMedia || typeof window.MediaRecorder === "undefined") {
    $("#record-status").textContent = "Recording is not supported in this browser or secure context.";
    $("#record-status").classList.add("error");
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data.size) recordedChunks.push(event.data);
    });
    mediaRecorder.addEventListener("error", (event) => {
      $("#record-status").textContent = `Recording failed: ${event.error?.message || "media recorder error"}.`;
      $("#record-status").classList.add("error");
    });
    mediaRecorder.addEventListener("stop", () => {
      stream.getTracks().forEach((track) => track.stop());
      if (!recordedChunks.length) {
        $("#record-status").textContent = "No audio was captured.";
        return;
      }
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
      const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || "audio/webm" });
      recordingUrl = URL.createObjectURL(blob);
      $("#learner-audio").src = recordingUrl;
      $("#learner-audio").hidden = false;
      $("#play-recording").disabled = false;
      $("#record-status").textContent = "Recording ready. It is held in this page only and has not been uploaded.";
      $("#record-status").classList.remove("error");
    });
    mediaRecorder.start();
    $("#record-button").textContent = "■ Stop recording";
    $("#record-button").classList.add("recording");
    $("#record-status").textContent = "Recording on this device…";
    $("#record-status").classList.remove("error");
  } catch (error) {
    $("#record-status").textContent = `Microphone unavailable: ${error.message}. Check this site's browser permission and HTTPS connection.`;
    $("#record-status").classList.add("error");
    showNotice(`Recording could not start: ${error.message}`, true);
  }
}

function stopRecording() {
  if (mediaRecorder?.state === "recording") {
    mediaRecorder.stop();
    $("#record-button").textContent = "● Start recording";
    $("#record-button").classList.remove("recording");
  }
}

function saveSelfCheck() {
  const checked = $$("input[type=checkbox]:checked", $("#self-check")).map((input) => input.value);
  state.selfChecks.push({ at: new Date().toISOString(), checked });
  state.selfChecks = state.selfChecks.slice(-500);
  const saved = addHistory({ type: "self-check", item: "ave-maria", correct: checked.length >= 3 });
  $("#self-check-status").textContent = saved
    ? `Self-check saved: ${checked.length} of 4 items checked. This is your own reflection, not an automated pronunciation score.`
    : "The self-check could not be saved. Your browser may have blocked local storage.";
}

function answerListening(event) {
  const button = event.target.closest("[data-listen-answer]");
  if (!button) return;
  const correct = button.dataset.listenAnswer === "ending";
  $$(".choice-button", $("#listening-options")).forEach((option) => {
    option.disabled = true;
    if (option.dataset.listenAnswer === "ending") option.classList.add("correct");
    else if (option === button && !correct) option.classList.add("incorrect");
  });
  $("#listening-result").textContent = correct ? "Correct — you heard the prayer's closing words." : "Not quite. The prayer closes, “Et in hora mortis nostrae. Amen.”";
  $("#listening-result").classList.toggle("error", !correct);
  addHistory({ type: "listening", item: "ave-maria-ending", correct });
}

function renderListeningOptions() {
  const options = [
    ["ending", "Et in hora mortis nostrae. Amen."],
    ["mass", "Et cum spiritu tuo."],
    ["pater", "Sed libera nos a malo."],
    ["gloria", "Et in saecula saeculorum."]
  ];
  $("#listening-options").replaceChildren(...options.map(([id, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-button";
    button.dataset.listenAnswer = id;
    button.textContent = label;
    return button;
  }));
}

function exportProgress() {
  const payload = {
    app: "Vox Liturgiae",
    version: 1,
    exportedAt: new Date().toISOString(),
    progress: state
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `vox-liturgiae-progress-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  $("#data-status").textContent = "Progress export created locally.";
}

async function importProgress(file) {
  if (file.size > 1024 * 1024) throw new Error("file exceeds the 1 MB limit");
  const parsed = JSON.parse(await file.text());
  const imported = sanitizeProgress(parsed.progress);
  if (!window.confirm("Replace progress in this browser with the imported file? This does not upload data.")) return;
  state = imported;
  persistenceBlocked = false;
  if (!saveProgress()) throw new Error("the browser could not save the imported progress");
  $("#data-status").textContent = "Progress imported and saved locally.";
  renderCards();
  renderHome();
}

function bindEvents() {
  $$(".nav-button").forEach((button) => button.addEventListener("click", () => showView(button.dataset.viewTarget)));
  document.addEventListener("click", (event) => {
    const go = event.target.closest("[data-go]");
    if (go) showView(go.dataset.go);
    const open = event.target.closest("[data-open-lesson]");
    if (open) openLesson(open.dataset.openLesson);
  });
  $("#lesson-back").addEventListener("click", () => {
    activeLesson = null;
    $("#lesson-index").hidden = false;
    $("#lesson-detail").hidden = true;
  });
  $("#quiz-options").addEventListener("click", (event) => {
    const button = event.target.closest("[data-answer-id]");
    if (button) answerQuiz(button.dataset.answerId, button);
  });
  $("#quiz-next").addEventListener("click", () => {
    if (quizIndex < quizItems.length) quizIndex += 1;
    renderQuiz();
  });
  $("#card-reveal").addEventListener("click", () => {
    $("#card-answer").hidden = false;
    $("#card-reveal").hidden = true;
    $("#card-rating").hidden = false;
  });
  $("#card-again").addEventListener("click", () => rateCard(false));
  $("#card-good").addEventListener("click", () => rateCard(true));
  $("#card-speak").addEventListener("click", () => currentCard && speakText(currentCard.latin));
  $("#voice-select").addEventListener("change", (event) => {
    const voice = voices[Number(event.target.value)];
    selectedVoice = voice?.localService === true ? voice : null;
    refreshVoiceControls();
    if (selectedVoice) showNotice(`Selected ${selectedVoice.name} (${selectedVoice.lang}). This optional device voice is not an authoritative Latin reference.`);
  });
  $("#tts-rate").addEventListener("input", (event) => {
    $("#tts-rate-value").value = `${Number(event.target.value).toFixed(2)}×`;
  });
  $("#lesson-lines").addEventListener("click", (event) => {
    const wordButton = event.target.closest("[data-word]");
    const lineButton = event.target.closest(".word-line-speak");
    const syllableButton = event.target.closest(".syllable-speak");
    if (wordButton && selectedVoice) speakText(wordButton.dataset.word);
    if ((lineButton || syllableButton) && selectedVoice && activeLesson) {
      const line = activeLesson.lines[Number((lineButton || syllableButton).dataset.line)];
      const text = syllableButton && line.syllables ? line.syllables.join(" … ") : line.latin;
      speakText(text);
    }
  });
  $("#hymn-reveal").addEventListener("click", () => {
    const isMasked = $("#hymn-reveal").textContent === "Show the Latin";
    setHymnMask(!isMasked);
  });
  $("#hymn-remembered").addEventListener("click", () => {
    state.hymns["tantum-ergo"] = true;
    addHistory({ type: "hymn", item: "tantum-ergo", correct: true });
    showNotice("Hymn recall noted. Keep practising it over time.");
  });
  $("#record-button").addEventListener("click", () => mediaRecorder?.state === "recording" ? stopRecording() : startRecording());
  $("#play-recording").addEventListener("click", () => $("#learner-audio").play().catch((error) => showNotice(`Recording could not play: ${error.message}`, true)));
  $("#save-self-check").addEventListener("click", saveSelfCheck);
  $("#listening-play").addEventListener("click", () => $("#lab-audio").play().catch((error) => showNotice(`Reference audio could not play: ${error.message}`, true)));
  $("#listening-options").addEventListener("click", answerListening);
  $("#recognition-install").addEventListener("click", installLatinPack);
  $("#recognition-start").addEventListener("click", startLocalRecognition);
  $("#refresh-capabilities").addEventListener("click", refreshCapabilities);
  $("#export-data").addEventListener("click", exportProgress);
  $("#import-button").addEventListener("click", () => $("#import-file").click());
  $("#import-file").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await importProgress(file);
    } catch (error) {
      $("#data-status").textContent = `Import failed: ${error.message}`;
      showNotice(`Progress import failed: ${error.message}`, true);
    } finally {
      event.target.value = "";
    }
  });
  $("#pause-lab").addEventListener("click", () => $("#lab-audio").pause());
  $("#pause-reference").addEventListener("click", () => $("#reference-audio").pause());
  bindAudioControls("#reference-audio", ".speed-button", "#repeat-button", "#reference-speed", "#reference-speed-value");
  bindAudioControls("#lab-audio", ".lab-speed", "#lab-repeat", "#lab-speed", "#lab-speed-value");
  window.addEventListener("online", updateNetworkStatus);
  window.addEventListener("offline", updateNetworkStatus);
  if ("speechSynthesis" in window) window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    window.deferredInstallPrompt = event;
    $("#install-button").hidden = false;
  });
  $("#install-button").addEventListener("click", async () => {
    if (!window.deferredInstallPrompt) return;
    window.deferredInstallPrompt.prompt();
    await window.deferredInstallPrompt.userChoice;
    window.deferredInstallPrompt = null;
    $("#install-button").hidden = true;
  });
  window.addEventListener("appinstalled", () => showNotice("Vox Liturgiae has been installed."));
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    showNotice("Offline caching is unavailable in this browser. The site still works while this page remains open.", true);
    return;
  }
  try {
    await navigator.serviceWorker.register("./sw.js");
    navigator.serviceWorker.addEventListener("controllerchange", () => refreshCapabilities());
  } catch (error) {
    showNotice(`Offline caching could not start: ${error.message}. Open this site over HTTPS and reload.`, true);
  }
}

renderLessonLists();
renderListeningOptions();
bindEvents();
updateNetworkStatus();
updateVoices();
renderHome();
registerServiceWorker();
