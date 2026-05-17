import { useState, useEffect, useRef } from "react";

const GOAL_PHYSIQUES = [
  { id: "brad_pitt_troy", name: "Brad Pitt (Troy)", emoji: "⚔️", focus: "lean muscle, definition" },
  { id: "captain_america", name: "Captain America", emoji: "🛡️", focus: "bulk + strength" },
  { id: "ryan_reynolds", name: "Ryan Reynolds", emoji: "🦸", focus: "athletic lean" },
  { id: "chris_hemsworth", name: "Chris Hemsworth", emoji: "⚡", focus: "massive + lean" },
];

const INITIAL_PROGRAM = [
  { day: "Mon", name: "Chest + Triceps", exercises: [
    { name: "Bench Press", sets: 4, reps: "8-10", rest: 90 },
    { name: "Incline Dumbbell Press", sets: 3, reps: "10-12", rest: 75 },
    { name: "Cable Fly", sets: 3, reps: "12-15", rest: 60 },
    { name: "Triceps Pushdown", sets: 3, reps: "12-15", rest: 60 },
  ]},
  { day: "Tue", name: "Back + Biceps", exercises: [
    { name: "Deadlift", sets: 4, reps: "5-6", rest: 120 },
    { name: "Barbell Row", sets: 4, reps: "8-10", rest: 90 },
    { name: "Lat Pulldown", sets: 3, reps: "10-12", rest: 75 },
    { name: "Barbell Curl", sets: 3, reps: "10-12", rest: 60 },
  ]},
  { day: "Thu", name: "Shoulders + Core", exercises: [
    { name: "Overhead Press", sets: 4, reps: "8-10", rest: 90 },
    { name: "Side Lateral Raise", sets: 4, reps: "12-15", rest: 60 },
    { name: "Face Pull", sets: 3, reps: "15-20", rest: 60 },
    { name: "Plank", sets: 3, reps: "60 sec", rest: 60 },
  ]},
  { day: "Fri", name: "Legs", exercises: [
    { name: "Squat", sets: 4, reps: "8-10", rest: 120 },
    { name: "Leg Press", sets: 3, reps: "12-15", rest: 90 },
    { name: "Romanian Deadlift", sets: 3, reps: "10-12", rest: 90 },
    { name: "Calf Raise", sets: 4, reps: "15-20", rest: 45 },
  ]},
];

const STORAGE_KEY = "forge_weeks_v2";

function loadWeeks() {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : []; }
  catch { return []; }
}

function saveWeeks(weeks) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(weeks)); } catch {}
}

function getWeekKey() {
  const n = new Date(), y = n.getFullYear();
  const s = new Date(y, 0, 1);
  const wk = Math.ceil(((n - s) / 86400000 + s.getDay() + 1) / 7);
  return `${y}-W${String(wk).padStart(2, "0")}`;
}

export default function WorkoutTracker() {
  const [tab, setTab] = useState("today");
  const [selectedPhysique, setSelectedPhysique] = useState(GOAL_PHYSIQUES[0]);
  const [program, setProgram] = useState(INITIAL_PROGRAM);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [weeks, setWeeks] = useState(() => loadWeeks());
  const [currentWeekKey] = useState(getWeekKey);
  const [logs, setLogs] = useState(() => {
    const w = loadWeeks().find(w => w.weekKey === getWeekKey());
    return w ? w.logs : {};
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [aiError, setAiError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef();
  const [toast, setToast] = useState("");
  const [customGoal, setCustomGoal] = useState("");
  const [completedSets, setCompletedSets] = useState({});

  // Timer state
  const [timerActive, setTimerActive] = useState(false);
  const [timerExName, setTimerExName] = useState("");
  const [timerTotal, setTimerTotal] = useState(0);
  const [timerLeft, setTimerLeft] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const updated = weeks.filter(w => w.weekKey !== currentWeekKey);
    const newWeeks = [...updated, { weekKey: currentWeekKey, physique: selectedPhysique.id, logs, program }];
    setWeeks(newWeeks);
    saveWeeks(newWeeks);
  }, [logs]);

  // Timer countdown
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setTimerLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive]);

  function startTimer(exName, restSecs) {
    clearInterval(timerRef.current);
    setTimerExName(exName);
    setTimerTotal(restSecs);
    setTimerLeft(restSecs);
    setTimerActive(true);
  }

  function skipTimer() {
    clearInterval(timerRef.current);
    setTimerActive(false);
  }

  function addTime(s) {
    setTimerLeft(prev => prev + s);
  }

  function markSetDone(dayIdx, exIdx, setNum, restSecs, exName) {
    const key = `${dayIdx}-${exIdx}`;
    setCompletedSets(prev => {
      const existing = new Set(prev[key] || []);
      if (existing.has(setNum)) {
        existing.delete(setNum);
      } else {
        existing.add(setNum);
        if (restSecs > 0) startTimer(exName, restSecs);
      }
      return { ...prev, [key]: existing };
    });
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  function updateLog(dayIdx, exIdx, field, value) {
    const key = `${dayIdx}-${exIdx}`;
    setLogs(prev => ({ ...prev, [key]: { ...(prev[key] || {}), [field]: value } }));
  }

  function getLog(dayIdx, exIdx, field) {
    return logs[`${dayIdx}-${exIdx}`]?.[field] || "";
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function generateProgram() {
    setAiLoading(true);
    setAiError("");
    setAiResult("");
    const goalText = customGoal
      ? `My goal physique: "${customGoal}"`
      : `My goal physique: "${selectedPhysique.name}" (${selectedPhysique.focus})`;
    try {
      let messages;
      if (imageFile && imagePreview) {
        const base64 = imagePreview.split(",")[1];
        messages = [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: imageFile.type, data: base64 } },
          { type: "text", text: `This photo shows my current physique. ${goalText}. Analyze my current body and tell me which areas need the most improvement to reach my goal. Then return a 4-day workout program as JSON only. Format: {"analysis": "analysis text", "program": [{"day": "Mon", "name": "muscle group", "exercises": [{"name": "exercise name", "sets": number, "reps": "range", "rest": seconds}]}]}` }
        ]}];
      } else {
        messages = [{ role: "user", content: `${goalText}. Return an optimized 4-day workout program to build this physique, as JSON only. Format: {"analysis": "key training strategy for this physique", "program": [{"day": "Mon", "name": "muscle group", "exercises": [{"name": "exercise name", "sets": number, "reps": "range", "rest": seconds}]}]}` }];
      }
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages })
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setAiResult(parsed.analysis || "");
      if (parsed.program) {
        setProgram(parsed.program);
        setTab("today");
        showToast("✅ AI program applied!");
      }
    } catch (e) {
      setAiError("Something went wrong generating the program. Please try again.");
    } finally {
      setAiLoading(false);
    }
  }

  function getProgressData(exName) {
    return weeks.map(w => {
      for (let di = 0; di < (w.program || []).length; di++) {
        const exIdx = (w.program[di]?.exercises || []).findIndex(e => e.name === exName);
        if (exIdx >= 0) {
          const key = `${di}-${exIdx}`;
          const weight = parseFloat(w.logs?.[key]?.weight);
          if (!isNaN(weight)) return { week: w.weekKey, weight };
        }
      }
      return null;
    }).filter(Boolean);
  }

  const todayExercises = program[selectedDayIdx]?.exercises || [];
  const allExNames = [...new Set(program.flatMap(d => d.exercises.map(e => e.name)))];

  // Timer ring calculation
  const circumference = 565;
  const timerPct = timerTotal > 0 ? timerLeft / timerTotal : 0;
  const timerOffset = circumference * (1 - timerPct);
  const timerMins = Math.floor(timerLeft / 60);
  const timerSecs = String(timerLeft % 60).padStart(2, "0");

  return (
    <div style={{ fontFamily: "'Bebas Neue', 'Inter', sans-serif", background: "#0a0a0a", minHeight: "100vh", color: "#f0ede6" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input { font-family: inherit; }
        .tab-btn { background: none; border: none; color: #888; font-family: 'Bebas Neue', sans-serif; font-size: 1.1rem; letter-spacing: 2px; cursor: pointer; padding: 10px 18px; transition: color 0.2s; border-bottom: 2px solid transparent; }
        .tab-btn.active { color: #c8a96e; border-bottom-color: #c8a96e; }
        .day-btn { background: none; border: 1px solid #2a2a2a; color: #888; font-family: 'Bebas Neue', sans-serif; font-size: 1rem; letter-spacing: 2px; cursor: pointer; padding: 8px 16px; border-radius: 4px; transition: all 0.2s; }
        .day-btn.active { background: #c8a96e; border-color: #c8a96e; color: #0a0a0a; }
        .log-input { background: #1a1a1a; border: 1px solid #2a2a2a; color: #f0ede6; border-radius: 4px; padding: 6px 10px; width: 72px; text-align: center; font-size: 0.95rem; }
        .log-input:focus { outline: none; border-color: #c8a96e; }
        .physique-btn { background: #111; border: 1px solid #2a2a2a; color: #888; border-radius: 8px; padding: 10px 14px; cursor: pointer; transition: all 0.2s; text-align: left; }
        .physique-btn.active { border-color: #c8a96e; color: #f0ede6; background: #1a1612; }
        .ai-btn { background: #c8a96e; color: #0a0a0a; border: none; font-family: 'Bebas Neue', sans-serif; font-size: 1.1rem; letter-spacing: 2px; padding: 14px 32px; border-radius: 6px; cursor: pointer; transition: opacity 0.2s; width: 100%; }
        .ai-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #c8a96e; color: #0a0a0a; padding: 10px 24px; border-radius: 999px; font-size: 0.95rem; font-family: 'Inter', sans-serif; font-weight: 700; z-index: 999; }
        .upload-area { border: 2px dashed #2a2a2a; border-radius: 10px; padding: 28px; text-align: center; cursor: pointer; transition: border-color 0.2s; }
        .upload-area:hover { border-color: #c8a96e; }
        .week-badge { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 4px; padding: 4px 10px; font-size: 0.8rem; color: #888; letter-spacing: 1px; font-family: 'Bebas Neue', sans-serif; }
        .goal-input { background: #1a1a1a; border: 1px solid #2a2a2a; color: #f0ede6; border-radius: 8px; padding: 10px 14px; width: 100%; font-size: 0.9rem; margin-bottom: 10px; }
        .goal-input:focus { outline: none; border-color: #c8a96e; }
        .goal-input::placeholder { color: #555; }
        .set-dot { width: 30px; height: 30px; border-radius: 50%; border: 1px solid #2a2a2a; background: #1a1a1a; cursor: pointer; font-family: 'Bebas Neue', sans-serif; font-size: 0.8rem; color: #555; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .set-dot.done { background: #c8a96e22; border-color: #c8a96e; color: #c8a96e; }
        .timer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.92); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 100; gap: 14px; }
        .timer-ring-wrap { position: relative; width: 200px; height: 200px; }
        .timer-ring-wrap svg { position: absolute; inset: 0; }
        .timer-count { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; }
        .timer-num { font-family: 'Bebas Neue', sans-serif; font-size: 4rem; color: #f0ede6; line-height: 1; }
        .timer-sec-label { font-family: 'Bebas Neue', sans-serif; font-size: 0.85rem; letter-spacing: 3px; color: #555; }
        .timer-actions { display: flex; gap: 12px; margin-top: 4px; }
        .timer-btn { background: none; border: 1px solid #333; color: #888; font-family: 'Bebas Neue', sans-serif; font-size: 0.9rem; letter-spacing: 2px; cursor: pointer; padding: 10px 22px; border-radius: 6px; transition: all 0.2s; }
        .timer-btn.primary { border-color: #c8a96e; color: #c8a96e; }
        .timer-btn:hover { border-color: #f0ede6; color: #f0ede6; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1a1a1a", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1.6rem", letterSpacing: "4px", color: "#c8a96e" }}>FORGE</div>
          <div style={{ fontFamily: "'Inter'", fontSize: "0.72rem", color: "#555", letterSpacing: "1px" }}>AI WORKOUT TRACKER</div>
        </div>
        <div className="week-badge">{currentWeekKey}</div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #1a1a1a", padding: "0 20px" }}>
        {[["today", "Today"], ["history", "Progress"], ["ai", "AI Program"]].map(([key, label]) => (
          <button key={key} className={`tab-btn${tab === key ? " active" : ""}`} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {/* TIMER OVERLAY */}
      {timerActive && (
        <div className="timer-overlay">
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1rem", letterSpacing: "4px", color: "#555" }}>REST TIMER</div>
          <div className="timer-ring-wrap">
            <svg viewBox="0 0 200 200" width="200" height="200">
              <circle fill="none" stroke="#1a1a1a" strokeWidth="8" cx="100" cy="100" r="90" />
              <circle
                fill="none" stroke="#c8a96e" strokeWidth="8" strokeLinecap="round"
                cx="100" cy="100" r="90"
                strokeDasharray={circumference}
                strokeDashoffset={timerOffset}
                style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 0.9s linear" }}
              />
            </svg>
            <div className="timer-count">
              <div className="timer-num">{timerMins > 0 ? `${timerMins}:${timerSecs}` : timerLeft}</div>
              <div className="timer-sec-label">{timerMins > 0 ? "MIN:SEC" : "SECONDS"}</div>
            </div>
          </div>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1rem", letterSpacing: "3px", color: "#c8a96e" }}>{timerExName}</div>
          <div style={{ fontFamily: "'Inter'", fontSize: "0.78rem", color: "#555" }}>다음 세트 준비하세요</div>
          <div className="timer-actions">
            <button className="timer-btn" onClick={() => addTime(15)}>+15s</button>
            <button className="timer-btn primary" onClick={skipTimer}>SKIP ↗</button>
          </div>
        </div>
      )}

      <div style={{ padding: "20px" }}>
        {/* TODAY TAB */}
        {tab === "today" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {program.map((d, i) => (
                <button key={i} className={`day-btn${selectedDayIdx === i ? " active" : ""}`} onClick={() => setSelectedDayIdx(i)}>
                  {d.day} · {d.name}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {todayExercises.map((ex, exIdx) => {
                const w = getLog(selectedDayIdx, exIdx, "weight");
                const note = getLog(selectedDayIdx, exIdx, "note");
                const prevWeek = weeks.slice(-2, -1)[0];
                const prevWeight = prevWeek ? parseFloat(prevWeek.logs?.[`${selectedDayIdx}-${exIdx}`]?.weight) : null;
                const gain = w && prevWeight ? (parseFloat(w) - prevWeight).toFixed(1) : null;
                const ck = `${selectedDayIdx}-${exIdx}`;
                const doneSets = completedSets[ck] || new Set();

                return (
                  <div key={exIdx} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: "0.95rem" }}>{ex.name}</div>
                        <div style={{ fontFamily: "'Inter'", fontSize: "0.78rem", color: "#666", marginTop: 2 }}>
                          {ex.sets} sets × {ex.reps} reps · {ex.rest}s rest
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        {w && <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1.3rem", color: "#c8a96e" }}>{w}kg</div>}
                        {gain !== null && (
                          <div style={{ fontSize: "0.75rem", color: parseFloat(gain) >= 0 ? "#6ec87a" : "#c86e6e", background: parseFloat(gain) >= 0 ? "#1a2a1a" : "#2a1a1a", padding: "2px 8px", borderRadius: 4 }}>
                            {parseFloat(gain) >= 0 ? `+${gain}` : gain}kg vs last week
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontFamily: "'Inter'", fontSize: "0.7rem", color: "#555", marginBottom: 4 }}>Weight (kg)</div>
                        <input className="log-input" type="number" placeholder="0" value={w}
                          onChange={e => updateLog(selectedDayIdx, exIdx, "weight", e.target.value)} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Inter'", fontSize: "0.7rem", color: "#555", marginBottom: 4 }}>Note</div>
                        <input className="log-input" style={{ width: "100%" }} type="text" placeholder="..." value={note}
                          onChange={e => updateLog(selectedDayIdx, exIdx, "note", e.target.value)} />
                      </div>
                    </div>
                    {/* Set completion dots */}
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {Array.from({ length: ex.sets }, (_, s) => (
                        <button
                          key={s}
                          className={`set-dot${doneSets.has(s) ? " done" : ""}`}
                          onClick={() => markSetDone(selectedDayIdx, exIdx, s, ex.rest, ex.name)}
                        >
                          {s + 1}
                        </button>
                      ))}
                      <span style={{ fontFamily: "'Inter'", fontSize: "0.7rem", color: "#444", marginLeft: 4 }}>
                        {doneSets.size}/{ex.sets} sets
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {tab === "history" && (
          <div>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1.2rem", letterSpacing: "3px", color: "#c8a96e", marginBottom: 16 }}>Progressive Overload Tracker</div>
            {weeks.length < 2 ? (
              <div style={{ fontFamily: "'Inter'", color: "#555", fontSize: "0.9rem", textAlign: "center", marginTop: 40 }}>
                Log workouts for 2+ weeks to see your progress chart!
              </div>
            ) : (
              allExNames.map(exName => {
                const data = getProgressData(exName);
                if (data.length < 2) return null;
                const maxW = Math.max(...data.map(d => d.weight));
                const minW = Math.min(...data.map(d => d.weight));
                const gain = (data[data.length - 1].weight - data[0].weight).toFixed(1);
                return (
                  <div key={exName} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: "0.9rem" }}>{exName}</div>
                      <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1rem", color: parseFloat(gain) >= 0 ? "#6ec87a" : "#c86e6e" }}>
                        {parseFloat(gain) >= 0 ? "+" : ""}{gain}kg
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 60 }}>
                      {data.map((d, i) => {
                        const pct = maxW === minW ? 100 : ((d.weight - minW) / (maxW - minW)) * 80 + 20;
                        return (
                          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                            <div style={{ fontFamily: "'Inter'", fontSize: "0.65rem", color: "#888" }}>{d.weight}</div>
                            <div style={{ width: "100%", background: i === data.length - 1 ? "#c8a96e" : "#2a2a2a", borderRadius: 3, height: `${pct}%`, minHeight: 8 }} />
                            <div style={{ fontFamily: "'Inter'", fontSize: "0.6rem", color: "#555" }}>W{d.week.split("-W")[1]}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1.2rem", letterSpacing: "3px", color: "#c8a96e", margin: "24px 0 16px" }}>Weekly History</div>
            {weeks.length === 0 && <div style={{ fontFamily: "'Inter'", color: "#555", fontSize: "0.9rem" }}>No records yet.</div>}
            {[...weeks].reverse().map((w, i) => (
              <div key={i} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 8, padding: "12px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1rem", letterSpacing: "2px", color: "#c8a96e" }}>{w.weekKey}</div>
                  <div style={{ fontFamily: "'Inter'", fontSize: "0.75rem", color: "#666" }}>
                    {Object.keys(w.logs || {}).length} sessions logged
                  </div>
                </div>
                <div style={{ fontFamily: "'Inter'", fontSize: "0.75rem", color: "#555" }}>
                  {GOAL_PHYSIQUES.find(p => p.id === w.physique)?.name || "Custom goal"}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI TAB */}
        {tab === "ai" && (
          <div>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1.2rem", letterSpacing: "3px", color: "#c8a96e", marginBottom: 6 }}>AI Program Generator</div>
            <div style={{ fontFamily: "'Inter'", fontSize: "0.8rem", color: "#666", marginBottom: 20 }}>
              Describe your goal physique or pick a preset below
            </div>
            <input className="goal-input" type="text"
              placeholder='e.g. "Brad Pitt in Troy — lean and defined" or "Angelina Jolie in Tomb Raider — athletic and toned"'
              value={customGoal} onChange={e => setCustomGoal(e.target.value)} />
            <div style={{ fontFamily: "'Inter'", fontSize: "0.75rem", color: "#555", marginBottom: 8 }}>Or choose a preset:</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
              {GOAL_PHYSIQUES.map(p => (
                <button key={p.id} className={`physique-btn${selectedPhysique.id === p.id && !customGoal ? " active" : ""}`}
                  onClick={() => { setSelectedPhysique(p); setCustomGoal(""); }}>
                  <div style={{ fontSize: "1.1rem" }}>{p.emoji}</div>
                  <div style={{ fontFamily: "'Inter'", fontSize: "0.75rem", marginTop: 2 }}>{p.name}</div>
                  <div style={{ fontFamily: "'Inter'", fontSize: "0.68rem", color: "#555", marginTop: 2 }}>{p.focus}</div>
                </button>
              ))}
            </div>
            <div style={{ fontFamily: "'Inter'", fontSize: "0.75rem", color: "#555", marginBottom: 8 }}>
              Upload your photo (optional — AI will analyze your current physique):
            </div>
            <div className="upload-area" onClick={() => fileInputRef.current?.click()} style={{ marginBottom: 20 }}>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />
              {imagePreview ? (
                <img src={imagePreview} alt="body" style={{ maxHeight: 180, borderRadius: 8, objectFit: "cover" }} />
              ) : (
                <>
                  <div style={{ fontSize: "2rem", marginBottom: 8 }}>📸</div>
                  <div style={{ fontFamily: "'Inter'", fontSize: "0.85rem", color: "#666" }}>
                    Tap to upload a photo<br />
                    <span style={{ fontSize: "0.75rem", color: "#444" }}>Works without a photo too — goal text is enough</span>
                  </div>
                </>
              )}
            </div>
            <button className="ai-btn" disabled={aiLoading} onClick={generateProgram}>
              {aiLoading ? "⏳ Generating..." : "⚡ GENERATE MY PROGRAM"}
            </button>
            {aiResult && (
              <div style={{ marginTop: 20, background: "#111", border: "1px solid #2a2a2a", borderRadius: 10, padding: "16px" }}>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: "0.9rem", letterSpacing: "2px", color: "#c8a96e", marginBottom: 8 }}>AI ANALYSIS</div>
                <div style={{ fontFamily: "'Inter'", fontSize: "0.85rem", color: "#ccc", lineHeight: 1.7 }}>{aiResult}</div>
              </div>
            )}
            {aiError && (
              <div style={{ marginTop: 16, background: "#1a0e0e", border: "1px solid #3a1e1e", borderRadius: 8, padding: 14, fontFamily: "'Inter'", fontSize: "0.85rem", color: "#c86e6e" }}>
                {aiError}
              </div>
            )}
          </div>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
