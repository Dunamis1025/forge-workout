import { useState, useEffect, useRef } from "react";

const GOAL_PHYSIQUES = [
  { id: "brad_pitt_troy", name: "Brad Pitt (Troy)", emoji: "⚔️", focus: "lean muscle, definition" },
  { id: "captain_america", name: "Captain America", emoji: "🛡️", focus: "bulk + strength" },
  { id: "ryan_reynolds", name: "Ryan Reynolds", emoji: "🦸", focus: "athletic lean" },
  { id: "chris_hemsworth", name: "Chris Hemsworth", emoji: "⚡", focus: "massive + lean" },
];

const INITIAL_PROGRAM = [
  {
    day: "Day 1", name: "Upper Chest", exercises: [
      { name: "Incline Dumbbell Press", sets: 4, reps: "8-12", rest: 90 },
      { name: "Incline Machine Press", sets: 3, reps: "10-12", rest: 90 },
      { name: "Cable Low-to-High Fly", sets: 3, reps: "12-15", rest: 60 },
      { name: "Seated Dumbbell Shoulder Press", sets: 4, reps: "8-12", rest: 90 },
      { name: "Dumbbell Lateral Raise", sets: 4, reps: "12-15", rest: 60 },
      { name: "Cable Front Raise", sets: 3, reps: "12-15", rest: 60 },
      { name: "Hanging Leg Raise", sets: 4, reps: "12-15", rest: 60 },
      { name: "Cable Crunch", sets: 3, reps: "15-20", rest: 60 },
    ]
  },
  {
    day: "Day 2", name: "Legs", exercises: [
      { name: "Leg Press", sets: 4, reps: "10-12", rest: 90 },
      { name: "Leg Extension", sets: 4, reps: "12-15", rest: 75 },
      { name: "Seated Leg Curl", sets: 3, reps: "12-15", rest: 75 },
      { name: "Hack Squat Machine", sets: 3, reps: "10-12", rest: 90 },
      { name: "Standing Calf Raise", sets: 4, reps: "12-15", rest: 60 },
      { name: "Seated Calf Raise", sets: 3, reps: "15-20", rest: 60 },
      { name: "Ab Wheel Rollout", sets: 3, reps: "10-15", rest: 60 },
    ]
  },
  {
    day: "Day 3", name: "Shoulders & Arms", exercises: [
      { name: "Machine Shoulder Press", sets: 4, reps: "8-12", rest: 90 },
      { name: "Cable Lateral Raise", sets: 4, reps: "12-15", rest: 60 },
      { name: "Rear Delt Fly Machine", sets: 4, reps: "12-15", rest: 60 },
      { name: "EZ Bar Curl", sets: 3, reps: "10-12", rest: 60 },
      { name: "Incline Dumbbell Curl", sets: 3, reps: "10-12", rest: 60 },
      { name: "Cable Triceps Pushdown", sets: 3, reps: "10-12", rest: 60 },
      { name: "Overhead Rope Triceps Extension", sets: 3, reps: "12-15", rest: 60 },
      { name: "Hanging Knee Raise", sets: 4, reps: "12-15", rest: 60 },
    ]
  },
  {
    day: "Day 4", name: "Upper Back & Core", exercises: [
      { name: "Incline Barbell Press", sets: 4, reps: "8-10", rest: 90 },
      { name: "Incline Dumbbell Fly", sets: 3, reps: "10-12", rest: 75 },
      { name: "Cable Upper Chest Press", sets: 3, reps: "12-15", rest: 60 },
      { name: "Dumbbell Lateral Raise", sets: 4, reps: "12-15", rest: 60 },
      { name: "Face Pull", sets: 3, reps: "12-15", rest: 60 },
      { name: "Preacher Curl Machine", sets: 3, reps: "10-12", rest: 60 },
      { name: "Rope Triceps Pushdown", sets: 3, reps: "10-12", rest: 60 },
      { name: "Cable Woodchopper", sets: 3, reps: "12-15", rest: 60 },
      { name: "Lat Pulldown", sets: 3, reps: "10-12", rest: 60 },
    ]
  },
];

const STORAGE_KEY = "forge_weeks_v2";
const PROGRAM_KEY = "forge_program_v2";

function getCurrentWeekKey() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

function loadAllWeeks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}

function saveAllWeeks(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function loadProgram() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROGRAM_KEY));
    return saved || INITIAL_PROGRAM;
  } catch { return INITIAL_PROGRAM; }
}

function saveProgram(program) {
  try { localStorage.setItem(PROGRAM_KEY, JSON.stringify(program)); } catch {}
}

export default function WorkoutTracker() {
  const [tab, setTab] = useState("today");
  const [program, setProgram] = useState(() => loadProgram());
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [currentWeekKey] = useState(getCurrentWeekKey);
  const [allWeeks, setAllWeeks] = useState(() => loadAllWeeks());
  const [selectedPhysique, setSelectedPhysique] = useState(GOAL_PHYSIQUES[0]);
  const [customGoal, setCustomGoal] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [aiError, setAiError] = useState("");
  const [toast, setToast] = useState("");
  const [restTimer, setRestTimer] = useState(null);
  const [restSeconds, setRestSeconds] = useState(0);
  const [restExName, setRestExName] = useState("");
  const timerRef = useRef(null);
  const fileInputRef = useRef();

  const currentLogs = allWeeks[currentWeekKey] || {};

  function updateLog(dayIdx, exIdx, setIdx, field, value) {
    const key = `${dayIdx}-${exIdx}-${setIdx}`;
    const updated = {
      ...allWeeks,
      [currentWeekKey]: {
        ...currentLogs,
        [key]: { ...(currentLogs[key] || {}), [field]: value }
      }
    };
    setAllWeeks(updated);
    saveAllWeeks(updated);
  }

  function getLog(dayIdx, exIdx, setIdx, field) {
    return allWeeks[currentWeekKey]?.[`${dayIdx}-${exIdx}-${setIdx}`]?.[field] || "";
  }

  function getPrevWeekLog(dayIdx, exIdx, setIdx, field) {
    const weeks = Object.keys(allWeeks).sort();
    const currIdx = weeks.indexOf(currentWeekKey);
    if (currIdx <= 0) return null;
    const prevKey = weeks[currIdx - 1];
    return allWeeks[prevKey]?.[`${dayIdx}-${exIdx}-${setIdx}`]?.[field] || null;
  }

  function startRestTimer(seconds, exName) {
    if (timerRef.current) clearInterval(timerRef.current);
    setRestTimer(seconds);
    setRestSeconds(seconds);
    setRestExName(exName);
    timerRef.current = setInterval(() => {
      setRestSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setRestTimer(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function skipTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    setRestTimer(null);
    setRestSeconds(0);
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
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
        messages = [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: imageFile.type, data: base64 } },
            {
              type: "text",
              text: `This photo shows my current physique. ${goalText}. Analyze my current body and tell me which areas need the most improvement. Then return a 4-day workout program as JSON only. Format: {"analysis": "analysis text", "program": [{"day": "Day 1", "name": "muscle group name", "exercises": [{"name": "exercise name", "sets": number, "reps": "range", "rest": seconds}]}]}`
            }
          ]
        }];
      } else {
        messages = [{
          role: "user",
          content: `${goalText}. Return an optimized 4-day workout program to build this physique, as JSON only. Format: {"analysis": "key training strategy", "program": [{"day": "Day 1", "name": "muscle group name", "exercises": [{"name": "exercise name", "sets": number, "reps": "range", "rest": seconds}]}]}`
        }];
      }

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages })
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setAiResult(parsed.analysis || "");
      if (parsed.program) {
        setProgram(parsed.program);
        saveProgram(parsed.program);
        setTab("today");
        showToast("✅ New program applied!");
      }
    } catch {
      setAiError("Something went wrong. Please try again.");
    } finally {
      setAiLoading(false);
    }
  }

  // Progress data: per exercise, collect max weight per week
  function getProgressData(dayIdx, exIdx) {
    const exName = program[dayIdx]?.exercises[exIdx]?.name;
    const numSets = program[dayIdx]?.exercises[exIdx]?.sets || 4;
    const weeks = Object.keys(allWeeks).sort();
    return weeks.map(wk => {
      let maxW = null;
      for (let s = 0; s < numSets; s++) {
        const w = parseFloat(allWeeks[wk]?.[`${dayIdx}-${exIdx}-${s}`]?.weight);
        if (!isNaN(w) && (maxW === null || w > maxW)) maxW = w;
      }
      return maxW !== null ? { week: wk, weight: maxW } : null;
    }).filter(Boolean);
  }

  const todayExercises = program[selectedDayIdx]?.exercises || [];

  const timerPct = restTimer ? (restSeconds / restTimer) * 100 : 0;
  const timerMin = Math.floor(restSeconds / 60);
  const timerSec = restSeconds % 60;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#0a0a0a", minHeight: "100vh", color: "#f0ede6" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input { font-family: inherit; }
        .tab-btn { background: none; border: none; color: #888; font-family: 'Bebas Neue', sans-serif; font-size: 1rem; letter-spacing: 2px; cursor: pointer; padding: 10px 14px; transition: color 0.2s; border-bottom: 2px solid transparent; }
        .tab-btn.active { color: #c8a96e; border-bottom: 2px solid #c8a96e; }
        .day-btn { background: none; border: 1px solid #2a2a2a; color: #888; font-family: 'Bebas Neue', sans-serif; font-size: 0.85rem; letter-spacing: 1px; cursor: pointer; padding: 7px 12px; border-radius: 4px; transition: all 0.2s; }
        .day-btn.active { background: #c8a96e; border-color: #c8a96e; color: #0a0a0a; }
        .log-input { background: #1a1a1a; border: 1px solid #2a2a2a; color: #f0ede6; border-radius: 4px; padding: 6px 8px; width: 64px; text-align: center; font-size: 0.9rem; }
        .log-input:focus { outline: none; border-color: #c8a96e; }
        .set-btn { background: #1a1a1a; border: 1px solid #2a2a2a; color: #888; border-radius: 4px; padding: 6px 10px; font-size: 0.78rem; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .set-btn:hover { border-color: #c8a96e; color: #c8a96e; }
        .physique-btn { background: #111; border: 1px solid #2a2a2a; color: #888; border-radius: 8px; padding: 10px 14px; cursor: pointer; transition: all 0.2s; text-align: left; }
        .physique-btn.active { border-color: #c8a96e; color: #f0ede6; background: #1a1612; }
        .ai-btn { background: #c8a96e; color: #0a0a0a; border: none; font-family: 'Bebas Neue', sans-serif; font-size: 1.1rem; letter-spacing: 2px; padding: 14px 32px; border-radius: 6px; cursor: pointer; width: 100%; }
        .ai-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #c8a96e; color: #0a0a0a; padding: 10px 24px; border-radius: 999px; font-size: 0.9rem; font-weight: 700; z-index: 999; }
        .upload-area { border: 2px dashed #2a2a2a; border-radius: 10px; padding: 24px; text-align: center; cursor: pointer; }
        .upload-area:hover { border-color: #c8a96e; }
        .goal-input { background: #1a1a1a; border: 1px solid #2a2a2a; color: #f0ede6; border-radius: 8px; padding: 10px 14px; width: 100%; font-size: 0.9rem; }
        .goal-input:focus { outline: none; border-color: #c8a96e; }
        .goal-input::placeholder { color: #444; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1a1a1a", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1.5rem", letterSpacing: "4px", color: "#c8a96e" }}>FORGE</div>
          <div style={{ fontSize: "0.65rem", color: "#555", letterSpacing: "1px" }}>AI WORKOUT TRACKER</div>
        </div>
        <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 4, padding: "3px 10px", fontSize: "0.72rem", color: "#888", letterSpacing: "1px" }}>{currentWeekKey}</div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #1a1a1a", padding: "0 20px" }}>
        {[["today", "Today"], ["progress", "Progress"], ["ai", "AI Program"]].map(([key, label]) => (
          <button key={key} className={`tab-btn${tab === key ? " active" : ""}`} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {/* REST TIMER OVERLAY */}
      {restTimer !== null && (
        <div style={{ background: "#0d0d0d", borderBottom: "1px solid #1e1e1e", padding: "20px", textAlign: "center" }}>
          <div style={{ fontSize: "0.7rem", color: "#888", letterSpacing: "3px", marginBottom: 8, fontFamily: "'Bebas Neue'" }}>REST TIMER</div>
          <div style={{ position: "relative", width: 100, height: 100, margin: "0 auto 12px" }}>
            <svg width="100" height="100" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="50" cy="50" r="44" fill="none" stroke="#1e1e1e" strokeWidth="6" />
              <circle cx="50" cy="50" r="44" fill="none" stroke="#c8a96e" strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 44}`}
                strokeDashoffset={`${2 * Math.PI * 44 * (1 - timerPct / 100)}`}
                strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s linear" }} />
            </svg>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1.6rem", color: "#f0ede6", lineHeight: 1 }}>
                {timerMin}:{String(timerSec).padStart(2, "0")}
              </div>
            </div>
          </div>
          <div style={{ fontSize: "0.8rem", color: "#888", marginBottom: 12 }}>{restExName}</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button className="set-btn" onClick={() => setRestSeconds(s => s + 15)}>+15s</button>
            <button className="set-btn" onClick={skipTimer}>SKIP ↑</button>
          </div>
        </div>
      )}

      {/* TODAY TAB */}
      {tab === "today" && (
        <div style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {program.map((d, i) => (
              <button key={i} className={`day-btn${selectedDayIdx === i ? " active" : ""}`} onClick={() => setSelectedDayIdx(i)}>
                {d.day} · {d.name}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {todayExercises.map((ex, exIdx) => {
              const numSets = ex.sets;
              return (
                <div key={exIdx} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{ex.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#666", marginTop: 2 }}>{ex.sets} sets · {ex.reps} reps · {ex.rest}s rest</div>
                    </div>
                  </div>

                  {/* Set rows */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {/* Header */}
                    <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 1fr 1fr auto", gap: 6, alignItems: "center" }}>
                      <div style={{ fontSize: "0.65rem", color: "#555" }}></div>
                      <div style={{ fontSize: "0.65rem", color: "#555", textAlign: "center" }}>Weight (kg)</div>
                      <div style={{ fontSize: "0.65rem", color: "#555", textAlign: "center" }}>Reps</div>
                      <div style={{ fontSize: "0.65rem", color: "#555", textAlign: "center" }}>Last week</div>
                      <div style={{ fontSize: "0.65rem", color: "#555", textAlign: "center" }}>Done</div>
                    </div>

                    {Array.from({ length: numSets }).map((_, setIdx) => {
                      const prevW = getPrevWeekLog(selectedDayIdx, exIdx, setIdx, "weight");
                      const prevR = getPrevWeekLog(selectedDayIdx, exIdx, setIdx, "reps");
                      const prevStr = prevW ? `${prevW}kg${prevR ? ` × ${prevR}` : ""}` : "—";
                      const currW = getLog(selectedDayIdx, exIdx, setIdx, "weight");
                      const currR = getLog(selectedDayIdx, exIdx, setIdx, "reps");
                      const done = getLog(selectedDayIdx, exIdx, setIdx, "done") === "1";
                      const improvement = currW && prevW ? parseFloat(currW) - parseFloat(prevW) : null;

                      return (
                        <div key={setIdx} style={{ display: "grid", gridTemplateColumns: "28px 1fr 1fr 1fr auto", gap: 6, alignItems: "center", opacity: done ? 0.5 : 1 }}>
                          <div style={{ fontSize: "0.72rem", color: "#555", textAlign: "center" }}>S{setIdx + 1}</div>
                          <input className="log-input" type="number" placeholder="—" value={currW}
                            onChange={e => updateLog(selectedDayIdx, exIdx, setIdx, "weight", e.target.value)} />
                          <input className="log-input" type="number" placeholder="—" value={currR}
                            onChange={e => updateLog(selectedDayIdx, exIdx, setIdx, "reps", e.target.value)} />
                          <div style={{ textAlign: "center", fontSize: "0.72rem" }}>
                            <div style={{ color: "#666" }}>{prevStr}</div>
                            {improvement !== null && (
                              <div style={{ color: improvement >= 0 ? "#6ec87a" : "#c86e6e", fontSize: "0.65rem" }}>
                                {improvement >= 0 ? `+${improvement.toFixed(1)}` : improvement.toFixed(1)}kg
                              </div>
                            )}
                          </div>
                          <button
                            className="set-btn"
                            style={{ background: done ? "#1a2a1a" : "#1a1a1a", borderColor: done ? "#3a6a3a" : "#2a2a2a", color: done ? "#6ec87a" : "#888", padding: "5px 8px" }}
                            onClick={() => {
                              updateLog(selectedDayIdx, exIdx, setIdx, "done", done ? "" : "1");
                              if (!done) startRestTimer(ex.rest, ex.name);
                            }}
                          >
                            {done ? "✓" : "Done"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PROGRESS TAB */}
      {tab === "progress" && (
        <div style={{ padding: "16px 20px" }}>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1.1rem", letterSpacing: "3px", color: "#c8a96e", marginBottom: 14 }}>Progressive Overload</div>

          {/* Day selector */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {program.map((d, i) => (
              <button key={i} className={`day-btn${selectedDayIdx === i ? " active" : ""}`} onClick={() => setSelectedDayIdx(i)}>
                {d.day}
              </button>
            ))}
          </div>

          {Object.keys(allWeeks).length < 2 ? (
            <div style={{ textAlign: "center", color: "#555", fontSize: "0.9rem", marginTop: 40, lineHeight: 1.8 }}>
              Log workouts for 2+ weeks<br />to see your progress here.
            </div>
          ) : (
            program[selectedDayIdx]?.exercises.map((ex, exIdx) => {
              const data = getProgressData(selectedDayIdx, exIdx);
              if (data.length < 2) return null;
              const maxW = Math.max(...data.map(d => d.weight));
              const minW = Math.min(...data.map(d => d.weight));
              const gain = (data[data.length - 1].weight - data[0].weight).toFixed(1);
              const gainPct = minW > 0 ? (((data[data.length - 1].weight - data[0].weight) / data[0].weight) * 100).toFixed(0) : 0;

              return (
                <div key={exIdx} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>{ex.name}</div>
                      <div style={{ fontSize: "0.72rem", color: "#666", marginTop: 2 }}>
                        {data.length} weeks tracked · current: {data[data.length - 1].weight}kg
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1.1rem", color: parseFloat(gain) >= 0 ? "#6ec87a" : "#c86e6e" }}>
                        {parseFloat(gain) >= 0 ? "+" : ""}{gain}kg
                      </div>
                      <div style={{ fontSize: "0.65rem", color: "#555" }}>{gainPct}% stronger</div>
                    </div>
                  </div>

                  {/* Bar chart */}
                  <div style={{ display: "flex", gap: 5, alignItems: "flex-end", height: 70 }}>
                    {data.map((d, i) => {
                      const pct = maxW === minW ? 100 : ((d.weight - minW) / (maxW - minW)) * 75 + 25;
                      const isLatest = i === data.length - 1;
                      return (
                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                          <div style={{ fontSize: "0.6rem", color: isLatest ? "#c8a96e" : "#666" }}>{d.weight}</div>
                          <div style={{ width: "100%", background: isLatest ? "#c8a96e" : "#2a2a2a", borderRadius: "2px 2px 0 0", height: `${pct}%`, minHeight: 6 }} />
                          <div style={{ fontSize: "0.58rem", color: "#555" }}>W{d.week.split("-W")[1]}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}

          {/* Weekly history */}
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1.1rem", letterSpacing: "3px", color: "#c8a96e", margin: "20px 0 12px" }}>Weekly Log</div>
          {Object.keys(allWeeks).length === 0 && (
            <div style={{ color: "#555", fontSize: "0.85rem" }}>No logs yet.</div>
          )}
          {Object.keys(allWeeks).sort().reverse().map(wk => {
            const logCount = Object.keys(allWeeks[wk]).filter(k => allWeeks[wk][k].weight).length;
            return (
              <div key={wk} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 8, padding: "10px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue'", fontSize: "0.95rem", letterSpacing: "2px", color: wk === currentWeekKey ? "#c8a96e" : "#f0ede6" }}>
                    {wk} {wk === currentWeekKey && <span style={{ fontSize: "0.65rem", color: "#c8a96e" }}>← this week</span>}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#666" }}>{logCount} sets logged</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI TAB */}
      {tab === "ai" && (
        <div style={{ padding: "16px 20px" }}>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1.1rem", letterSpacing: "3px", color: "#c8a96e", marginBottom: 6 }}>AI Program Generator</div>
          <div style={{ fontSize: "0.8rem", color: "#666", marginBottom: 16 }}>Describe your goal or pick a preset, optionally upload a photo</div>

          <input className="goal-input" type="text"
            placeholder='e.g. "Brad Pitt in Troy — lean and defined"'
            value={customGoal} onChange={e => setCustomGoal(e.target.value)}
            style={{ marginBottom: 12 }} />

          <div style={{ fontSize: "0.72rem", color: "#555", marginBottom: 8 }}>Or choose a preset:</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
            {GOAL_PHYSIQUES.map(p => (
              <button key={p.id} className={`physique-btn${selectedPhysique.id === p.id && !customGoal ? " active" : ""}`}
                onClick={() => { setSelectedPhysique(p); setCustomGoal(""); }}>
                <div style={{ fontSize: "1rem" }}>{p.emoji}</div>
                <div style={{ fontSize: "0.75rem", marginTop: 2 }}>{p.name}</div>
                <div style={{ fontSize: "0.65rem", color: "#555", marginTop: 2 }}>{p.focus}</div>
              </button>
            ))}
          </div>

          <div style={{ fontSize: "0.72rem", color: "#555", marginBottom: 8 }}>Photo (optional — AI will analyze your physique):</div>
          <div className="upload-area" onClick={() => fileInputRef.current?.click()} style={{ marginBottom: 16 }}>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />
            {imagePreview
              ? <img src={imagePreview} alt="body" style={{ maxHeight: 160, borderRadius: 8, objectFit: "cover" }} />
              : <div style={{ fontSize: "0.85rem", color: "#555" }}>📸 Tap to upload a photo</div>}
          </div>

          <button className="ai-btn" disabled={aiLoading} onClick={generateProgram}>
            {aiLoading ? "⏳ Generating..." : "⚡ GENERATE MY PROGRAM"}
          </button>

          {aiResult && (
            <div style={{ marginTop: 16, background: "#111", border: "1px solid #2a2a2a", borderRadius: 10, padding: 16 }}>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: "0.85rem", letterSpacing: "2px", color: "#c8a96e", marginBottom: 8 }}>AI ANALYSIS</div>
              <div style={{ fontSize: "0.85rem", color: "#ccc", lineHeight: 1.7 }}>{aiResult}</div>
            </div>
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
