import { useState } from "react";

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
  chest_upper: ["인클라인 덤벨 프레스", "인클라인 머신 프레스", "인클라인 바벨 프레스", "로우-투-하이 케이블 플라이"],
  chest_mid: ["플랫 바벨 프레스", "플랫 덤벨 프레스", "펙덱 플라이", "케이블 크로스오버"],
  chest_lower: ["디클라인 프레스", "딥스", "하이-투-로우 케이블 플라이", "로우 케이블 프레스"],
  back_lat: ["랫풀다운", "풀업", "스트레이트암 풀다운", "케이블 풀오버"],
  back_row: ["바벨 로우", "시티드 케이블 로우", "원암 덤벨 로우", "T바 로우"],
  legs_quad: ["스쿼트", "레그프레스", "레그 익스텐션", "핵스쿼트"],
  legs_ham: ["루마니안 데드리프트", "레그컬", "힙쓰러스트", "굿모닝"],
  shoulders_all: ["밀리터리 프레스", "사이드 레터럴 레이즈", "페이스풀", "리어델트 플라이", "프론트 레이즈"],
  arms_biceps: ["바벨 컬", "덤벨 컬", "인클라인 덤벨 컬", "해머 컬"],
  arms_triceps: ["케이블 푸시다운", "오버헤드 익스텐션", "딥스", "클로즈그립 벤치프레스"],
  free_any: [],
};

const STORAGE_KEY = "forge_sessions_v3";

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function todayISO() { return new Date().toISOString().slice(0, 10); }
function loadSessions() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; } }
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
    if (e) return { date: s.date, sets: e.sets };
  }
  return null;
}

function getProgressForExercise(sessions, exerciseName) {
  return sessions
    .filter(s => s.entries.some(e => e.exerciseName === exerciseName))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(s => {
      const e = s.entries.find(en => en.exerciseName === exerciseName);
      const weights = e.sets.map(st => parseFloat(st.weight)).filter(w => !isNaN(w));
      const maxW = weights.length ? Math.max(...weights) : null;
      return maxW !== null ? { date: s.date, weight: maxW } : null;
    })
    .filter(Boolean);
}

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

  const today = todayISO();
  const todaySession = sessions.find(s => s.date === today) || { id: uid(), date: today, entries: [] };
  const lastDoneMap = getLastDoneMap(sessions, true);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 2200); }

  function persistToday(updatedEntries) {
    const exists = sessions.some(s => s.date === today);
    const updatedSessions = exists
      ? sessions.map(s => (s.date === today ? { ...s, entries: updatedEntries } : s))
      : [...sessions, { ...todaySession, entries: updatedEntries }];
    setSessions(updatedSessions);
    saveSessions(updatedSessions);
  }

  function selectGroup(gid) {
    setSelectedGroupId(gid);
    const g = MUSCLE_GROUPS.find(gr => gr.id === gid);
    setSelectedSubtagId(g.subtags[0].id);
    setExerciseInput("");
  }

  function addEntry() {
    if (!exerciseInput.trim()) { showToast("운동 이름을 입력해주세요"); return; }
    const entry = {
      id: uid(),
      groupId: selectedGroupId,
      subtagId: selectedSubtagId,
      exerciseName: exerciseInput.trim(),
      sets: [{ weight: "", reps: "" }],
    };
    persistToday([...todaySession.entries, entry]);
    setExerciseInput("");
    showToast("추가됐어요 💪");
  }

  function removeEntry(entryId) {
    persistToday(todaySession.entries.filter(e => e.id !== entryId));
  }

  function addSet(entryId) {
    persistToday(todaySession.entries.map(e => (e.id === entryId ? { ...e, sets: [...e.sets, { weight: "", reps: "" }] } : e)));
  }

  function removeSet(entryId, setIdx) {
    persistToday(todaySession.entries.map(e => (e.id === entryId ? { ...e, sets: e.sets.filter((_, i) => i !== setIdx) } : e)));
  }

  function updateSet(entryId, setIdx, field, value) {
    persistToday(
      todaySession.entries.map(e =>
        e.id === entryId
          ? { ...e, sets: e.sets.map((st, i) => (i === setIdx ? { ...st, [field]: value } : st)) }
          : e
      )
    );
  }

  function resetToday() {
    if (!window.confirm("오늘 기록을 전부 지울까요?")) return;
    persistToday([]);
  }

  function deleteSession(sessionId) {
    if (!window.confirm("이 기록을 삭제할까요?")) return;
    const updated = sessions.filter(s => s.id !== sessionId);
    setSessions(updated);
    saveSessions(updated);
  }

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
  const pastSessions = [...sessions].filter(s => s.entries.length > 0).sort((a, b) => b.date.localeCompare(a.date));
  const selectedGroup = MUSCLE_GROUPS.find(g => g.id === selectedGroupId);
  const progressData = progressExercise ? getProgressForExercise(sessions, progressExercise) : [];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#0a0a0a", minHeight: "100vh", color: "#f0ede6" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input, textarea { font-family: inherit; }
        .tab-btn { background: none; border: none; color: #888; font-family: 'Bebas Neue', sans-serif; font-size: 1rem; letter-spacing: 2px; cursor: pointer; padding: 10px 12px; border-bottom: 2px solid transparent; white-space: nowrap; }
        .tab-btn.active { color: #c8a96e; border-bottom: 2px solid #c8a96e; }
        .chip { background: none; border: 1px solid #2a2a2a; color: #888; font-size: 0.78rem; cursor: pointer; padding: 6px 12px; border-radius: 999px; transition: all 0.15s; }
        .chip.active { background: #c8a96e; border-color: #c8a96e; color: #0a0a0a; font-weight: 700; }
        .log-input { background: #1a1a1a; border: 1px solid #2a2a2a; color: #f0ede6; border-radius: 4px; padding: 6px 8px; width: 100%; text-align: center; font-size: 0.88rem; }
        .log-input:focus { outline: none; border-color: #c8a96e; }
        .text-input { background: #1a1a1a; border: 1px solid #2a2a2a; color: #f0ede6; border-radius: 8px; padding: 10px 14px; width: 100%; font-size: 0.88rem; }
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
                <button key={st.id} className={`chip${selectedSubtagId === st.id ? " active" : ""}`} onClick={() => { setSelectedSubtagId(st.id); setExerciseInput(""); }}>{st.name}</button>
              ))}
            </div>
          )}
          {(EXERCISE_PRESETS[selectedSubtagId] || []).length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {EXERCISE_PRESETS[selectedSubtagId].map(name => (
                <button key={name} className="ghost-btn" onClick={() => setExerciseInput(name)}>{name}</button>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <input className="text-input" placeholder="운동 이름 입력 (또는 위에서 선택)" value={exerciseInput} onChange={e => setExerciseInput(e.target.value)} />
            <button className="add-btn" onClick={addEntry}>추가</button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1rem", letterSpacing: "2px", color: "#c8a96e" }}>오늘 기록</div>
            {todaySession.entries.length > 0 && <button className="ghost-btn" onClick={resetToday}>전체 초기화</button>}
          </div>
          {todaySession.entries.length === 0 && (
            <div style={{ color: "#555", fontSize: "0.85rem", padding: "20px 0", textAlign: "center" }}>아직 기록한 운동이 없어요.</div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {todaySession.entries.map(entry => {
              const group = MUSCLE_GROUPS.find(g => g.id === entry.groupId);
              const subtag = group?.subtags.find(st => st.id === entry.subtagId);
              const history = getExerciseHistory(sessions, entry.exerciseName, today);
              return (
                <div key={entry.id} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{entry.exerciseName}</div>
                      <div style={{ fontSize: "0.72rem", color: "#666", marginTop: 2 }}>{group?.emoji} {group?.name}{subtag ? ` · ${subtag.name}` : ""}</div>
                    </div>
                    <button className="ghost-btn" onClick={() => removeEntry(entry.id)}>삭제</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "24px 1fr 1fr 1fr 24px", gap: 6, alignItems: "center", marginBottom: 4 }}>
                    <div />
                    <div style={{ fontSize: "0.62rem", color: "#555", textAlign: "center" }}>무게(kg)</div>
                    <div style={{ fontSize: "0.62rem", color: "#555", textAlign: "center" }}>렙스</div>
                    <div style={{ fontSize: "0.62rem", color: "#555", textAlign: "center" }}>지난번</div>
                    <div />
                  </div>
                  {entry.sets.map((st, i) => {
                    const prev = history?.sets?.[i];
                    return (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "24px 1fr 1fr 1fr 24px", gap: 6, alignItems: "center", marginBottom: 6 }}>
                        <div style={{ fontSize: "0.68rem", color: "#555", textAlign: "center" }}>S{i + 1}</div>
                        <input className="log-input" type="number" inputMode="decimal" placeholder="—" value={st.weight} onChange={e => updateSet(entry.id, i, "weight", e.target.value)} />
                        <input className="log-input" type="number" inputMode="numeric" placeholder="—" value={st.reps} onChange={e => updateSet(entry.id, i, "reps", e.target.value)} />
                        <div style={{ fontSize: "0.68rem", color: "#666", textAlign: "center" }}>{prev ? `${prev.weight || "—"}×${prev.reps || "—"}` : "—"}</div>
                        <button onClick={() => removeSet(entry.id, i)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "0.9rem" }}>×</button>
                      </div>
                    );
                  })}
                  <button className="ghost-btn" onClick={() => addSet(entry.id)} style={{ marginTop: 4 }}>+ 세트 추가</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "history" && (
        <div style={{ padding: "16px 20px" }}>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1rem", letterSpacing: "2px", color: "#c8a96e", marginBottom: 12 }}>운동 기록</div>
          {pastSessions.length === 0 && <div style={{ color: "#555", fontSize: "0.85rem" }}>아직 기록이 없어요.</div>}
          {pastSessions.map(s => {
            const groupsCovered = Array.from(new Set(s.entries.map(e => e.groupId))).map(gid => MUSCLE_GROUPS.find(g => g.id === gid));
            const totalSets = s.entries.reduce((sum, e) => sum + e.sets.length, 0);
            const isOpen = expandedHistoryId === s.id;
            return (
              <div key={s.id} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "12px 16px", marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setExpandedHistoryId(isOpen ? null : s.id)}>
                  <div>
                    <div style={{ fontFamily: "'Bebas Neue'", fontSize: "0.95rem", letterSpacing: "1px", color: s.date === today ? "#c8a96e" : "#f0ede6" }}>{formatDateKR(s.date)}</div>
                    <div style={{ fontSize: "0.72rem", color: "#666", marginTop: 2 }}>{groupsCovered.map(g => g?.emoji).join(" ")} · {totalSets}세트</div>
                  </div>
                  <button className="ghost-btn" onClick={e => { e.stopPropagation(); deleteSession(s.id); }}>삭제</button>
                </div>
                {isOpen && (
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                    {s.entries.map(e => (
                      <div key={e.id} style={{ fontSize: "0.78rem", color: "#ccc", background: "#1a1a1a", borderRadius: 6, padding: "8px 10px" }}>
                        <strong>{e.exerciseName}</strong> — {e.sets.map(st => `${st.weight || "—"}kg×${st.reps || "—"}`).join(", ")}
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

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
