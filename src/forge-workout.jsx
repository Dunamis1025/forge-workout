import { useState, useEffect, useRef } from "react";

const MUSCLE_GROUPS = [
  { id: "chest", name: "가슴", en: "Chest", emoji: "🎯", subtags: [
    { id: "chest_upper", name: "윗가슴", en: "Upper Chest" },
    { id: "chest_mid", name: "중간가슴", en: "Mid Chest" },
    { id: "chest_lower", name: "아랫가슴", en: "Lower Chest" },
  ]},
  { id: "back", name: "등", en: "Back", emoji: "🔙", subtags: [
    { id: "back_lat", name: "광배근(펼치기)", en: "Lats (Width)" },
    { id: "back_row", name: "당기는 등(로우)", en: "Rows (Thickness)" },
  ]},
  { id: "legs", name: "다리", en: "Legs", emoji: "🦵", subtags: [
    { id: "legs_quad", name: "허벅지 앞(대퇴사두)", en: "Quads" },
    { id: "legs_ham", name: "허벅지 뒤(햄스트링)", en: "Hamstrings" },
  ]},
  { id: "shoulders", name: "어깨", en: "Shoulders", emoji: "🏔️", subtags: [
    { id: "shoulders_all", name: "어깨 전체", en: "All Shoulders" },
  ]},
  { id: "arms", name: "팔", en: "Arms", emoji: "💪", subtags: [
    { id: "arms_biceps", name: "이두", en: "Biceps" },
    { id: "arms_triceps", name: "삼두", en: "Triceps" },
  ]},
  { id: "free", name: "자유/보충", en: "Free / Extra", emoji: "✨", subtags: [
    { id: "free_any", name: "자유 운동", en: "Free Workout" },
  ]},
];

const EXERCISE_PRESETS = {
  // 순서: 머신/케이블/덤벨 먼저, 바벨(랙) 운동은 뒤쪽. 기존 이름은 그대로 유지(과거 기록 연결 보존)
  chest_upper: ["인클라인 머신 프레스", "인클라인 덤벨 프레스", "로우-투-하이 케이블 플라이", "인클라인 덤벨 플라이", "스미스머신 인클라인 프레스", "인클라인 바벨 프레스"],
  chest_mid: ["체스트 프레스 머신", "플랫 덤벨 프레스", "펙덱 플라이", "케이블 크로스오버", "덤벨 플라이", "스미스머신 벤치프레스", "푸쉬업", "플랫 바벨 프레스"],
  chest_lower: ["디클라인 머신 프레스", "하이-투-로우 케이블 플라이", "로우 케이블 프레스", "디클라인 덤벨 프레스", "어시스티드 딥 머신", "딥스", "디클라인 프레스"],
  back_lat: ["랫풀다운", "랫풀다운 (V바/클로즈그립)", "원암 케이블 랫풀다운", "다이버징 랫풀다운 머신", "머신 풀오버", "케이블 풀오버", "스트레이트암 풀다운", "어시스티드 풀업 머신", "풀업", "친업"],
  back_row: ["시티드 케이블 로우", "시티드 로우 머신", "하이 로우 머신", "체스트 서포트 로우 머신", "원암 케이블 로우", "원암 덤벨 로우", "인클라인 덤벨 로우", "T바 로우", "바벨 로우"],
  legs_quad: ["레그프레스", "레그 익스텐션", "핵스쿼트 머신", "스미스머신 스쿼트", "고블릿 스쿼트", "덤벨 런지", "불가리안 스플릿 스쿼트", "핵스쿼트", "스쿼트"],
  legs_ham: ["레그컬", "라잉 레그컬", "시티드 레그컬", "덤벨 루마니안 데드리프트", "힙 어브덕션 머신", "힙 어덕션 머신", "백 익스텐션", "힙쓰러스트", "루마니안 데드리프트", "굿모닝"],
  shoulders_all: ["숄더 프레스 머신", "덤벨 숄더 프레스", "사이드 레터럴 레이즈", "케이블 레터럴 레이즈", "머신 레터럴 레이즈", "리어델트 머신(리버스 펙덱)", "리어델트 플라이", "페이스풀", "프론트 레이즈", "케이블 업라이트 로우", "덤벨 슈러그", "밀리터리 프레스"],
  arms_biceps: ["덤벨 컬", "인클라인 덤벨 컬", "해머 컬", "케이블 컬", "케이블 로프 해머 컬", "프리처 컬 머신", "컨센트레이션 컬", "바벨 컬"],
  arms_triceps: ["케이블 푸시다운", "케이블 푸시다운 (로프)", "원암 케이블 푸시다운", "오버헤드 익스텐션", "덤벨 오버헤드 익스텐션", "트라이셉스 딥 머신", "덤벨 킥백", "딥스", "클로즈그립 벤치프레스"],
  free_any: ["케이블 크런치", "앱 크런치 머신", "행잉 레그레이즈", "카프 레이즈 머신", "힙 어브덕션 머신", "힙 어덕션 머신", "덤벨 슈러그"],
};

// 영어 표시용 이름. 기록에는 항상 한글 이름 그대로 저장하고, 화면에 보여줄 때만 번역 (과거 기록/진행 그래프 연결 유지)
const EX_EN = {
  "인클라인 머신 프레스": "Incline Machine Press",
  "인클라인 덤벨 프레스": "Incline Dumbbell Press",
  "로우-투-하이 케이블 플라이": "Low-to-High Cable Fly",
  "인클라인 덤벨 플라이": "Incline Dumbbell Fly",
  "스미스머신 인클라인 프레스": "Smith Machine Incline Press",
  "인클라인 바벨 프레스": "Incline Barbell Press",
  "체스트 프레스 머신": "Chest Press Machine",
  "플랫 덤벨 프레스": "Flat Dumbbell Press",
  "펙덱 플라이": "Pec Deck Fly",
  "케이블 크로스오버": "Cable Crossover",
  "덤벨 플라이": "Dumbbell Fly",
  "스미스머신 벤치프레스": "Smith Machine Bench Press",
  "푸쉬업": "Push-Up",
  "플랫 바벨 프레스": "Flat Barbell Press",
  "디클라인 머신 프레스": "Decline Machine Press",
  "하이-투-로우 케이블 플라이": "High-to-Low Cable Fly",
  "로우 케이블 프레스": "Low Cable Press",
  "디클라인 덤벨 프레스": "Decline Dumbbell Press",
  "어시스티드 딥 머신": "Assisted Dip Machine",
  "딥스": "Dips",
  "디클라인 프레스": "Decline Press",
  "랫풀다운": "Lat Pulldown",
  "랫풀다운 (V바/클로즈그립)": "Lat Pulldown (V-Bar / Close Grip)",
  "원암 케이블 랫풀다운": "One-Arm Cable Lat Pulldown",
  "다이버징 랫풀다운 머신": "Diverging Lat Pulldown Machine",
  "머신 풀오버": "Machine Pullover",
  "케이블 풀오버": "Cable Pullover",
  "스트레이트암 풀다운": "Straight-Arm Pulldown",
  "어시스티드 풀업 머신": "Assisted Pull-Up Machine",
  "풀업": "Pull-Up",
  "친업": "Chin-Up",
  "시티드 케이블 로우": "Seated Cable Row",
  "시티드 로우 머신": "Seated Row Machine",
  "하이 로우 머신": "High Row Machine",
  "체스트 서포트 로우 머신": "Chest-Supported Row Machine",
  "원암 케이블 로우": "One-Arm Cable Row",
  "원암 덤벨 로우": "One-Arm Dumbbell Row",
  "인클라인 덤벨 로우": "Incline Dumbbell Row",
  "T바 로우": "T-Bar Row",
  "바벨 로우": "Barbell Row",
  "레그프레스": "Leg Press",
  "레그 익스텐션": "Leg Extension",
  "핵스쿼트 머신": "Hack Squat Machine",
  "스미스머신 스쿼트": "Smith Machine Squat",
  "고블릿 스쿼트": "Goblet Squat",
  "덤벨 런지": "Dumbbell Lunge",
  "불가리안 스플릿 스쿼트": "Bulgarian Split Squat",
  "핵스쿼트": "Hack Squat",
  "스쿼트": "Squat",
  "레그컬": "Leg Curl",
  "라잉 레그컬": "Lying Leg Curl",
  "시티드 레그컬": "Seated Leg Curl",
  "덤벨 루마니안 데드리프트": "Dumbbell Romanian Deadlift",
  "힙 어브덕션 머신": "Hip Abduction Machine",
  "힙 어덕션 머신": "Hip Adduction Machine",
  "백 익스텐션": "Back Extension",
  "힙쓰러스트": "Hip Thrust",
  "루마니안 데드리프트": "Romanian Deadlift",
  "굿모닝": "Good Morning",
  "숄더 프레스 머신": "Shoulder Press Machine",
  "덤벨 숄더 프레스": "Dumbbell Shoulder Press",
  "사이드 레터럴 레이즈": "Side Lateral Raise",
  "케이블 레터럴 레이즈": "Cable Lateral Raise",
  "머신 레터럴 레이즈": "Machine Lateral Raise",
  "리어델트 머신(리버스 펙덱)": "Rear Delt Machine (Reverse Pec Deck)",
  "리어델트 플라이": "Rear Delt Fly",
  "페이스풀": "Face Pull",
  "프론트 레이즈": "Front Raise",
  "케이블 업라이트 로우": "Cable Upright Row",
  "덤벨 슈러그": "Dumbbell Shrug",
  "밀리터리 프레스": "Military Press",
  "덤벨 컬": "Dumbbell Curl",
  "인클라인 덤벨 컬": "Incline Dumbbell Curl",
  "해머 컬": "Hammer Curl",
  "케이블 컬": "Cable Curl",
  "케이블 로프 해머 컬": "Cable Rope Hammer Curl",
  "프리처 컬 머신": "Preacher Curl Machine",
  "컨센트레이션 컬": "Concentration Curl",
  "바벨 컬": "Barbell Curl",
  "케이블 푸시다운": "Cable Pushdown",
  "케이블 푸시다운 (로프)": "Cable Pushdown (Rope)",
  "원암 케이블 푸시다운": "One-Arm Cable Pushdown",
  "오버헤드 익스텐션": "Overhead Extension",
  "덤벨 오버헤드 익스텐션": "Dumbbell Overhead Extension",
  "트라이셉스 딥 머신": "Triceps Dip Machine",
  "덤벨 킥백": "Dumbbell Kickback",
  "클로즈그립 벤치프레스": "Close-Grip Bench Press",
  "케이블 크런치": "Cable Crunch",
  "앱 크런치 머신": "Ab Crunch Machine",
  "행잉 레그레이즈": "Hanging Leg Raise",
  "카프 레이즈 머신": "Calf Raise Machine",
};
const EN_TO_KO = Object.fromEntries(Object.entries(EX_EN).map(([ko, en]) => [en.toLowerCase(), ko]));
function canonicalName(name) { return EN_TO_KO[name.trim().toLowerCase()] || name.trim(); }

const CARDIO_TYPES = ["러닝머신", "사이클", "일립티컬", "로잉머신", "스텝퍼", "기타"];
const CARDIO_EN = { "러닝머신": "Treadmill", "사이클": "Cycle", "일립티컬": "Elliptical", "로잉머신": "Rowing Machine", "스텝퍼": "Stepper", "기타": "Other" };

const STORAGE_KEY = "forge_sessions_v3";
const CUSTOM_EX_KEY = "forge_custom_exercises_v1";
const LANG_KEY = "forge_lang_v1";
const DEFAULT_REST = 90;
const PRESET_VISIBLE = 8;

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
// 기기 현지 날짜 기준 (UTC 기준이면 호주처럼 시차가 큰 곳에서 오전 운동이 '어제'로 저장됨)
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function nowHHMM() { return new Date().toTimeString().slice(0, 5); }

// 이전 버전(flat sets) 데이터를 rounds 구조로 자동 변환 — 기존 기록 보존
function normalizeSessions(raw) {
  return (Array.isArray(raw) ? raw : []).map(s => ({
    id: s.id || uid(),
    date: s.date,
    startTime: s.startTime || "",
    endTime: s.endTime || "",
    cardio: s.cardio || [],
    entries: (s.entries || []).map(e => ({
      id: e.id || uid(),
      groupId: e.groupId,
      subtagId: e.subtagId,
      exerciseName: e.exerciseName,
      restSeconds: e.restSeconds || DEFAULT_REST,
      rounds: e.rounds && e.rounds.length ? e.rounds : [{ id: uid(), sets: e.sets || [{ weight: "", reps: "" }] }],
    })),
  })).filter(s => s.date);
}

function loadSessions() {
  try { return normalizeSessions(JSON.parse(localStorage.getItem(STORAGE_KEY)) || []); } catch { return []; }
}
function saveSessions(s) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {} }
function loadCustomExercises() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_EX_KEY)) || {}; } catch { return {}; }
}
function saveCustomExercises(m) { try { localStorage.setItem(CUSTOM_EX_KEY, JSON.stringify(m)); } catch {} }
function loadLang() {
  try { return localStorage.getItem(LANG_KEY) === "en" ? "en" : "ko"; } catch { return "ko"; }
}

function daysAgoLabel(dateStr, lang) {
  const en = lang === "en";
  if (!dateStr) return en ? "No record" : "기록 없음";
  const diff = Math.round((new Date(todayISO()) - new Date(dateStr)) / 86400000);
  if (diff === 0) return en ? "Today" : "오늘";
  if (diff === 1) return en ? "Yesterday" : "어제";
  return en ? `${diff}d ago` : `${diff}일 전`;
}

function formatDate(dateStr, lang) {
  const d = new Date(dateStr);
  if (lang === "en") {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
  }
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}

function formatDuration(start, end, lang) {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  const h = Math.floor(mins / 60), m = mins % 60;
  if (lang === "en") return h > 0 ? `${h}h ${m}m` : `${m}m`;
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
}

function formatSecs(sec) {
  const s = Math.max(0, sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function getLastDoneMap(sessions, excludeToday) {
  const map = {};
  const sorted = [...sessions]
    .filter(s => !excludeToday || s.date !== todayISO())
    .sort((a, b) => b.date.localeCompare(a.date));
  for (const s of sorted) {
    for (const e of s.entries) {
      if (!map[e.subtagId]) map[e.subtagId] = s.date;
    }
  }
  return map;
}

function getAllExerciseNames(sessions) {
  const set = new Set();
  sessions.forEach(s => s.entries.forEach(e => set.add(e.exerciseName)));
  return Array.from(set).sort();
}

function getExerciseHistory(sessions, exerciseName, excludeDate) {
  const sorted = [...sessions].filter(s => s.date !== excludeDate).sort((a, b) => b.date.localeCompare(a.date));
  for (const s of sorted) {
    const e = s.entries.find(en => en.exerciseName === exerciseName);
    if (e) return { date: s.date, rounds: e.rounds };
  }
  return null;
}

function getProgressForExercise(sessions, exerciseName) {
  return sessions
    .filter(s => s.entries.some(e => e.exerciseName === exerciseName))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(s => {
      const e = s.entries.find(en => en.exerciseName === exerciseName);
      const weights = e.rounds.flatMap(r => r.sets).map(st => parseFloat(st.weight)).filter(w => !isNaN(w));
      const maxW = weights.length ? Math.max(...weights) : null;
      return maxW !== null ? { date: s.date, weight: maxW } : null;
    })
    .filter(Boolean);
}

function formatRoundsCompact(rounds) {
  return rounds.map(r => r.sets.map(s => `${s.weight || 0}×${s.reps || 0}`).join(", ")).join(" / ");
}

function totalSetsOf(entry) { return entry.rounds.reduce((sum, r) => sum + r.sets.length, 0); }

const HAS_AI_KEY = !!process.env.REACT_APP_ANTHROPIC_API_KEY;

export default function WorkoutTracker() {
  const [tab, setTab] = useState("today");
  const [lang, setLang] = useState(() => loadLang());
  const [sessions, setSessions] = useState(() => loadSessions());
  const [toast, setToast] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState(MUSCLE_GROUPS[0].id);
  const [selectedSubtagId, setSelectedSubtagId] = useState(MUSCLE_GROUPS[0].subtags[0].id);
  const [exerciseInput, setExerciseInput] = useState("");
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);
  const [progressExercise, setProgressExercise] = useState("");
  const [aiNote, setAiNote] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [aiError, setAiError] = useState("");
  const [collapsedIds, setCollapsedIds] = useState(() => new Set());
  const [justAddedId, setJustAddedId] = useState(null);
  const [cardioType, setCardioType] = useState(CARDIO_TYPES[0]);
  const [cardioMinutes, setCardioMinutes] = useState("");
  const [customExercises, setCustomExercises] = useState(() => loadCustomExercises());
  const [showAllPresets, setShowAllPresets] = useState(false);
  const [restTimer, setRestTimer] = useState(null); // { entryId, exerciseName, endAt, duration }
  const [restRemaining, setRestRemaining] = useState(0);
  const audioCtxRef = useRef(null);
  const importInputRef = useRef(null);

  // 화면 문구: t("한국어", "English")
  const t = (ko, en) => (lang === "en" ? en : ko);
  const gName = g => (lang === "en" ? g.en : g.name);
  const stName = st => (lang === "en" ? st.en : st.name);
  const exName = name => (lang === "en" ? EX_EN[name] || name : name);
  const cardioName = type => (lang === "en" ? CARDIO_EN[type] || type : type);

  function changeLang(next) {
    setLang(next);
    setExerciseInput("");
    try { localStorage.setItem(LANG_KEY, next); } catch {}
  }

  function unlockAudio() {
    // 아이폰은 사용자 클릭 등 '제스처' 안에서만 오디오 재생을 허용함 — 휴식 시작 버튼 클릭 시점에 미리 열어둠
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtxRef.current = new Ctx();
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
  }

  function playBeep() {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const beepAt = (delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      const tt = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0.0001, tt);
      gain.gain.exponentialRampToValueAtTime(0.35, tt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, tt + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(tt);
      osc.stop(tt + 0.5);
    };
    beepAt(0);
    beepAt(0.6);
  }

  const today = todayISO();
  const todaySession = sessions.find(s => s.date === today) || { id: uid(), date: today, startTime: "", endTime: "", cardio: [], entries: [] };
  const lastDoneMap = getLastDoneMap(sessions, true);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 2200); }

  function persistSession(patch) {
    const exists = sessions.some(s => s.date === today);
    const updatedSessions = exists
      ? sessions.map(s => (s.date === today ? { ...s, ...patch } : s))
      : [...sessions, { ...todaySession, ...patch }];
    setSessions(updatedSessions);
    saveSessions(updatedSessions);
  }

  // 휴식 타이머: 화면이 꺼지거나 백그라운드로 가도 실제 경과시간 기준으로 재계산
  useEffect(() => {
    if (!restTimer) return;
    const tick = () => setRestRemaining(Math.max(0, Math.round((restTimer.endAt - Date.now()) / 1000)));
    tick();
    const iv = setInterval(tick, 500);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(iv); document.removeEventListener("visibilitychange", tick); };
  }, [restTimer]);

  useEffect(() => {
    if (restTimer && restRemaining === 0) {
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      playBeep();
    }
  }, [restRemaining, restTimer]);

  useEffect(() => {
    // 아이폰 화면 맞춤: 확대 방지 + 노치/홈바 영역까지 채우기 (index.html 수정 없이 여기서 처리)
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) { meta = document.createElement("meta"); meta.name = "viewport"; document.head.appendChild(meta); }
    meta.content = "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover";
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    if (!justAddedId) return;
    const el = document.getElementById(`entry-${justAddedId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setJustAddedId(null);
  }, [justAddedId]);

  function startRest(entryId, exerciseName, seconds) {
    setRestTimer({ entryId, exerciseName, endAt: Date.now() + seconds * 1000, duration: seconds });
  }
  function dismissRest() { setRestTimer(null); }
  function adjustRest(delta) { setRestTimer(rt => (rt ? { ...rt, endAt: rt.endAt + delta * 1000 } : rt)); }

  function toggleCollapse(id) {
    setCollapsedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  function selectGroup(gid) {
    setSelectedGroupId(gid);
    const g = MUSCLE_GROUPS.find(gr => gr.id === gid);
    setSelectedSubtagId(g.subtags[0].id);
    setExerciseInput("");
    setShowAllPresets(false);
  }

  function saveCustomExercise() {
    const name = canonicalName(exerciseInput);
    if (!name) { showToast(t("저장할 운동 이름을 입력해주세요", "Enter an exercise name to save")); return; }
    const existing = customExercises[selectedSubtagId] || [];
    if (existing.includes(name) || (EXERCISE_PRESETS[selectedSubtagId] || []).includes(name)) { showToast(t("이미 목록에 있어요", "Already in the list")); return; }
    const next = { ...customExercises, [selectedSubtagId]: [...existing, name] };
    setCustomExercises(next);
    saveCustomExercises(next);
    showToast(t("내 운동 목록에 저장했어요 ★", "Saved to My Exercises ★"));
  }

  function removeCustomExercise(name) {
    const next = { ...customExercises, [selectedSubtagId]: (customExercises[selectedSubtagId] || []).filter(n => n !== name) };
    setCustomExercises(next);
    saveCustomExercises(next);
  }

  function addEntry() {
    if (!exerciseInput.trim()) { showToast(t("운동 이름을 입력해주세요", "Enter an exercise name")); return; }
    const entry = {
      id: uid(),
      groupId: selectedGroupId,
      subtagId: selectedSubtagId,
      exerciseName: canonicalName(exerciseInput), // 영어로 입력/선택해도 한글 이름으로 저장 → 기록이 갈라지지 않음
      restSeconds: DEFAULT_REST,
      rounds: [{ id: uid(), sets: [{ weight: "", reps: "" }] }],
    };
    persistSession({ entries: [...todaySession.entries, entry] });
    setExerciseInput("");
    setJustAddedId(entry.id);
    showToast(t("추가됐어요 💪", "Added 💪"));
  }

  function removeEntry(entryId) {
    persistSession({ entries: todaySession.entries.filter(e => e.id !== entryId) });
  }

  function addSet(entryId) {
    persistSession({
      entries: todaySession.entries.map(e => {
        if (e.id !== entryId) return e;
        const rounds = e.rounds.length ? [...e.rounds] : [{ id: uid(), sets: [] }];
        const lastIdx = rounds.length - 1;
        rounds[lastIdx] = { ...rounds[lastIdx], sets: [...rounds[lastIdx].sets, { weight: "", reps: "" }] };
        return { ...e, rounds };
      }),
    });
  }

  function addRound(entryId) {
    unlockAudio();
    const entry = todaySession.entries.find(e => e.id === entryId);
    const seconds = entry?.restSeconds || DEFAULT_REST;
    persistSession({
      entries: todaySession.entries.map(e =>
        e.id === entryId ? { ...e, rounds: [...e.rounds, { id: uid(), sets: [{ weight: "", reps: "" }] }] } : e
      ),
    });
    startRest(entryId, entry?.exerciseName || "", seconds);
  }

  function removeSet(entryId, roundIdx, setIdx) {
    persistSession({
      entries: todaySession.entries.map(e =>
        e.id === entryId
          ? { ...e, rounds: e.rounds.map((r, ri) => (ri === roundIdx ? { ...r, sets: r.sets.filter((_, si) => si !== setIdx) } : r)) }
          : e
      ),
    });
  }

  function updateSet(entryId, roundIdx, setIdx, field, value) {
    persistSession({
      entries: todaySession.entries.map(e =>
        e.id === entryId
          ? {
              ...e,
              rounds: e.rounds.map((r, ri) =>
                ri === roundIdx ? { ...r, sets: r.sets.map((st, si) => (si === setIdx ? { ...st, [field]: value } : st)) } : r
              ),
            }
          : e
      ),
    });
  }

  function updateRestSeconds(entryId, value) {
    persistSession({
      entries: todaySession.entries.map(e => (e.id === entryId ? { ...e, restSeconds: value === "" ? "" : Number(value) || 0 } : e)),
    });
  }

  function resetToday() {
    if (!window.confirm(t("오늘 운동 기록을 전부 지울까요? (시작/종료 시간, 유산소 기록은 유지됩니다)", "Clear all of today's exercises? (Start/end time and cardio are kept)"))) return;
    persistSession({ entries: [] });
  }

  function deleteSession(sessionId) {
    if (!window.confirm(t("이 기록을 삭제할까요?", "Delete this session?"))) return;
    const updated = sessions.filter(s => s.id !== sessionId);
    setSessions(updated);
    saveSessions(updated);
  }

  function addCardio() {
    if (!cardioMinutes || Number(cardioMinutes) <= 0) { showToast(t("운동 시간을 입력해주세요", "Enter the duration")); return; }
    persistSession({ cardio: [...todaySession.cardio, { id: uid(), type: cardioType, minutes: Number(cardioMinutes) }] });
    setCardioMinutes("");
    showToast(t("유산소 기록 추가됐어요 🏃", "Cardio added 🏃"));
  }
  function removeCardio(id) { persistSession({ cardio: todaySession.cardio.filter(c => c.id !== id) }); }

  // ── 백업: 기록을 JSON 파일로 폰에 내려받기 / 파일에서 불러오기 (클라우드 저장 아님) ──
  function exportData() {
    const payload = { app: "forge-workout", version: 3, exportedAt: new Date().toISOString(), sessions, customExercises };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forge-backup-${todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    showToast(t("백업 파일을 만들었어요", "Backup file created"));
  }

  function importData(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const incoming = normalizeSessions(Array.isArray(parsed) ? parsed : parsed.sessions);
        if (incoming.length === 0) { showToast(t("불러올 기록이 없어요", "No sessions found in file")); return; }
        const msg = t(
          `기록 ${incoming.length}개를 불러올까요?\n같은 날짜의 기록은 파일 내용으로 덮어써지고, 나머지 기록은 유지돼요.`,
          `Import ${incoming.length} session(s)?\nSessions on the same date will be overwritten by the file; all others are kept.`
        );
        if (!window.confirm(msg)) return;
        const incomingIds = new Set(incoming.map(s => s.id));
        const incomingDates = new Set(incoming.map(s => s.date));
        const kept = sessions.filter(s => !incomingIds.has(s.id) && !incomingDates.has(s.date));
        const merged = [...kept, ...incoming];
        setSessions(merged);
        saveSessions(merged);
        if (!Array.isArray(parsed) && parsed.customExercises && typeof parsed.customExercises === "object") {
          const mergedCustom = { ...customExercises };
          Object.entries(parsed.customExercises).forEach(([k, list]) => {
            if (Array.isArray(list)) mergedCustom[k] = Array.from(new Set([...(mergedCustom[k] || []), ...list]));
          });
          setCustomExercises(mergedCustom);
          saveCustomExercises(mergedCustom);
        }
        showToast(t("불러오기 완료", "Import complete"));
      } catch {
        showToast(t("파일을 읽을 수 없어요", "Could not read that file"));
      }
    };
    reader.readAsText(file);
  }

  async function getAiSuggestion() {
    setAiLoading(true);
    setAiError("");
    setAiResult("");
    const en = lang === "en";
    const summary = MUSCLE_GROUPS.filter(g => g.id !== "free")
      .map(g => `${en ? g.en : g.name}: ` + g.subtags.map(st => `${en ? st.en : st.name}(${daysAgoLabel(lastDoneMap[st.id], lang)})`).join(", "))
      .join("\n");
    const prompt = en
      ? `The user goes to the gym irregularly and trains chest/back/legs/shoulders as a base full-body routine, then spends about the last 20 minutes on arms or lagging muscle groups. Below is how long ago each sub-area was last trained:

${summary}

User note: "${aiNote || "none"}"

Based on this, recommend in 3-4 natural sentences which sub-areas to prioritise today, with reasons rather than a bullet list.`
      : `사용자는 헬스장에 갈 때마다 가슴/등/다리/어깨를 기본으로 전신운동을 하고, 마지막 약 20분은 팔이나 부족한 부위를 자유롭게 보충합니다. 아래는 각 부위 세부 항목을 마지막으로 수행한 지 며칠 됐는지입니다:

${summary}

사용자 메모: "${aiNote || "없음"}"

이 정보를 참고해서 오늘 어떤 세부 부위를 우선하면 좋을지 한국어로 3~4문장 이내, 자연스러운 문장으로 추천해줘. 목록 나열 대신 이유를 곁들여서.`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_ANTHROPIC_API_KEY || "",
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({ model: "claude-sonnet-5", max_tokens: 500, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.content?.map(b => b.text || "").join("") || t("추천을 받아오지 못했어요.", "Couldn't get a recommendation.");
      setAiResult(text);
    } catch (e) {
      setAiError(t("오류가 발생했어요: ", "Something went wrong: ") + e.message);
    } finally {
      setAiLoading(false);
    }
  }

  const allExerciseNames = getAllExerciseNames(sessions);
  const pastSessions = [...sessions].filter(s => s.entries.length > 0 || (s.cardio && s.cardio.length > 0)).sort((a, b) => b.date.localeCompare(a.date));
  const selectedGroup = MUSCLE_GROUPS.find(g => g.id === selectedGroupId);
  const progressData = progressExercise ? getProgressForExercise(sessions, progressExercise) : [];
  const setsWord = t("세트", "sets");
  const minWord = t("분", "min");
  const headingStyle = { fontFamily: "'Bebas Neue'", fontSize: "1rem", letterSpacing: "2px", color: "#c8a96e", marginBottom: 10 };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#0a0a0a", minHeight: "100vh", width: "100%", maxWidth: "100vw", overflowX: "hidden", color: "#f0ede6", paddingBottom: restTimer ? 80 : 0 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { width: 100%; max-width: 100%; overflow-x: hidden; overscroll-behavior-x: none; -webkit-text-size-adjust: 100%; }
        input, textarea { font-family: inherit; }
        .tab-btn { background: none; border: none; color: #888; font-family: 'Bebas Neue', sans-serif; font-size: 1rem; letter-spacing: 2px; cursor: pointer; padding: 10px 12px; border-bottom: 2px solid transparent; white-space: nowrap; }
        .tab-btn.active { color: #c8a96e; border-bottom: 2px solid #c8a96e; }
        .chip { background: none; border: 1px solid #2a2a2a; color: #888; font-size: 0.78rem; cursor: pointer; padding: 6px 12px; border-radius: 999px; transition: all 0.15s; }
        .chip.active { background: #c8a96e; border-color: #c8a96e; color: #0a0a0a; font-weight: 700; }
        .log-input { background: #1a1a1a; border: 1px solid #2a2a2a; color: #f0ede6; border-radius: 4px; padding: 6px 8px; width: 100%; min-width: 0; text-align: center; font-size: 16px; }
        .log-input:focus { outline: none; border-color: #c8a96e; }
        .text-input { background: #1a1a1a; border: 1px solid #2a2a2a; color: #f0ede6; border-radius: 8px; padding: 10px 14px; width: 100%; min-width: 0; font-size: 16px; }
        .text-input:focus { outline: none; border-color: #c8a96e; }
        .text-input::placeholder { color: #444; }
        .add-btn { background: #c8a96e; color: #0a0a0a; border: none; font-family: 'Bebas Neue'; font-size: 0.95rem; letter-spacing: 1px; padding: 10px 18px; border-radius: 6px; cursor: pointer; }
        .add-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .ghost-btn { background: none; border: 1px solid #2a2a2a; color: #888; font-size: 0.75rem; padding: 6px 12px; border-radius: 6px; cursor: pointer; }
        .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #c8a96e; color: #0a0a0a; padding: 10px 24px; border-radius: 999px; font-size: 0.9rem; font-weight: 700; z-index: 999; max-width: 90vw; text-align: center; }
      `}</style>

      <div style={{ borderBottom: "1px solid #1a1a1a", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1.5rem", letterSpacing: "4px", color: "#c8a96e" }}>FORGE</div>
          <div style={{ fontSize: "0.65rem", color: "#555", letterSpacing: "1px" }}>AI WORKOUT TRACKER</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", border: "1px solid #2a2a2a", borderRadius: 4, overflow: "hidden" }}>
            {["ko", "en"].map(l => (
              <button key={l} onClick={() => changeLang(l)} style={{ background: lang === l ? "#c8a96e" : "none", color: lang === l ? "#0a0a0a" : "#888", border: "none", fontSize: "0.7rem", fontWeight: 700, padding: "4px 8px", cursor: "pointer" }}>{l.toUpperCase()}</button>
            ))}
          </div>
          <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 4, padding: "3px 10px", fontSize: "0.72rem", color: "#888", whiteSpace: "nowrap" }}>{formatDate(today, lang)}</div>
        </div>
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid #1a1a1a", padding: "0 20px", overflowX: "auto" }}>
        {[["today", t("오늘", "Today")], ["history", t("기록", "History")], ["progress", t("진행", "Progress")], ["ai", t("AI 추천", "AI Coach")], ["settings", "⚙"]].map(([key, label]) => (
          <button key={key} className={`tab-btn${tab === key ? " active" : ""}`} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {tab === "today" && (
        <div style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 6 }}>
            <div style={{ flex: 1, minWidth: 0, background: "#111", border: "1px solid #1e1e1e", borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ fontSize: "0.7rem", color: "#666", marginBottom: 6 }}>{t("시작 시간", "Start time")}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <input type="time" className="text-input" value={todaySession.startTime} onChange={e => persistSession({ startTime: e.target.value })} />
                <button className="ghost-btn" onClick={() => persistSession({ startTime: nowHHMM() })}>{t("지금", "Now")}</button>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0, background: "#111", border: "1px solid #1e1e1e", borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ fontSize: "0.7rem", color: "#666", marginBottom: 6 }}>{t("종료 시간", "End time")}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <input type="time" className="text-input" value={todaySession.endTime} onChange={e => persistSession({ endTime: e.target.value })} />
                <button className="ghost-btn" onClick={() => persistSession({ endTime: nowHHMM() })}>{t("지금", "Now")}</button>
              </div>
            </div>
          </div>
          {todaySession.startTime && todaySession.endTime && (
            <div style={{ fontSize: "0.75rem", color: "#888", marginBottom: 20 }}>{t("총", "Total")} {formatDuration(todaySession.startTime, todaySession.endTime, lang)}</div>
          )}
          {!(todaySession.startTime && todaySession.endTime) && <div style={{ marginBottom: 20 }} />}

          <div style={headingStyle}>{t("부위별 마지막 수행", "Last Trained")}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {MUSCLE_GROUPS.filter(g => g.id !== "free").map(g => (
              <div key={g.id} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ fontSize: "0.78rem", color: "#999", marginBottom: 6 }}>{g.emoji} {gName(g)}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {g.subtags.map(st => (
                    <div key={st.id} style={{ fontSize: "0.72rem", color: "#f0ede6", background: "#1a1a1a", borderRadius: 6, padding: "4px 10px" }}>
                      {stName(st)} <span style={{ color: "#c8a96e" }}>· {daysAgoLabel(lastDoneMap[st.id], lang)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={headingStyle}>{t("운동 추가", "Add Exercise")}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {MUSCLE_GROUPS.map(g => (
              <button key={g.id} className={`chip${selectedGroupId === g.id ? " active" : ""}`} onClick={() => selectGroup(g.id)}>{g.emoji} {gName(g)}</button>
            ))}
          </div>
          {selectedGroup.id !== "free" && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {selectedGroup.subtags.map(st => (
                <button key={st.id} className={`chip${selectedSubtagId === st.id ? " active" : ""}`} onClick={() => { setSelectedSubtagId(st.id); setExerciseInput(""); setShowAllPresets(false); }}>{stName(st)}</button>
              ))}
            </div>
          )}
          {(() => {
            const custom = customExercises[selectedSubtagId] || [];
            const presets = (EXERCISE_PRESETS[selectedSubtagId] || []).filter(n => !custom.includes(n));
            const list = [...custom.map(n => ({ n, custom: true })), ...presets.map(n => ({ n, custom: false }))];
            if (list.length === 0) return null;
            const visible = showAllPresets ? list : list.slice(0, PRESET_VISIBLE);
            return (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {visible.map(({ n, custom: isCustom }) => (
                  <span key={n} style={{ display: "inline-flex", alignItems: "center", maxWidth: "100%" }}>
                    <button className="ghost-btn" style={isCustom ? { borderColor: "#c8a96e", color: "#c8a96e", borderTopRightRadius: 0, borderBottomRightRadius: 0 } : undefined} onClick={() => setExerciseInput(exName(n))}>{isCustom ? "★ " : ""}{exName(n)}</button>
                    {isCustom && (
                      <button className="ghost-btn" style={{ borderColor: "#c8a96e", color: "#c8a96e", borderLeft: "none", borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }} onClick={() => { if (window.confirm(t(`"${n}" 을(를) 내 목록에서 지울까요? (과거 기록은 그대로예요)`, `Remove "${exName(n)}" from My Exercises? (Past logs are kept)`))) removeCustomExercise(n); }}>×</button>
                    )}
                  </span>
                ))}
                {list.length > PRESET_VISIBLE && (
                  <button className="ghost-btn" onClick={() => setShowAllPresets(v => !v)}>{showAllPresets ? t("접기 ▴", "Show less ▴") : t(`더보기 (${list.length - PRESET_VISIBLE}) ▾`, `Show more (${list.length - PRESET_VISIBLE}) ▾`)}</button>
                )}
              </div>
            );
          })()}
          <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <input className="text-input" placeholder={t("운동 이름 입력 (또는 위에서 선택)", "Exercise name (or pick above)")} value={exerciseInput} onChange={e => setExerciseInput(e.target.value)} />
            <button className="add-btn" style={{ flexShrink: 0 }} onClick={addEntry}>{t("추가", "ADD")}</button>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
            <button className="ghost-btn" onClick={saveCustomExercise}>{t("★ 이 이름을 내 목록에 저장", "★ Save to My Exercises")}</button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1rem", letterSpacing: "2px", color: "#c8a96e" }}>{t("오늘 기록", "Today's Log")}</div>
            {todaySession.entries.length > 0 && <button className="ghost-btn" onClick={resetToday}>{t("운동 기록 초기화", "Reset log")}</button>}
          </div>
          {todaySession.entries.length === 0 && (
            <div style={{ color: "#555", fontSize: "0.85rem", padding: "20px 0", textAlign: "center" }}>{t("아직 기록한 운동이 없어요.", "No exercises logged yet.")}</div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {todaySession.entries.map(entry => {
              const group = MUSCLE_GROUPS.find(g => g.id === entry.groupId);
              const subtag = group?.subtags.find(st => st.id === entry.subtagId);
              const history = getExerciseHistory(sessions, entry.exerciseName, today);
              const isCollapsed = collapsedIds.has(entry.id);
              return (
                <div key={entry.id} id={`entry-${entry.id}`} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, cursor: "pointer" }} onClick={() => toggleCollapse(entry.id)}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{isCollapsed ? "▸" : "▾"} {exName(entry.exerciseName)}</div>
                      <div style={{ fontSize: "0.72rem", color: "#666", marginTop: 2 }}>
                        {group?.emoji} {group ? gName(group) : ""}{subtag ? ` · ${stName(subtag)}` : ""} · {entry.rounds.length} {t("라운드", entry.rounds.length === 1 ? "round" : "rounds")} · {totalSetsOf(entry)} {setsWord}
                      </div>
                    </div>
                    <button className="ghost-btn" style={{ flexShrink: 0, alignSelf: "flex-start" }} onClick={e => { e.stopPropagation(); removeEntry(entry.id); }}>{t("삭제", "Delete")}</button>
                  </div>

                  {!isCollapsed && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "24px minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) 24px", gap: 6, alignItems: "center", marginBottom: 4 }}>
                        <div /><div style={{ fontSize: "0.6rem", color: "#555", textAlign: "center" }}>{t("무게(kg)", "Weight (kg)")}</div><div style={{ fontSize: "0.6rem", color: "#555", textAlign: "center" }}>{t("렙스", "Reps")}</div><div style={{ fontSize: "0.6rem", color: "#555", textAlign: "center" }}>{t("지난번", "Last")}</div><div />
                      </div>
                      {entry.rounds.map((round, ri) => (
                        <div key={round.id} style={{ marginTop: ri > 0 ? 10 : 0, paddingTop: ri > 0 ? 8 : 0, borderTop: ri > 0 ? "1px dashed #2a2a2a" : "none" }}>
                          {entry.rounds.length > 1 && <div style={{ fontSize: "0.68rem", color: "#c8a96e", marginBottom: 6 }}>{t(`라운드 ${ri + 1}`, `Round ${ri + 1}`)}</div>}
                          {round.sets.map((st, si) => {
                            const prev = history?.rounds?.[ri]?.sets?.[si];
                            return (
                              <div key={si} style={{ display: "grid", gridTemplateColumns: "24px minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) 24px", gap: 6, alignItems: "center", marginBottom: 6 }}>
                                <div style={{ fontSize: "0.66rem", color: "#555", textAlign: "center" }}>{si + 1}</div>
                                <input className="log-input" type="number" inputMode="decimal" placeholder="—" value={st.weight} onChange={e => updateSet(entry.id, ri, si, "weight", e.target.value)} />
                                <input className="log-input" type="number" inputMode="numeric" placeholder="—" value={st.reps} onChange={e => updateSet(entry.id, ri, si, "reps", e.target.value)} />
                                <div style={{ fontSize: "0.66rem", color: "#666", textAlign: "center" }}>{prev ? `${prev.weight || "—"}×${prev.reps || "—"}` : "—"}</div>
                                <button onClick={() => removeSet(entry.id, ri, si)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "0.9rem" }}>×</button>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
                        <button className="ghost-btn" onClick={() => addSet(entry.id)}>{t("+ 세트 추가", "+ Add set")}</button>
                        <button className="add-btn" style={{ fontSize: "0.78rem", padding: "7px 12px" }} onClick={() => addRound(entry.id)}>{t("🕐 휴식 시작 → 다음 라운드", "🕐 Start rest → Next round")}</button>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: "0.68rem", color: "#666" }}>{t("휴식", "Rest")}</span>
                          <input className="log-input" style={{ width: 56 }} type="number" value={entry.restSeconds} onChange={e => updateRestSeconds(entry.id, e.target.value)} />
                          <span style={{ fontSize: "0.68rem", color: "#666" }}>{t("초", "sec")}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={headingStyle}>{t("유산소", "Cardio")}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {CARDIO_TYPES.map(ct => (
              <button key={ct} className={`chip${cardioType === ct ? " active" : ""}`} onClick={() => setCardioType(ct)}>{cardioName(ct)}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input className="text-input" style={{ maxWidth: 140 }} type="number" inputMode="numeric" placeholder={t("분", "min")} value={cardioMinutes} onChange={e => setCardioMinutes(e.target.value)} />
            <button className="add-btn" style={{ flexShrink: 0 }} onClick={addCardio}>{t("추가", "ADD")}</button>
          </div>
          {todaySession.cardio.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {todaySession.cardio.map(c => (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#111", border: "1px solid #1e1e1e", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: "0.85rem" }}>🏃 {cardioName(c.type)} · {c.minutes} {minWord}</div>
                  <button className="ghost-btn" onClick={() => removeCardio(c.id)}>{t("삭제", "Delete")}</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "history" && (
        <div style={{ padding: "16px 20px" }}>
          <div style={{ ...headingStyle, marginBottom: 12 }}>{t("운동 기록", "Workout History")}</div>
          {pastSessions.length === 0 && <div style={{ color: "#555", fontSize: "0.85rem" }}>{t("아직 기록이 없어요.", "No sessions yet.")}</div>}
          {pastSessions.map(s => {
            const groupsCovered = Array.from(new Set(s.entries.map(e => e.groupId))).map(gid => MUSCLE_GROUPS.find(g => g.id === gid));
            const totalSets = s.entries.reduce((sum, e) => sum + totalSetsOf(e), 0);
            const cardioMin = (s.cardio || []).reduce((sum, c) => sum + Number(c.minutes || 0), 0);
            const isOpen = expandedHistoryId === s.id;
            return (
              <div key={s.id} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "12px 16px", marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => setExpandedHistoryId(isOpen ? null : s.id)}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: "'Bebas Neue'", fontSize: "0.95rem", letterSpacing: "1px", color: s.date === today ? "#c8a96e" : "#f0ede6" }}>{formatDate(s.date, lang)}</div>
                    <div style={{ fontSize: "0.72rem", color: "#666", marginTop: 2 }}>
                      {groupsCovered.map(g => g?.emoji).join(" ")} · {totalSets} {setsWord}
                      {s.startTime && s.endTime && ` · ${s.startTime}–${s.endTime} (${formatDuration(s.startTime, s.endTime, lang)})`}
                      {cardioMin > 0 && ` · ${t("유산소", "Cardio")} ${cardioMin} ${minWord}`}
                    </div>
                  </div>
                  <button className="ghost-btn" style={{ flexShrink: 0 }} onClick={e => { e.stopPropagation(); deleteSession(s.id); }}>{t("삭제", "Delete")}</button>
                </div>
                {isOpen && (
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                    {s.entries.map(e => (
                      <div key={e.id} style={{ fontSize: "0.78rem", color: "#ccc", background: "#1a1a1a", borderRadius: 6, padding: "8px 10px" }}>
                        <strong>{exName(e.exerciseName)}</strong> — {formatRoundsCompact(e.rounds)}
                      </div>
                    ))}
                    {(s.cardio || []).map(c => (
                      <div key={c.id} style={{ fontSize: "0.78rem", color: "#ccc", background: "#1a1a1a", borderRadius: 6, padding: "8px 10px" }}>
                        🏃 {cardioName(c.type)} · {c.minutes} {minWord}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "progress" && (
        <div style={{ padding: "16px 20px" }}>
          <div style={{ ...headingStyle, marginBottom: 12 }}>{t("운동별 진행", "Progress by Exercise")}</div>
          {allExerciseNames.length === 0 && <div style={{ color: "#555", fontSize: "0.85rem" }}>{t("기록을 쌓으면 여기서 무게 변화를 볼 수 있어요.", "Log a few sessions to see your weight progress here.")}</div>}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {allExerciseNames.map(name => (
              <button key={name} className={`chip${progressExercise === name ? " active" : ""}`} onClick={() => setProgressExercise(name)}>{exName(name)}</button>
            ))}
          </div>
          {progressExercise && progressData.length < 2 && (
            <div style={{ color: "#555", fontSize: "0.85rem" }}>{t(`이 운동은 2회 이상 기록해야 그래프가 나와요. (현재 ${progressData.length}회)`, `Log this exercise at least twice to see a chart. (Currently ${progressData.length})`)}</div>
          )}
          {progressData.length >= 2 && (() => {
            const maxW = Math.max(...progressData.map(d => d.weight));
            const minW = Math.min(...progressData.map(d => d.weight));
            const gain = (progressData[progressData.length - 1].weight - progressData[0].weight).toFixed(1);
            return (
              <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontSize: "0.85rem", color: "#999" }}>{t(`${progressData.length}회 기록 · 현재 ${progressData[progressData.length - 1].weight}kg`, `${progressData.length} sessions · now ${progressData[progressData.length - 1].weight}kg`)}</div>
                  <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1.1rem", color: parseFloat(gain) >= 0 ? "#6ec87a" : "#c86e6e" }}>
                    {parseFloat(gain) >= 0 ? "+" : ""}{gain}kg
                  </div>
                </div>
                <div style={{ display: "flex", gap: 5, alignItems: "flex-end", height: 90 }}>
                  {progressData.map((d, i) => {
                    const pct = maxW === minW ? 100 : ((d.weight - minW) / (maxW - minW)) * 75 + 25;
                    const isLatest = i === progressData.length - 1;
                    return (
                      <div key={i} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                        <div style={{ fontSize: "0.6rem", color: isLatest ? "#c8a96e" : "#666" }}>{d.weight}</div>
                        <div style={{ width: "100%", background: isLatest ? "#c8a96e" : "#2a2a2a", borderRadius: "2px 2px 0 0", height: `${pct}%`, minHeight: 6 }} />
                        <div style={{ fontSize: "0.56rem", color: "#555" }}>{d.date.slice(5)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {tab === "ai" && (
        <div style={{ padding: "16px 20px" }}>
          <div style={{ ...headingStyle, marginBottom: 6 }}>{t("오늘 뭐 하지?", "What should I train today?")}</div>
          <div style={{ fontSize: "0.8rem", color: "#666", marginBottom: 14 }}>{t("부위별 마지막 수행일을 참고해서 AI가 오늘 우선순위를 추천해줘요.", "Uses when you last trained each area to suggest today's priorities.")}</div>
          {!HAS_AI_KEY ? (
            <div style={{ background: "#111", border: "1px dashed #3a3226", borderRadius: 10, padding: 16, fontSize: "0.85rem", color: "#ccc", lineHeight: 1.7 }}>
              <div style={{ color: "#c8a96e", fontWeight: 700, marginBottom: 6 }}>{t("🚧 준비 중", "🚧 Coming soon")}</div>
              {t(
                "이 앱이 향하는 방향이에요: AI와 대화하며 내 몸에 딱 맞는 운동법을 찾아가는 것. 지금은 서버 연결 없이 동작하는 버전이라 AI 기능이 꺼져 있어요. (API 키를 브라우저에 그대로 넣으면 노출되기 때문에, 안전한 서버 프록시를 붙인 뒤에 켤 예정이에요.)",
                "This is where the app is headed: talking with an AI to find the training approach that fits my body. It is switched off for now — putting an API key directly in a browser app would expose it, so I plan to enable it once a secure server-side proxy is in place."
              )}
            </div>
          ) : (
            <>
              <textarea className="text-input" rows={3} placeholder={t("메모 (선택) 예: 오늘 시간 많아요, 어깨가 좀 뻐근해요", "Note (optional), e.g. I have extra time today, shoulders feel tight")} value={aiNote} onChange={e => setAiNote(e.target.value)} style={{ marginBottom: 12, resize: "vertical" }} />
              <button className="add-btn" disabled={aiLoading} onClick={getAiSuggestion} style={{ width: "100%" }}>
                {aiLoading ? t("생각하는 중...", "Thinking...") : t("⚡ 추천받기", "⚡ GET SUGGESTION")}
              </button>
              {aiResult && (
                <div style={{ marginTop: 16, background: "#111", border: "1px solid #2a2a2a", borderRadius: 10, padding: 16, fontSize: "0.85rem", color: "#ccc", lineHeight: 1.7 }}>{aiResult}</div>
              )}
              {aiError && (
                <div style={{ marginTop: 16, background: "#1a0e0e", border: "1px solid #3a1e1e", borderRadius: 8, padding: 14, fontSize: "0.85rem", color: "#c86e6e" }}>{aiError}</div>
              )}
            </>
          )}
        </div>
      )}

      {tab === "settings" && (
        <div style={{ padding: "16px 20px" }}>
          <div style={{ ...headingStyle, marginBottom: 12 }}>{t("언어", "Language")}</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
            <button className={`chip${lang === "ko" ? " active" : ""}`} onClick={() => changeLang("ko")}>한국어</button>
            <button className={`chip${lang === "en" ? " active" : ""}`} onClick={() => changeLang("en")}>English</button>
          </div>

          <div style={{ ...headingStyle, marginBottom: 6 }}>{t("기록 백업", "Data Backup")}</div>
          <div style={{ fontSize: "0.8rem", color: "#888", lineHeight: 1.7, marginBottom: 12 }}>
            {t(
              "기록은 이 브라우저 안에만 저장돼 있어요. Safari 데이터를 지우면 사라질 수 있으니, 가끔 백업 파일(.json)로 내려받아 두세요. 파일은 클라우드가 아니라 이 폰의 '파일' 앱에 저장되고, iCloud Drive나 메일로 옮겨 보관할 수 있어요.",
              "Your logs live only in this browser and can disappear if Safari data is cleared. Download a backup file (.json) now and then. It is saved to this phone's Files app (not a cloud) and you can move it to iCloud Drive or email it to yourself."
            )}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="add-btn" onClick={exportData}>{t("⬇ 내보내기", "⬇ EXPORT")}</button>
            <button className="ghost-btn" style={{ padding: "10px 16px", fontSize: "0.85rem" }} onClick={() => importInputRef.current && importInputRef.current.click()}>{t("⬆ 불러오기", "⬆ Import")}</button>
            <input ref={importInputRef} type="file" accept="application/json,.json" style={{ display: "none" }} onChange={e => { importData(e.target.files && e.target.files[0]); e.target.value = ""; }} />
          </div>
        </div>
      )}

      {restTimer && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: restRemaining <= 0 ? "#c8a96e" : "#111", borderTop: "1px solid #2a2a2a", padding: "12px 20px calc(12px + env(safe-area-inset-bottom))", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 998 }}>
          <div>
            <div style={{ fontSize: "0.7rem", color: restRemaining <= 0 ? "#0a0a0a" : "#888" }}>{restTimer.exerciseName ? `${exName(restTimer.exerciseName)} ` : ""}{t("휴식", "rest")}</div>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1.6rem", letterSpacing: "2px", color: restRemaining <= 0 ? "#0a0a0a" : "#c8a96e" }}>
              {restRemaining <= 0 ? t("휴식 끝! 🔔", "Rest over! 🔔") : formatSecs(restRemaining)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="ghost-btn" onClick={() => adjustRest(-15)}>{t("-15초", "-15s")}</button>
            <button className="ghost-btn" onClick={() => adjustRest(15)}>{t("+15초", "+15s")}</button>
            <button className="ghost-btn" onClick={dismissRest}>{t("닫기", "Close")}</button>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
