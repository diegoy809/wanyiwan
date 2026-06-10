import { useState, useEffect, useRef, useMemo } from "react";

// ———— 熵源 1:本地系统熵(回退用,拒绝采样消除取模偏差) ————
const cryptoInt = (n) => {
  const b = new Uint32Array(1);
  const lim = 0x100000000 - (0x100000000 % n);
  let v;
  do { crypto.getRandomValues(b); v = b[0]; } while (v >= lim);
  return v % n;
};

// ———— 熵源 2:ANU 量子真空涨落(堪培拉实验室实时测量) ————
async function fetchQuantumPool(len = 96) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(
      `https://qrng.anu.edu.au/API/jsonI.php?length=${len}&type=uint16`,
      { signal: ctrl.signal }
    );
    const j = await res.json();
    if (j && j.success && Array.isArray(j.data) && j.data.length) return j.data;
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

// 用量子数池构造抽取函数;池耗尽或不可用时回退本地熵
const makeRand = (qpool) => {
  let i = 0;
  return (n) => {
    if (qpool) {
      const lim = 65536 - (65536 % n); // 拒绝采样:保证 1..n 严格等概率
      while (i < qpool.length) {
        const v = qpool[i++];
        if (v < lim) return v % n;
      }
    }
    return cryptoInt(n);
  };
};

const QUOTES = [
  ["道生一,一生二,二生三,三生万物。", "第四十二章"],
  ["道可道,非常道;名可名,非常名。", "第一章"],
  ["天下万物生于有,有生于无。", "第四十章"],
  ["祸兮福之所倚,福兮祸之所伏。", "第五十八章"],
  ["知其雄,守其雌,为天下溪。", "第二十八章"],
  ["大方无隅,大器晚成,大音希声,大象无形。", "第四十一章"],
];

const N = 90;
const ALL = Array.from({ length: N }, (_, i) => i + 1);

export default function QuantumSuperEnalotto() {
  const [phase, setPhase] = useState("idle"); // idle | measuring | done
  const [drawn, setDrawn] = useState([]);
  const [jolly, setJolly] = useState(null);
  const [superStar, setSuperStar] = useState(null);
  const [flicker, setFlicker] = useState(null);
  const [stage, setStage] = useState("");
  const [quote, setQuote] = useState(QUOTES[0]);
  const [count, setCount] = useState(0);
  const [source, setSource] = useState(null); // 'quantum' | 'local' | null
  const cancelRef = useRef(false);
  const reduced = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  const breathe = useMemo(
    () =>
      ALL.map(() => ({
        dur: (2.2 + Math.random() * 3.5).toFixed(2),
        delay: (Math.random() * 4).toFixed(2),
      })),
    []
  );

  useEffect(() => () => { cancelRef.current = true; }, []);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function collapseOne(pool, flickerFrames, pick) {
    // 闪烁只是退相干动画,用本地熵;真正的坍缩结果来自量子池
    if (!reduced) {
      for (let i = 0; i < flickerFrames; i++) {
        if (cancelRef.current) return null;
        setFlicker(pool[cryptoInt(pool.length)]);
        await sleep(45 + i * 12);
      }
    }
    const picked = pool[pick(pool.length)];
    setFlicker(null);
    return picked;
  }

  async function measure() {
    cancelRef.current = false;
    setPhase("measuring");
    setDrawn([]); setJolly(null); setSuperStar(null);
    setQuote(QUOTES[cryptoInt(QUOTES.length)]);

    // —— 先向堪培拉要一批真空涨落 ——
    setStage("连接 ANU 量子真空涨落源…");
    const qpool = await fetchQuantumPool();
    if (cancelRef.current) return;
    setSource(qpool ? "quantum" : "local");
    const pick = makeRand(qpool);

    let pool = [...ALL];
    const picks = [];
    for (let k = 0; k < 6; k++) {
      setStage(`测量第 ${k + 1} 个本征态 · 剩余维度 ${pool.length}`);
      const p = await collapseOne(pool, 10 + k * 2, pick);
      if (p === null) return;
      picks.push(p);
      pool = pool.filter((x) => x !== p);
      setDrawn([...picks]);
      await sleep(reduced ? 80 : 350);
    }

    setStage("测量 Jolly · 从剩余 84 维子空间坍缩");
    const j = await collapseOne(pool, 14, pick);
    if (j === null) return;
    setJolly(j);
    await sleep(reduced ? 80 : 400);

    setStage("测量 SuperStar · 独立系统,全 90 维");
    const s = await collapseOne([...ALL], 16, pick);
    if (s === null) return;
    setSuperStar(s);

    setStage("");
    setCount((c) => c + 1);
    setPhase("done");
  }

  const isDrawn = (n) => drawn.includes(n);
  const sorted = [...drawn].sort((a, b) => a - b);

  return (
    <div className="min-h-screen text-slate-300" style={{ background: "radial-gradient(120% 90% at 50% 0%, #16213a 0%, #0c1120 55%, #080b16 100%)", fontFamily: "'Noto Serif SC','Songti SC',serif" }}>
      <style>{`
        @keyframes breathe { 0%,100%{opacity:.22} 50%{opacity:.75} }
        @keyframes snap { 0%{transform:scale(1.6);filter:blur(2px)} 100%{transform:scale(1);filter:blur(0)} }
        @keyframes rise { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-q { 0%,100%{opacity:.7} 50%{opacity:1} }
        @media (prefers-reduced-motion: reduce){ *{animation:none!important} }
      `}</style>

      <div className="max-w-md mx-auto px-4 pt-8 pb-12">
        {/* —— 题头 —— */}
        <header className="text-center mb-5">
          <p className="tracking-[0.5em] text-xs text-slate-500 mb-2">SUPERENALOTTO</p>
          <h1 className="text-3xl font-bold" style={{ color: "#d9c8a0" }}>量子坍缩选号</h1>
          <p className="mt-3 text-xs text-slate-500" style={{ fontFamily: "ui-monospace,monospace" }}>
            |ψ⟩ = (1/√{phase === "measuring" ? 90 - drawn.length : 90}) Σ |n⟩ , n ∈ 未坍缩
          </p>
        </header>

        {/* —— 熵源徽章 —— */}
        <div className="flex justify-center mb-5 h-6">
          {source === "quantum" && (
            <span className="px-3 py-1 rounded-full text-[11px]"
              style={{ background: "rgba(62,107,143,.22)", color: "#9fc3df", animation: reduced ? "none" : "pulse-q 2.5s ease-in-out infinite", fontFamily: "ui-monospace,monospace" }}>
              ⚛ 熵源:ANU 量子真空涨落 · 堪培拉
            </span>
          )}
          {source === "local" && (
            <span className="px-3 py-1 rounded-full text-[11px]"
              style={{ background: "rgba(125,147,184,.12)", color: "#8a9bb5", fontFamily: "ui-monospace,monospace" }}>
              熵源:本地系统熵(量子源不可达)
            </span>
          )}
        </div>

        {/* —— 概率云:90个数字 —— */}
        <div className="grid grid-cols-9 gap-1.5 mb-6 select-none">
          {ALL.map((n, i) => {
            const hit = isDrawn(n);
            const isJ = n === jolly;
            const isS = n === superStar;
            const hot = flicker === n;
            let st = {};
            if (hit || isJ || isS) {
              st = {
                background: isS && !hit && !isJ ? "#b8862e" : isJ && !hit ? "#3e6b8f" : "#b03a2e",
                color: "#f5ead6",
                fontWeight: 700,
                animation: reduced ? "none" : "snap .35s ease-out",
                boxShadow: "0 0 12px rgba(176,58,46,.45)",
              };
            } else if (hot) {
              st = { background: "#e8d9b0", color: "#1a1208", fontWeight: 700 };
            } else {
              st = {
                color: "#7d93b8",
                background: "rgba(125,147,184,.06)",
                animation: reduced ? "none" : `breathe ${breathe[i].dur}s ease-in-out ${breathe[i].delay}s infinite`,
              };
            }
            return (
              <div key={n} className="flex items-center justify-center rounded text-[11px] aspect-square transition-colors duration-150" style={st}>
                {n}
              </div>
            );
          })}
        </div>

        {/* —— 测量状态 —— */}
        <div className="h-5 text-center text-xs text-slate-500 mb-4" style={{ fontFamily: "ui-monospace,monospace" }}>
          {stage}
        </div>

        {/* —— 观测按钮 —— */}
        <button
          onClick={measure}
          disabled={phase === "measuring"}
          className="w-full py-3.5 rounded-lg text-lg font-bold tracking-[0.4em] transition-opacity disabled:opacity-40"
          style={{ background: "linear-gradient(180deg,#b03a2e,#8c2d23)", color: "#f5ead6", boxShadow: "0 4px 24px rgba(176,58,46,.35)" }}
        >
          {phase === "measuring" ? "坍缩中…" : "观 测"}
        </button>
        <p className="text-center text-[11px] text-slate-600 mt-2">按下即成为观测者,令真空涨落坍缩为你的号码</p>

        {/* —— 结果 —— */}
        {phase === "done" && (
          <div className="mt-8" style={{ animation: reduced ? "none" : "rise .5s ease-out" }}>
            <p className="text-center text-xs text-slate-500 mb-3">
              第 {count} 次观测 · 本征值
              {source === "quantum" ? " · 来自真实量子测量" : ""}
            </p>
            <div className="flex justify-center gap-2 flex-wrap mb-3">
              {sorted.map((n) => (
                <div key={n} className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold"
                  style={{ background: "#b03a2e", color: "#f5ead6", boxShadow: "0 0 14px rgba(176,58,46,.5)" }}>
                  {n}
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-4 text-sm">
              <span className="px-3 py-1.5 rounded-full" style={{ background: "rgba(62,107,143,.25)", color: "#9fc3df" }}>
                Jolly · <b>{jolly}</b>
              </span>
              <span className="px-3 py-1.5 rounded-full" style={{ background: "rgba(184,134,46,.22)", color: "#e0c285" }}>
                SuperStar · <b>{superStar}</b>
              </span>
            </div>

            <blockquote className="mt-8 text-center">
              <p className="text-base" style={{ color: "#d9c8a0" }}>「{quote[0]}」</p>
              <footer className="mt-1 text-xs text-slate-500">—— 《道德经》{quote[1]}</footer>
            </blockquote>
          </div>
        )}

        {/* —— 诚实声明 —— */}
        <p className="mt-10 text-center text-[11px] leading-relaxed text-slate-600">
          量子力学保证:真随机不可预测——包括对这个 app 自己。<br />
          号码来自量子真空涨落(或本地熵回退),与任何选号方式中奖概率完全相同<br />
          (头奖约 1/622,614,630)。仅供娱乐,理性购彩。
        </p>
      </div>
    </div>
  );
}
