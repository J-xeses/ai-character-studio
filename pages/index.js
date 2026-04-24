import { useState, useCallback } from "react";
import Head from "next/head";

const CLAUDE_MODEL = "claude-sonnet-4-20250514";

const T = {
  bg: "#05040a", s: "#0c0b14", s2: "#11101c", c: "#161524", ch: "#1e1c2e",
  b: "#ffffff08", ba: "#ffffff12", bg2: "#ffffff20",
  ac: "#a78bfa", acd: "#a78bfa18", acg: "linear-gradient(135deg,#a78bfa,#f472b6)",
  g: "#34d399", gd: "#34d39918", am: "#fbbf24", amd: "#fbbf2418",
  r: "#f87171", rd: "#f8717118", cy: "#22d3ee", cyd: "#22d3ee18",
  t: "#f0eeff", ts: "#9d9bbf", tm: "#5a5875",
  m: "'JetBrains Mono','SF Mono',monospace",
  f: "'Syne',-apple-system,sans-serif",
};

const LANGS = [
  { code: "ko", label: "🇰🇷 한국어", name: "Korean" },
  { code: "en", label: "🇺🇸 English", name: "English" },
  { code: "vi", label: "🇻🇳 Tiếng Việt", name: "Vietnamese" },
  { code: "th", label: "🇹🇭 ภาษาไทย", name: "Thai" },
  { code: "ru", label: "🇷🇺 Русский", name: "Russian" },
];

const INIT_CHARS = [
  {
    id: 1, name: "서여리 (Seo Yeo-ri)", color: "#a78bfa",
    persona: "20대 한국 여성 인플루언서. 카메라 앞에서는 완벽하지만 뒤에서는 엉뚱하고 진솔함. 친구에게 속삭이듯 대화하는 스타일. 영어 단어를 자연스럽게 섞어 씀.",
    tone: "친근하고 발랄하게, 가끔 백치미 있게",
  },
];

const EP_TYPES = [
  { label: "백치미 에피소드", value: "light" },
  { label: "감성 에피소드", value: "emotional" },
  { label: "K-문화 에피소드", value: "kculture" },
  { label: "트렌드 에피소드", value: "trend" },
];

const Pill = ({ children, color = "#a78bfa" }) => (
  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: `${color}18`, color, fontFamily: T.m }}>{children}</span>
);

const Spin = ({ s = 16, c = "#a78bfa" }) => (
  <div style={{ width: s, height: s, border: `2px solid ${c}25`, borderTopColor: c, borderRadius: "50%", animation: "spin .7s linear infinite" }} />
);

function CopyBtn({ text, label = "복사" }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${copied ? T.g : T.ba}`, background: copied ? T.gd : T.s2, color: copied ? T.g : T.ts, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: T.m, transition: "all .2s" }}>
      {copied ? "✅ 복사됨" : `📋 ${label}`}
    </button>
  );
}

function ScriptBox({ title, content, color = "#a78bfa" }) {
  return (
    <div style={{ background: T.s2, border: `1px solid ${color}25`, borderRadius: 10, padding: 14, marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color }}>{title}</div>
        <CopyBtn text={content} />
      </div>
      <div style={{ fontSize: 12, lineHeight: 1.75, color: T.ts, whiteSpace: "pre-wrap", maxHeight: 200, overflowY: "auto" }}>{content}</div>
    </div>
  );
}

export default function AICharacterStudio() {
  const [tab, setTab] = useState("studio");
  const [apiKey, setApiKey] = useState("");
  const [apiSaved, setApiSaved] = useState(false);
  const [chars, setChars] = useState(INIT_CHARS);
  const [selChar, setSelChar] = useState(INIT_CHARS[0]);
  const [showAdd, setShowAdd] = useState(false);
  const [newChar, setNewChar] = useState({ name: "", persona: "", tone: "", color: "#22d3ee" });
  const [topic, setTopic] = useState("");
  const [kEl, setKEl] = useState("");
  const [epType, setEpType] = useState("light");
  const [len, setLen] = useState("60");
  const [selLangs, setSelLangs] = useState(["ko"]);
  const [generating, setGenerating] = useState(false);
  const [step, setStep] = useState("");
  const [scripts, setScripts] = useState({});
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  const callClaude = useCallback(async (prompt) => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || `API 오류 ${res.status}`); }
    const d = await res.json();
    return d.content?.map(c => c.text || "").join("") || "";
  }, []);

  const generate = useCallback(async () => {
    if (!apiSaved) { setError("Claude API 키를 먼저 설정해주세요."); return; }
    if (!topic.trim()) { setError("에피소드 주제를 입력해주세요."); return; }
    setGenerating(true); setError(""); setScripts({});
    try {
      const epLabel = EP_TYPES.find(e => e.value === epType)?.label || epType;
      setStep("✍️ 한국어 대본 생성중...");
      const ko = await callClaude(`당신은 AI 캐릭터 "${selChar.name}"의 유튜브 숏폼 대본 작가입니다.\n캐릭터 페르소나: ${selChar.persona}\n말투: ${selChar.tone}\n\n주제: ${topic}\nK-문화 요소: ${kEl || "자연스럽게 포함"}\n유형: ${epLabel}\n목표 길이: ${len}초\n\n구조:\n[후킹 0~5초]: 강렬한 오프닝\n[전환 5~15초]: 카메라 뒤 진짜 모습\n[핵심 15~45초]: 메인 내용\n[K-무드 45~55초]: K-문화 요소\n[엔딩 55~60초]: 시그니처 엔딩\n\n구어체, 영어 단어 자연스럽게 섞기, 대본만 작성`);
      const ns = { ko };
      setScripts({ ko });
      for (const lc of selLangs.filter(l => l !== "ko")) {
        const lang = LANGS.find(l => l.code === lc);
        setStep(`🌍 ${lang.label} 번역중...`);
        const tr = await callClaude(`Translate this Korean YouTube script to ${lang.name}. Keep conversational tone, cultural nuances, English words, and [section tags]. Only output the translated script.\n\n${ko}`);
        ns[lc] = tr;
        setScripts({ ...ns });
      }
      setStep("🏷️ 메타데이터 생성중...");
      const metaRaw = await callClaude(`YouTube short-form topic: "${topic}", Character: ${selChar.name}\nReturn JSON only (no markdown):\n{"titles":{"ko":"<max 40ch>","en":"<title>"},"hashtags":{"ko":["#t1","#t2","#t3","#t4","#t5"]},"thumbnail_ko":"<7자 이내>"}`);
      try { ns._meta = JSON.parse(metaRaw.replace(/```json|```/g, "").trim()); } catch {}
      setScripts({ ...ns });
      setHistory(p => [{ id: Date.now(), char: selChar.name, topic, scripts: { ...ns }, time: new Date().toLocaleString("ko-KR"), langs: selLangs }, ...p.slice(0, 9)]);
      setStep("✅ 완료!");
    } catch (e) { setError(e.message); }
    setGenerating(false);
    setTimeout(() => setStep(""), 3000);
  }, [apiSaved, topic, kEl, epType, len, selLangs, selChar, callClaude]);

  const toggleLang = (code) => setSelLangs(p => p.includes(code) ? p.filter(l => l !== code) : [...p, code]);
  const addChar = () => { if (!newChar.name.trim()) return; setChars(p => [...p, { ...newChar, id: Date.now() }]); setNewChar({ name: "", persona: "", tone: "", color: "#22d3ee" }); setShowAdd(false); };
  const COLORS = ["#a78bfa", "#22d3ee", "#34d399", "#fbbf24", "#f87171", "#f472b6"];

  return (
    <>
      <Head>
        <title>AI Character Studio — 대본 자동생성 + 다국어 번역</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ minHeight: "100vh", background: T.bg, color: T.t, fontFamily: T.f, margin: 0 }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes shimmer{0%,100%{opacity:.5}50%{opacity:1}}*{box-sizing:border-box;scrollbar-width:thin;scrollbar-color:#ffffff12 transparent}input,textarea,select,button{outline:none;font-family:inherit}textarea{resize:vertical}body{margin:0;background:${T.bg}}`}</style>

        <header style={{ padding: "14px 20px", borderBottom: `1px solid ${T.b}`, background: T.s, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: T.acg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✨</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.03em" }}>AI Character Studio <span style={{ fontSize: 10, color: T.ac, fontFamily: T.m }}>v2</span></div>
              <div style={{ fontSize: 9, color: T.tm, fontFamily: T.m }}>대본 자동생성 + 다국어 번역 · Powered by Claude</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {apiSaved && <Pill color={T.g}>🔑 연결됨</Pill>}
            <Pill color={T.cy}>{chars.length} 캐릭터</Pill>
          </div>
        </header>

        <div style={{ display: "flex", borderBottom: `1px solid ${T.b}`, background: T.s }}>
          {[{ id: "studio", l: "🎬 스튜디오" }, { id: "characters", l: "👤 캐릭터" }, { id: "history", l: `📁 기록(${history.length})` }, { id: "settings", l: "⚙️ 설정" }].map(tb => (
            <button key={tb.id} onClick={() => setTab(tb.id)} style={{ flex: 1, padding: "11px 8px", background: "transparent", border: "none", borderBottom: tab === tb.id ? `2px solid ${T.ac}` : "2px solid transparent", color: tab === tb.id ? T.t : T.tm, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{tb.l}</button>
          ))}
        </div>

        <div style={{ padding: 16, maxWidth: 620, margin: "0 auto" }}>

          {/* ═══ STUDIO ═══ */}
          {tab === "studio" && <div style={{ animation: "fadeUp .3s ease" }}>
            {!apiSaved && <div style={{ background: T.amd, border: `1px solid ${T.am}30`, borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 12, color: T.am }}>⚠️ [설정] 탭에서 Claude API 키를 먼저 입력해주세요.</div>}

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.ts, fontFamily: T.m, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>캐릭터 선택</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {chars.map(c => <button key={c.id} onClick={() => setSelChar(c)} style={{ padding: "8px 14px", borderRadius: 10, border: `1px solid ${selChar.id === c.id ? c.color : T.b}`, background: selChar.id === c.id ? `${c.color}18` : T.c, color: selChar.id === c.id ? c.color : T.ts, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{c.name.split(" ")[0]}</button>)}
              </div>
            </div>

            <div style={{ background: T.c, border: `1px solid ${T.b}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 14, color: T.ac }}>📝 에피소드 설정</div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.ts, fontFamily: T.m, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>주제 *</div>
                <textarea value={topic} onChange={e => setTopic(e.target.value)} rows={2} placeholder="예: 홈카페 브이로그 찍으려다 편의점 간 날" style={{ width: "100%", background: T.s2, border: `1px solid ${T.ba}`, borderRadius: 10, padding: "10px 14px", color: T.t, fontSize: 13 }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.ts, fontFamily: T.m, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>K-문화 요소 (선택)</div>
                <input value={kEl} onChange={e => setKEl(e.target.value)} placeholder="예: 편의점 커피, 찜질방, 치킨 배달..." style={{ width: "100%", background: T.s2, border: `1px solid ${T.ba}`, borderRadius: 10, padding: "10px 14px", color: T.t, fontSize: 13 }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.ts, fontFamily: T.m, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>유형</div>
                  <select value={epType} onChange={e => setEpType(e.target.value)} style={{ width: "100%", background: T.s2, border: `1px solid ${T.ba}`, borderRadius: 10, padding: "10px 14px", color: T.t, fontSize: 12 }}>
                    {EP_TYPES.map(e => <option key={e.value} value={e.value} style={{ background: T.s }}>{e.label}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.ts, fontFamily: T.m, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>길이</div>
                  <select value={len} onChange={e => setLen(e.target.value)} style={{ width: "100%", background: T.s2, border: `1px solid ${T.ba}`, borderRadius: 10, padding: "10px 14px", color: T.t, fontSize: 12 }}>
                    {["30", "45", "60", "90"].map(s => <option key={s} value={s} style={{ background: T.s }}>{s}초</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div style={{ background: T.c, border: `1px solid ${T.b}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, color: T.cy }}>🌍 번역 언어</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {LANGS.map(lang => {
                  const sel = selLangs.includes(lang.code);
                  const done = scripts[lang.code];
                  return <button key={lang.code} onClick={() => lang.code !== "ko" && toggleLang(lang.code)}
                    style={{ padding: "8px 14px", borderRadius: 10, border: `1px solid ${done ? T.g : sel ? T.cy : T.b}`, background: done ? T.gd : sel ? T.cyd : T.s2, color: done ? T.g : sel ? T.cy : T.ts, fontSize: 12, fontWeight: 700, cursor: lang.code === "ko" ? "default" : "pointer" }}>
                    {done ? "✅ " : ""}{lang.label}{lang.code === "ko" ? " (기본)" : ""}
                  </button>;
                })}
              </div>
              <div style={{ fontSize: 10, color: T.tm, marginTop: 8, fontFamily: T.m }}>한국어 기본 포함 · 나머지 선택 (API 비용 발생)</div>
            </div>

            <button onClick={generate} disabled={generating || !apiSaved}
              style={{ width: "100%", padding: 16, borderRadius: 14, background: generating || !apiSaved ? T.c : T.acg, border: "none", color: generating || !apiSaved ? T.tm : "#fff", fontSize: 15, fontWeight: 800, cursor: generating || !apiSaved ? "not-allowed" : "pointer", boxShadow: generating || !apiSaved ? "none" : "0 4px 24px #a78bfa30" }}>
              {generating ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Spin /><span style={{ animation: "shimmer 1.5s infinite" }}>{step}</span></span> : "✨ 대본 생성 시작"}
            </button>
            {error && <div style={{ background: T.rd, border: `1px solid ${T.r}30`, borderRadius: 10, padding: 12, marginTop: 10, fontSize: 12, color: T.r }}>⚠️ {error}</div>}

            {Object.keys(scripts).filter(k => k !== "_meta").length > 0 && <div style={{ marginTop: 20, animation: "fadeUp .3s ease" }}>
              {scripts._meta && <div style={{ background: `${T.ac}0c`, border: `1px solid ${T.ac}20`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: T.ac, marginBottom: 10 }}>🏷️ 메타데이터</div>
                {scripts._meta.thumbnail_ko && <div style={{ marginBottom: 10 }}><div style={{ fontSize: 10, color: T.tm, fontFamily: T.m, marginBottom: 4 }}>썸네일 문구</div><div style={{ fontSize: 22, fontWeight: 800 }}>{scripts._meta.thumbnail_ko}</div></div>}
                {scripts._meta.titles && Object.entries(scripts._meta.titles).map(([lc, title]) => { const lang = LANGS.find(l => l.code === lc); return lang ? <div key={lc} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${T.b}`, fontSize: 11 }}><span style={{ color: T.ts }}>{lang.label}</span><span style={{ fontWeight: 600 }}>{title}</span></div> : null; })}
                {scripts._meta.hashtags?.ko && <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>{scripts._meta.hashtags.ko.map((tag, i) => <Pill key={i} color={T.ac}>{tag}</Pill>)}</div>}
              </div>}
              <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 10 }}>📄 생성된 대본</div>
              {LANGS.filter(l => selLangs.includes(l.code) && scripts[l.code]).map(lang => (
                <ScriptBox key={lang.code} title={lang.label} content={scripts[lang.code]} color={lang.code === "ko" ? T.ac : lang.code === "en" ? T.g : lang.code === "vi" ? T.am : lang.code === "th" ? T.cy : T.r} />
              ))}
              {selLangs.every(l => scripts[l]) && <div style={{ background: T.gd, border: `1px solid ${T.g}30`, borderRadius: 12, padding: 14, marginTop: 10, textAlign: "center" }}><div style={{ fontSize: 14, fontWeight: 800, color: T.g }}>🎉 완료! 대본을 복사해서 P-Video Avatar에 붙여넣으세요!</div></div>}
            </div>}
          </div>}

          {/* ═══ CHARACTERS ═══ */}
          {tab === "characters" && <div style={{ animation: "fadeUp .3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: T.ts }}>AI 캐릭터 관리</div>
              <button onClick={() => setShowAdd(!showAdd)} style={{ padding: "7px 14px", borderRadius: 8, background: T.acd, border: `1px solid ${T.ac}30`, color: T.ac, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>+ 새 캐릭터</button>
            </div>
            {showAdd && <div style={{ background: T.c, border: `1px solid ${T.ac}25`, borderRadius: 14, padding: 16, marginBottom: 14, animation: "fadeUp .25s ease" }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>✨ 새 캐릭터</div>
              {[{ l: "이름", k: "name", ph: "예: 김지수 (Kim Ji-su)" }, { l: "페르소나", k: "persona", ph: "성격, 직업, 배경...", rows: 3 }, { l: "말투/톤", k: "tone", ph: "예: 밝고 에너지 넘치게..." }].map(f => (
                <div key={f.k} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.ts, fontFamily: T.m, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>{f.l}</div>
                  {f.rows ? <textarea value={newChar[f.k]} onChange={e => setNewChar(p => ({ ...p, [f.k]: e.target.value }))} placeholder={f.ph} rows={f.rows} style={{ width: "100%", background: T.s2, border: `1px solid ${T.ba}`, borderRadius: 8, padding: "9px 12px", color: T.t, fontSize: 12 }} />
                    : <input value={newChar[f.k]} onChange={e => setNewChar(p => ({ ...p, [f.k]: e.target.value }))} placeholder={f.ph} style={{ width: "100%", background: T.s2, border: `1px solid ${T.ba}`, borderRadius: 8, padding: "9px 12px", color: T.t, fontSize: 12 }} />}
                </div>
              ))}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.ts, fontFamily: T.m, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>색상</div>
                <div style={{ display: "flex", gap: 8 }}>{COLORS.map(col => <button key={col} onClick={() => setNewChar(p => ({ ...p, color: col }))} style={{ width: 28, height: 28, borderRadius: "50%", background: col, border: newChar.color === col ? "3px solid #fff" : "3px solid transparent", cursor: "pointer" }} />)}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={addChar} style={{ flex: 1, padding: "10px", borderRadius: 10, background: T.acg, border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>추가</button>
                <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: "10px", borderRadius: 10, background: T.acd, border: `1px solid ${T.ac}30`, color: T.ac, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>취소</button>
              </div>
            </div>}
            {chars.map(c => <div key={c.id} style={{ background: T.c, border: `1px solid ${selChar.id === c.id ? c.color + "40" : T.b}`, borderLeft: `4px solid ${c.color}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>{c.name}</div>
              <div style={{ fontSize: 11, color: T.ts, lineHeight: 1.6, marginBottom: 6 }}>{c.persona}</div>
              <div style={{ fontSize: 11, color: T.tm, fontStyle: "italic", marginBottom: 10 }}>말투: {c.tone}</div>
              <button onClick={() => { setSelChar(c); setTab("studio"); }} style={{ padding: "7px 16px", borderRadius: 8, background: `${c.color}18`, border: `1px solid ${c.color}30`, color: c.color, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>이 캐릭터로 대본 생성 →</button>
            </div>)}
          </div>}

          {/* ═══ HISTORY ═══ */}
          {tab === "history" && <div style={{ animation: "fadeUp .3s ease" }}>
            {!history.length ? <div style={{ textAlign: "center", padding: 50, color: T.tm }}><div style={{ fontSize: 32, marginBottom: 8 }}>📁</div><div style={{ fontSize: 13, fontWeight: 700 }}>생성 기록이 없어요</div></div>
              : history.map(item => <div key={item.id} style={{ background: T.c, border: `1px solid ${T.b}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><div style={{ fontSize: 13, fontWeight: 700 }}>{item.char}</div><div style={{ fontSize: 10, color: T.tm, fontFamily: T.m }}>{item.time}</div></div>
                <div style={{ fontSize: 12, color: T.ts, marginBottom: 8 }}>{item.topic}</div>
                <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>{item.langs.map(lc => { const lang = LANGS.find(l => l.code === lc); return lang ? <Pill key={lc} color={T.ts}>{lang.label}</Pill> : null; })}</div>
                {item.scripts.ko && <div style={{ display: "flex", gap: 6 }}><CopyBtn text={item.scripts.ko} label="한국어 복사" />{item.scripts.en && <CopyBtn text={item.scripts.en} label="영어 복사" />}</div>}
              </div>)}
          </div>}

          {/* ═══ SETTINGS ═══ */}
          {tab === "settings" && <div style={{ animation: "fadeUp .3s ease" }}>
            <div style={{ background: T.c, border: `1px solid ${T.b}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>🔑 Claude API 설정</div>
              <div style={{ fontSize: 11, color: T.ts, marginBottom: 14, lineHeight: 1.7 }}>console.anthropic.com → API Keys → Create Key<br /><span style={{ color: T.am }}>⚠️ API 키는 안전하게 보관하세요</span></div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.ts, fontFamily: T.m, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>API 키</div>
                <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-ant-api03-..." style={{ width: "100%", background: T.s2, border: `1px solid ${apiSaved ? T.g : T.ba}`, borderRadius: 10, padding: "10px 14px", color: T.t, fontSize: 13, fontFamily: T.m }} />
              </div>
              <button onClick={() => { if (apiKey.startsWith("sk-ant")) setApiSaved(true); else setError("올바른 키를 입력하세요 (sk-ant로 시작)"); }} style={{ width: "100%", padding: "12px", borderRadius: 10, background: apiSaved ? T.gd : T.acg, border: apiSaved ? `1px solid ${T.g}30` : "none", color: apiSaved ? T.g : "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{apiSaved ? "✅ 연결 완료" : "저장 및 연결"}</button>
            </div>
            <div style={{ background: T.c, border: `1px solid ${T.b}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>💰 비용 안내</div>
              {[{ l: "한국어 대본 생성", c: "약 $0.003~0.005/회" }, { l: "언어당 번역 추가", c: "약 $0.001~0.003/언어" }, { l: "5개국어 풀세트", c: "약 $0.01~0.02 (15원)" }, { l: "월 100편 제작", c: "약 $1~2 (1,500원)" }].map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 3 ? `1px solid ${T.b}` : "none" }}>
                  <span style={{ fontSize: 12, color: T.ts }}>{item.l}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.g, fontFamily: T.m }}>{item.c}</span>
                </div>
              ))}
            </div>
            <div style={{ background: T.c, border: `1px solid ${T.b}`, borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>🔄 워크플로우</div>
              {[{ n: "1", t: "대본 생성", d: "주제 입력 → Claude 자동 작성", c: T.ac }, { n: "2", t: "다국어 번역", d: "선택 언어 자동 번역", c: T.cy }, { n: "3", t: "대본 복사", d: "복사 버튼 한 번 클릭", c: T.am }, { n: "4", t: "P-Video 붙여넣기", d: "이미지 + 대본 → 영상 생성", c: T.g }].map(s => (
                <div key={s.n} style={{ display: "flex", gap: 10, marginBottom: 8, padding: "10px", background: T.s2, borderRadius: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: `${s.c}25`, color: s.c, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{s.n}</div>
                  <div><div style={{ fontSize: 12, fontWeight: 700 }}>{s.t}</div><div style={{ fontSize: 10, color: T.ts }}>{s.d}</div></div>
                </div>
              ))}
            </div>
          </div>}
        </div>
      </div>
    </>
  );
}
