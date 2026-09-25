import { useState, useEffect, useRef } from "react";

const MUSCLE_GROUPS = [
  { id: "chest", name: "가슴", emoji: "🎯", subtags: [
    { id: "chest_upper", name: "윗가슴" },
    { id: "chest_mid", name: "중간가슴" },
    { id: "chest_lower", name: "아랫가슴" },
  ]},
  { id: "back", name: "등", emoji: "🔙", subtags: [
    { id: "back_lat", name: "광배근(펼치기)" },
    { id: "back_row", name: "당기는 등(로우)" },
  ]},
  { id: "legs", name: "다리", emoji: "🦵", subtags: [
    { id: "legs_quad", name: "허벅지 앞(대퇴사두)" },
    { id: "legs_ham", name: "허벅지 뒤(햄스트링)" },
  ]},
  { id: "shoulders", name: "어깨", emoji: "🏔️", subtags: [
    { id: "shoulders_all", name: "어깨 전체" },
  ]},
  { id: "arms", name: "팔", emoji: "💪", subtags: [
    { id: "arms_biceps", name: "이두" },
    { id: "arms_triceps", name: "삼두" },
  ]},
  { id: "free", name: "자유/보충", emoji: "✨", subtags: [
    { id: "free_any", name: "자유 운동" },
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

const CUSTOM_EX_KEY = "forge_custom_exercises_v1";
const PRESET_VISIBLE = 8;
function loadCustomExercises() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_EX_KEY)) || {}; } catch { return {}; }
}
function saveCustomExercises(m) { try { localStorage.setItem(CUSTOM_EX_KEY, JSON.stringify(m)); } catch {} }

const CARDIO_TYPES = ["러닝머신", "사이클", "일립티컬", "로잉머신", "스텝퍼", "기타"];

const STORAGE_KEY = "forge_sessions_v3";
const DEFAULT_REST = 90;

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function todayISO() { return new Date().toISOString().slice(0, 10); }
function nowHHMM() { return new Date().toTimeString().slice(0, 5); }

function loadSessions() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    // 이전 버전(flat sets) 데이터를 rounds 구조로 자동 변환 — 기존 기록 보존
    return raw.map(s => ({
      id: s.id || uid(),
      date: s.date,
      startTime: s.startTime || "",
      endTime: s.endTime || "",
      cardio: s.cardio || [],
      entries: (s.entries || []).map(e => ({
        id: e.id,
        groupId: e.groupId,
        subtagId: e.subtagId,
        exerciseName: e.exerciseName,
        restSeconds: e.restSeconds || DEFAULT_REST,
        rounds: e.rounds && e.rounds.length ? e.rounds : [{ id: uid(), sets: e.sets || [{ weight: "", reps: "" }] }],
      })),
    }));
  } catch { return []; }
}
function saveSessions(s) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {} }

function daysAgoLabel(dateStr) {
  if (!dateStr) return "기록 없음";
  const diff = Math.round((new Date(todayISO()) - new Date(dateStr)) / 86400000);
  if (diff === 0) return "오늘";
  if (diff === 1) return "어제";
  return `${diff}일 전`;
}

function formatDateKR(dateStr) {
  const d = new Date(dateStr);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}

function formatDuration(start, end) {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  const h = Math.floor(mins / 60), m = mins % 60;
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

export default function WorkoutTracker() {
  const [tab, setTab] = useState("today");
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
      const t = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.5);
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
    const name = exerciseInput.trim();
    if (!name) { showToast("저장할 운동 이름을 입력해주세요"); return; }
    const existing = customExercises[selectedSubtagId] || [];
    if (existing.includes(name) || (EXERCISE_PRESETS[selectedSubtagId] || []).includes(name)) { showToast("이미 목록에 있어요"); return; }
    const next = { ...customExercises, [selectedSubtagId]: [...existing, name] };
    setCustomExercises(next);
    saveCustomExercises(next);
    showToast("내 운동 목록에 저장했어요 ★");
  }

  function removeCustomExercise(name) {
    const next = { ...customExercises, [selectedSubtagId]: (customExercises[selectedSubtagId] || []).filter(n => n !== name) };
    setCustomExercises(next);
    saveCustomExercises(next);
  }

  function addEntry() {
    if (!exerciseInput.trim()) { showToast("운동 이름을 입력해주세요"); return; }
    const entry = {
      id: uid(),
      groupId: selectedGroupId,
      subtagId: selectedSubtagId,
      exerciseName: exerciseInput.trim(),
      restSeconds: DEFAULT_REST,
      rounds: [{ id: uid(), sets: [{ weight: "", reps: "" }] }],
    };
    persistSession({ entries: [...todaySession.entries, entry] });
    setExerciseInput("");
    setJustAddedId(entry.id);
    showToast("추가됐어요 💪");
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
    startRest(entryId, entry?.exerciseName || "운동", seconds);
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
    if (!window.confirm("오늘 운동 기록을 전부 지울까요? (시작/종료 시간, 유산소 기록은 유지됩니다)")) return;
    persistSession({ entries: [] });
  }

  function deleteSession(sessionId) {
    if (!window.confirm("이 기록을 삭제할까요?")) return;
    const updated = sessions.filter(s => s.id !== sessionId);
    setSessions(updated);
    saveSessions(updated);
  }

  function addCardio() {
    if (!cardioMinutes || Number(cardioMinutes) <= 0) { showToast("운동 시간을 입력해주세요"); return; }
    persistSession({ cardio: [...todaySession.cardio, { id: uid(), type: cardioType, minutes: Number(cardioMinutes) }] });
    setCardioMinutes("");
    showToast("유산소 기록 추가됐어요 🏃");
  }
  function removeCardio(id) { persistSession({ cardio: todaySession.cardio.filter(c => c.id !== id) }); }

  async function getAiSuggestion() {
    setAiLoading(true);
    setAiError("");
    setAiResult("");
    const summary = MUSCLE_GROUPS.filter(g => g.id !== "free")
      .map(g => `${g.name}: ` + g.subtags.map(st => `${st.name}(${daysAgoLabel(lastDoneMap[st.id])})`).join(", "))
      .join("\n");
    const prompt = `사용자는 헬스장에 갈 때마다 가슴/등/다리/어깨를 기본으로 전신운동을 하고, 마지막 약 20분은 팔이나 부족한 부위를 자유롭게 보충합니다. 아래는 각 부위 세부 항목을 마지막으로 수행한 지 며칠 됐는지입니다:

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
      const text = data.content?.map(b => b.text || "").join("") || "추천을 받아오지 못했어요.";
      setAiResult(text);
    } catch (e) {
      setAiError("오류가 발생했어요: " + e.message);
    } finally {
      setAiLoading(false);
    }
  }

  const allExerciseNames = getAllExerciseNames(sessions);
  const pastSessions = [...sessions].filter(s => s.entries.length > 0 || (s.cardio && s.cardio.length > 0)).sort((a, b) => b.date.localeCompare(a.date));
  const selectedGroup = MUSCLE_GROUPS.find(g => g.id === selectedGroupId);
  const progressData = progressExercise ? getProgressForExercise(sessions, progressExercise) : [];

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
        .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #c8a96e; color: #0a0a0a; padding: 10px 24px; border-radius: 999px; font-size: 0.9rem; font-weight: 700; z-index: 999; }
      `}</style>

      <div style={{ borderBottom: "1px solid #1a1a1a", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1.5rem", letterSpacing: "4px", color: "#c8a96e" }}>FORGE</div>
          <div style={{ fontSize: "0.65rem", color: "#555", letterSpacing: "1px" }}>AI WORKOUT TRACKER</div>
        </div>
        <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 4, padding: "3px 10px", fontSize: "0.72rem", color: "#888" }}>{formatDateKR(today)}</div>
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid #1a1a1a", padding: "0 20px", overflowX: "auto" }}>
        {[["today", "오늘"], ["history", "기록"], ["progress", "진행"], ["ai", "AI 추천"]].map(([key, label]) => (
          <button key={key} className={`tab-btn${tab === key ? " active" : ""}`} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {tab === "today" && (
        <div style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 6 }}>
            <div style={{ flex: 1, minWidth: 0, background: "#111", border: "1px solid #1e1e1e", borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ fontSize: "0.7rem", color: "#666", marginBottom: 6 }}>시작 시간</div>
              <div style={{ display: "flex", gap: 6 }}>
                <input type="time" className="text-input" value={todaySession.startTime} onChange={e => persistSession({ startTime: e.target.value })} />
                <button className="ghost-btn" onClick={() => persistSession({ startTime: nowHHMM() })}>지금</button>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0, background: "#111", border: "1px solid #1e1e1e", borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ fontSize: "0.7rem", color: "#666", marginBottom: 6 }}>종료 시간</div>
              <div style={{ display: "flex", gap: 6 }}>
                <input type="time" className="text-input" value={todaySession.endTime} onChange={e => persistSession({ endTime: e.target.value })} />
                <button className="ghost-btn" onClick={() => persistSession({ endTime: nowHHMM() })}>지금</button>
              </div>
            </div>
          </div>
          {todaySession.startTime && todaySession.endTime && (
            <div style={{ fontSize: "0.75rem", color: "#888", marginBottom: 20 }}>총 {formatDuration(todaySession.startTime, todaySession.endTime)}</div>
          )}
          {!(todaySession.startTime && todaySession.endTime) && <div style={{ marginBottom: 20 }} />}

          <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1rem", letterSpacing: "2px", color: "#c8a96e", marginBottom: 10 }}>부위별 마지막 수행</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {MUSCLE_GROUPS.filter(g => g.id !== "free").map(g => (
              <div key={g.id} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ fontSize: "0.78rem", color: "#999", marginBottom: 6 }}>{g.emoji} {g.name}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {g.subtags.map(st => (
                    <div key={st.id} style={{ fontSize: "0.72rem", color: "#f0ede6", background: "#1a1a1a", borderRadius: 6, padding: "4px 10px" }}>
                      {st.name} <span style={{ color: "#c8a96e" }}>· {daysAgoLabel(lastDoneMap[st.id])}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1rem", letterSpacing: "2px", color: "#c8a96e", marginBottom: 10 }}>운동 추가</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {MUSCLE_GROUPS.map(g => (
              <button key={g.id} className={`chip${selectedGroupId === g.id ? " active" : ""}`} onClick={() => selectGroup(g.id)}>{g.emoji} {g.name}</button>
            ))}
          </div>
          {selectedGroup.id !== "free" && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {selectedGroup.subtags.map(st => (
                <button key={st.id} className={`chip${selectedSubtagId === st.id ? " active" : ""}`} onClick={() => { setSelectedSubtagId(st.id); setExerciseInput(""); setShowAllPresets(false); }}>{st.name}</button>
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
                    <button className="ghost-btn" style={isCustom ? { borderColor: "#c8a96e", color: "#c8a96e", borderTopRightRadius: 0, borderBottomRightRadius: 0 } : undefined} onClick={() => setExerciseInput(n)}>{isCustom ? "★ " : ""}{n}</button>
                    {isCustom && (
                      <button className="ghost-btn" style={{ borderColor: "#c8a96e", color: "#c8a96e", borderLeft: "none", borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }} onClick={() => { if (window.confirm(`"${n}" 을(를) 내 목록에서 지울까요? (과거 기록은 그대로예요)`)) removeCustomExercise(n); }}>×</button>
                    )}
                  </span>
                ))}
                {list.length > PRESET_VISIBLE && (
                  <button className="ghost-btn" onClick={() => setShowAllPresets(v => !v)}>{showAllPresets ? "접기 ▴" : `더보기 (${list.length - PRESET_VISIBLE}) ▾`}</button>
                )}
              </div>
            );
          })()}
          <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <input className="text-input" style={{ minWidth: 0 }} placeholder="운동 이름 입력 (또는 위에서 선택)" value={exerciseInput} onChange={e => setExerciseInput(e.target.value)} />
            <button className="add-btn" style={{ flexShrink: 0 }} onClick={addEntry}>추가</button>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
            <button className="ghost-btn" onClick={saveCustomExercise}>★ 이 이름을 내 목록에 저장</button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1rem", letterSpacing: "2px", color: "#c8a96e" }}>오늘 기록</div>
            {todaySession.entries.length > 0 && <button className="ghost-btn" onClick={resetToday}>운동 기록 초기화</button>}
          </div>
          {todaySession.entries.length === 0 && (
            <div style={{ color: "#555", fontSize: "0.85rem", padding: "20px 0", textAlign: "center" }}>아직 기록한 운동이 없어요.</div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {todaySession.entries.map(entry => {
              const group = MUSCLE_GROUPS.find(g => g.id === entry.groupId);
              const subtag = group?.subtags.find(st => st.id === entry.subtagId);
              const history = getExerciseHistory(sessions, entry.exerciseName, today);
              const isCollapsed = collapsedIds.has(entry.id);
              return (
                <div key={entry.id} id={`entry-${entry.id}`} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }} onClick={() => toggleCollapse(entry.id)}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{isCollapsed ? "▸" : "▾"} {entry.exerciseName}</div>
                      <div style={{ fontSize: "0.72rem", color: "#666", marginTop: 2 }}>
                        {group?.emoji} {group?.name}{subtag ? ` · ${subtag.name}` : ""} · {entry.rounds.length}라운드 · {totalSetsOf(entry)}세트
                      </div>
                    </div>
                    <button className="ghost-btn" onClick={e => { e.stopPropagation(); removeEntry(entry.id); }}>삭제</button>
                  </div>

                  {!isCollapsed && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "24px minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) 24px", gap: 6, alignItems: "center", marginBottom: 4 }}>
                        <div /><div style={{ fontSize: "0.6rem", color: "#555", textAlign: "center" }}>무게(kg)</div><div style={{ fontSize: "0.6rem", color: "#555", textAlign: "center" }}>렙스</div><div style={{ fontSize: "0.6rem", color: "#555", textAlign: "center" }}>지난번</div><div />
                      </div>
                      {entry.rounds.map((round, ri) => (
                        <div key={round.id} style={{ marginTop: ri > 0 ? 10 : 0, paddingTop: ri > 0 ? 8 : 0, borderTop: ri > 0 ? "1px dashed #2a2a2a" : "none" }}>
                          {entry.rounds.length > 1 && <div style={{ fontSize: "0.68rem", color: "#c8a96e", marginBottom: 6 }}>라운드 {ri + 1}</div>}
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
                        <button className="ghost-btn" onClick={() => addSet(entry.id)}>+ 세트 추가</button>
                        <button className="add-btn" style={{ fontSize: "0.78rem", padding: "7px 12px" }} onClick={() => addRound(entry.id)}>🕐 휴식 시작 → 다음 라운드</button>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: "0.68rem", color: "#666" }}>휴식</span>
                          <input className="log-input" style={{ width: 48 }} type="number" value={entry.restSeconds} onChange={e => updateRestSeconds(entry.id, e.target.value)} />
                          <span style={{ fontSize: "0.68rem", color: "#666" }}>초</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1rem", letterSpacing: "2px", color: "#c8a96e", marginBottom: 10 }}>유산소</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {CARDIO_TYPES.map(t => (
              <button key={t} className={`chip${cardioType === t ? " active" : ""}`} onClick={() => setCardioType(t)}>{t}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input className="text-input" style={{ maxWidth: 140 }} type="number" inputMode="numeric" placeholder="분" value={cardioMinutes} onChange={e => setCardioMinutes(e.target.value)} />
            <button className="add-btn" onClick={addCardio}>추가</button>
          </div>
          {todaySession.cardio.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {todaySession.cardio.map(c => (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#111", border: "1px solid #1e1e1e", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: "0.85rem" }}>🏃 {c.type} · {c.minutes}분</div>
                  <button className="ghost-btn" onClick={() => removeCardio(c.id)}>삭제</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "history" && (
        <div style={{ padding: "16px 20px" }}>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1rem", letterSpacing: "2px", color: "#c8a96e", marginBottom: 12 }}>운동 기록</div>
          {pastSessions.length === 0 && <div style={{ color: "#555", fontSize: "0.85rem" }}>아직 기록이 없어요.</div>}
          {pastSessions.map(s => {
            const groupsCovered = Array.from(new Set(s.entries.map(e => e.groupId))).map(gid => MUSCLE_GROUPS.find(g => g.id === gid));
            const totalSets = s.entries.reduce((sum, e) => sum + totalSetsOf(e), 0);
            const cardioMin = (s.cardio || []).reduce((sum, c) => sum + Number(c.minutes || 0), 0);
            const isOpen = expandedHistoryId === s.id;
            return (
              <div key={s.id} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "12px 16px", marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setExpandedHistoryId(isOpen ? null : s.id)}>
                  <div>
                    <div style={{ fontFamily: "'Bebas Neue'", fontSize: "0.95rem", letterSpacing: "1px", color: s.date === today ? "#c8a96e" : "#f0ede6" }}>{formatDateKR(s.date)}</div>
                    <div style={{ fontSize: "0.72rem", color: "#666", marginTop: 2 }}>
                      {groupsCovered.map(g => g?.emoji).join(" ")} · {totalSets}세트
                      {s.startTime && s.endTime && ` · ${s.startTime}–${s.endTime} (${formatDuration(s.startTime, s.endTime)})`}
                      {cardioMin > 0 && ` · 유산소 ${cardioMin}분`}
                    </div>
                  </div>
                  <button className="ghost-btn" onClick={e => { e.stopPropagation(); deleteSession(s.id); }}>삭제</button>
                </div>
                {isOpen && (
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                    {s.entries.map(e => (
                      <div key={e.id} style={{ fontSize: "0.78rem", color: "#ccc", background: "#1a1a1a", borderRadius: 6, padding: "8px 10px" }}>
                        <strong>{e.exerciseName}</strong> — {formatRoundsCompact(e.rounds)}
                      </div>
                    ))}
                    {(s.cardio || []).map(c => (
                      <div key={c.id} style={{ fontSize: "0.78rem", color: "#ccc", background: "#1a1a1a", borderRadius: 6, padding: "8px 10px" }}>
                        🏃 {c.type} · {c.minutes}분
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
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1rem", letterSpacing: "2px", color: "#c8a96e", marginBottom: 12 }}>운동별 진행</div>
          {allExerciseNames.length === 0 && <div style={{ color: "#555", fontSize: "0.85rem" }}>기록을 쌓으면 여기서 무게 변화를 볼 수 있어요.</div>}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {allExerciseNames.map(name => (
              <button key={name} className={`chip${progressExercise === name ? " active" : ""}`} onClick={() => setProgressExercise(name)}>{name}</button>
            ))}
          </div>
          {progressExercise && progressData.length < 2 && (
            <div style={{ color: "#555", fontSize: "0.85rem" }}>이 운동은 2회 이상 기록해야 그래프가 나와요. (현재 {progressData.length}회)</div>
          )}
          {progressData.length >= 2 && (() => {
            const maxW = Math.max(...progressData.map(d => d.weight));
            const minW = Math.min(...progressData.map(d => d.weight));
            const gain = (progressData[progressData.length - 1].weight - progressData[0].weight).toFixed(1);
            return (
              <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontSize: "0.85rem", color: "#999" }}>{progressData.length}회 기록 · 현재 {progressData[progressData.length - 1].weight}kg</div>
                  <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1.1rem", color: parseFloat(gain) >= 0 ? "#6ec87a" : "#c86e6e" }}>
                    {parseFloat(gain) >= 0 ? "+" : ""}{gain}kg
                  </div>
                </div>
                <div style={{ display: "flex", gap: 5, alignItems: "flex-end", height: 90 }}>
                  {progressData.map((d, i) => {
                    const pct = maxW === minW ? 100 : ((d.weight - minW) / (maxW - minW)) * 75 + 25;
                    const isLatest = i === progressData.length - 1;
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
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
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1rem", letterSpacing: "2px", color: "#c8a96e", marginBottom: 6 }}>오늘 뭐 하지?</div>
          <div style={{ fontSize: "0.8rem", color: "#666", marginBottom: 14 }}>부위별 마지막 수행일을 참고해서 AI가 오늘 우선순위를 추천해줘요.</div>
          <textarea className="text-input" rows={3} placeholder="메모 (선택) 예: 오늘 시간 많아요, 어깨가 좀 뻐근해요" value={aiNote} onChange={e => setAiNote(e.target.value)} style={{ marginBottom: 12, resize: "vertical" }} />
          <button className="add-btn" disabled={aiLoading} onClick={getAiSuggestion} style={{ width: "100%" }}>
            {aiLoading ? "생각하는 중..." : "⚡ 추천받기"}
          </button>
          {aiResult && (
            <div style={{ marginTop: 16, background: "#111", border: "1px solid #2a2a2a", borderRadius: 10, padding: 16, fontSize: "0.85rem", color: "#ccc", lineHeight: 1.7 }}>{aiResult}</div>
          )}
          {aiError && (
            <div style={{ marginTop: 16, background: "#1a0e0e", border: "1px solid #3a1e1e", borderRadius: 8, padding: 14, fontSize: "0.85rem", color: "#c86e6e" }}>{aiError}</div>
          )}
        </div>
      )}

      {restTimer && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: restRemaining <= 0 ? "#c8a96e" : "#111", borderTop: "1px solid #2a2a2a", padding: "12px 20px calc(12px + env(safe-area-inset-bottom))", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 998 }}>
          <div>
            <div style={{ fontSize: "0.7rem", color: restRemaining <= 0 ? "#0a0a0a" : "#888" }}>{restTimer.exerciseName} 휴식</div>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1.6rem", letterSpacing: "2px", color: restRemaining <= 0 ? "#0a0a0a" : "#c8a96e" }}>
              {restRemaining <= 0 ? "휴식 끝! 🔔" : formatSecs(restRemaining)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="ghost-btn" onClick={() => adjustRest(-15)}>-15초</button>
            <button className="ghost-btn" onClick={() => adjustRest(15)}>+15초</button>
            <button className="ghost-btn" onClick={dismissRest}>닫기</button>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
