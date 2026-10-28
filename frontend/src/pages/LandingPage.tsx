import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../services/authStore';

// ─── Animated Counter Hook ───────────────────────────────────
function useCounter(target: number, duration = 2000, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return value;
}

// ─── Deep Space Neural Canvas ────────────────────────────────
const NeuralCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    const NODE_COUNT = 55;
    const nodes = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 2.2 + 0.8,
      pulse: Math.random() * Math.PI * 2,
      color: ['#6366f1','#38bdf8','#34d399','#a78bfa','#f472b6'][Math.floor(Math.random() * 5)],
    }));
    const pulses: {fi:number;ti:number;t:number;spd:number;col:string}[] = [];
    let frame = 0;
    const draw = () => {
      frame++;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      // subtle gradient bg
      const grad = ctx.createRadialGradient(W*0.3, H*0.3, 0, W*0.5, H*0.5, Math.max(W,H)*0.8);
      grad.addColorStop(0, 'rgba(30,16,60,0.18)');
      grad.addColorStop(0.5, 'rgba(10,15,35,0.12)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      // connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx*dx + dy*dy);
          if (d < 160) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            const alpha = (1 - d / 160) * 0.14;
            ctx.strokeStyle = `rgba(99,102,241,${alpha})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }
      // spawn pulses
      if (frame % 28 === 0) {
        const fi = Math.floor(Math.random() * nodes.length);
        const ti = (fi + Math.floor(Math.random() * 6) + 1) % nodes.length;
        pulses.push({ fi, ti, t: 0, spd: 0.014 + Math.random() * 0.012, col: nodes[fi].color });
      }
      // draw pulses
      for (let k = pulses.length - 1; k >= 0; k--) {
        const p = pulses[k];
        p.t += p.spd;
        if (p.t >= 1) { pulses.splice(k, 1); continue; }
        const a = nodes[p.fi], b = nodes[p.ti];
        if (!a || !b) continue;
        const px = a.x + (b.x - a.x) * p.t, py = a.y + (b.y - a.y) * p.t;
        ctx.beginPath();
        ctx.arc(px, py, 2.8, 0, Math.PI * 2);
        ctx.fillStyle = p.col;
        ctx.shadowColor = p.col;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      // nodes
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        n.pulse += 0.025;
        const a = 0.25 + Math.sin(n.pulse) * 0.15;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.color.replace(')', `,${a})`).replace('rgb(', 'rgba(').replace('#', 'rgba(').replace('rgba(', 'rgba(');
        // simpler:
        ctx.fillStyle = n.color + Math.round(a * 255).toString(16).padStart(2,'0');
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', opacity:0.85 }} />;
};

// ─── Live Mini Chart ─────────────────────────────────────────
const MiniChart: React.FC<{ color: string; data: number[] }> = ({ color, data }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const H = 44, W = 120;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / (max - min + 0.001)) * (H - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={W} height={H} style={{ display:'block' }}>
      <defs>
        <linearGradient id={`g${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon
        points={`0,${H} ${pts} ${W},${H}`}
        fill={`url(#g${color.replace('#','')})`}
      />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      {(() => {
        const lastVal = data[data.length - 1] ?? 0;
        const cy = H - ((lastVal - min) / (max - min + 0.001)) * (H - 4) - 2;
        return <circle cx={W} cy={cy} r={3} fill={color}/>;
      })()}
    </svg>
  );
};

// ─── Typewriter ──────────────────────────────────────────────
const Typewriter: React.FC<{ phrases: string[]; className?: string }> = ({ phrases, className }) => {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const current = phrases[idx % phrases.length];
    let timeout: ReturnType<typeof setTimeout>;
    if (!deleting && text.length < current.length) {
      timeout = setTimeout(() => setText(current.slice(0, text.length + 1)), 55);
    } else if (!deleting && text.length === current.length) {
      timeout = setTimeout(() => setDeleting(true), 2200);
    } else if (deleting && text.length > 0) {
      timeout = setTimeout(() => setText(text.slice(0, -1)), 28);
    } else if (deleting && text.length === 0) {
      setDeleting(false);
      setIdx(i => i + 1);
    }
    return () => clearTimeout(timeout);
  }, [text, deleting, idx, phrases]);
  return (
    <span className={className}>
      {text}
      <span style={{ borderRight: '2px solid #6366f1', marginLeft: 1, animation: 'blink 1s step-end infinite' }}>&nbsp;</span>
    </span>
  );
};

// ─── Feature Card ────────────────────────────────────────────
const FeatureCard: React.FC<{
  icon: string; title: string; desc: string; color: string; delay: number; visible: boolean;
}> = ({ icon, title, desc, color, delay, visible }) => (
  <div style={{
    background: 'rgba(15,22,40,0.65)',
    backdropFilter: 'blur(18px)',
    border: `1px solid ${color}28`,
    borderRadius: 16,
    padding: '1.75rem',
    display: 'flex', flexDirection: 'column', gap: '0.85rem',
    transition: `all 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(40px)',
    cursor: 'default',
    position: 'relative', overflow: 'hidden',
  }}
  onMouseEnter={e => {
    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px) scale(1.01)';
    (e.currentTarget as HTMLDivElement).style.borderColor = color + '60';
    (e.currentTarget as HTMLDivElement).style.boxShadow = `0 20px 50px ${color}18`;
  }}
  onMouseLeave={e => {
    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0) scale(1)';
    (e.currentTarget as HTMLDivElement).style.borderColor = color + '28';
    (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
  }}>
    <div style={{ width:48, height:48, borderRadius:12, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', border:`1px solid ${color}30` }}>
      <span className="material-symbols-outlined" style={{ color, fontSize:26 }}>{icon}</span>
    </div>
    <div style={{ fontWeight:700, fontSize:'1.05rem', color:'#f1f5f9', letterSpacing:'-0.01em' }}>{title}</div>
    <div style={{ color:'#94a3b8', fontSize:'0.875rem', lineHeight:1.6 }}>{desc}</div>
    <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${color}60,transparent)`, opacity:0.6 }}/>
  </div>
);

// ─── Stat Card ────────────────────────────────────────────────
const StatCard: React.FC<{ value: number; suffix: string; label: string; color: string; started: boolean; chartData: number[] }> = ({ value, suffix, label, color, started, chartData }) => {
  const count = useCounter(value, 2000, started);
  return (
    <div style={{ background:'rgba(15,22,40,0.65)', backdropFilter:'blur(18px)', border:`1px solid ${color}22`, borderRadius:14, padding:'1.25rem 1.5rem', display:'flex', flexDirection:'column', gap:'0.25rem' }}>
      <div style={{ fontSize:'2rem', fontWeight:800, color, fontFamily:'JetBrains Mono, monospace', letterSpacing:'-0.03em' }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div style={{ fontSize:'0.8rem', color:'#64748b', fontFamily:'JetBrains Mono', letterSpacing:'0.04em', textTransform:'uppercase' }}>{label}</div>
      <MiniChart color={color} data={chartData}/>
    </div>
  );
};

// ─── Main Landing Page ────────────────────────────────────────
const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [heroVisible, setHeroVisible] = useState(false);
  const [statsVisible, setStatsVisible] = useState(true);
  const [featuresVisible, setFeaturesVisible] = useState(true);
  const [workflowVisible, setWorkflowVisible] = useState(true);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80);
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const FEATURES = [
    { icon:'psychology', title:'Multi-Agent Orchestration', desc:'Deploy autonomous AI agent fleets that collaborate to analyze, clean, and engineer features from raw data — without human intervention.', color:'#6366f1' },
    { icon:'query_stats', title:'Automated EDA Engine', desc:'Intelligent exploratory data analysis with statistical summaries, correlation matrices, outlier detection, and distribution insights generated in seconds.', color:'#38bdf8' },
    { icon:'precision_manufacturing', title:'AutoML Pipeline Builder', desc:'End-to-end model selection, hyperparameter optimization via Optuna, cross-validation, and ensemble methods — all automated with explainability built-in.', color:'#34d399' },
    { icon:'hub', title:'LangGraph Agent Fabric', desc:'Powered by LangGraph + Gemini AI, agents reason, plan, and execute complex data science workflows with real-time transparency into every decision.', color:'#a78bfa' },
    { icon:'monitoring', title:'Live Model Monitoring', desc:'Continuous drift detection, performance degradation alerts, and automated retraining triggers keep your deployed models accurate at all times.', color:'#f472b6' },
    { icon:'lock', title:'Air-Gapped Security', desc:'Your data never leaves your infrastructure. SOC2 Type II compliant with FIPS 140-3 encryption, zero model retraining on proprietary datasets guaranteed.', color:'#fb923c' },
  ];

  const WORKFLOW_STEPS = [
    { icon:'upload_file', label:'Upload Dataset', desc:'CSV, Excel, Parquet, JSON', color:'#6366f1' },
    { icon:'manage_search', label:'Auto EDA', desc:'Statistical profiling & insights', color:'#38bdf8' },
    { icon:'build', label:'Preprocessing', desc:'Clean, transform, engineer', color:'#34d399' },
    { icon:'model_training', label:'AutoML Train', desc:'50+ algorithms, Optuna tuning', color:'#a78bfa' },
    { icon:'fact_check', label:'Evaluate', desc:'SHAP, cross-val, robustness', color:'#f472b6' },
    { icon:'rocket_launch', label:'Deploy', desc:'REST API in one click', color:'#fb923c' },
  ];

  const chartData1 = [12,18,15,24,20,30,27,38,34,44,40,55,52,67,72,80,76,88,94];
  const chartData2 = [80,75,68,72,60,55,50,44,38,30,25,18,12,8,5,3,2,1,1];
  const chartData3 = [5,8,12,10,18,22,20,28,34,30,42,48,45,55,62,70,75,82,88];
  const chartData4 = [1,3,5,4,8,12,15,20,18,25,30,28,35,42,50,55,60,68,75];

  return (
    <div style={{ minHeight:'100vh', background:'#050914', fontFamily:"'Inter', 'Segoe UI', sans-serif", overflowX:'hidden', position:'relative' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes pulse-glow { 0%,100%{box-shadow:0 0 20px rgba(99,102,241,0.3)} 50%{box-shadow:0 0 40px rgba(99,102,241,0.6)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes spin-slow { to{transform:rotate(360deg)} }
        @keyframes gradient-shift {
          0%{background-position:0% 50%}
          50%{background-position:100% 50%}
          100%{background-position:0% 50%}
        }
        @keyframes slide-up { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        .dw-btn-primary {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          padding: 0.9rem 2.2rem;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.25s cubic-bezier(0.16,1,0.3,1);
          letter-spacing: -0.01em;
          animation: pulse-glow 3s ease-in-out infinite;
          position: relative;
          overflow: hidden;
        }
        .dw-btn-primary::before {
          content:'';
          position:absolute;inset:0;
          background:linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
          opacity:0;transition:opacity 0.2s;
        }
        .dw-btn-primary:hover { transform:translateY(-3px) scale(1.02); box-shadow:0 20px 40px rgba(99,102,241,0.4); }
        .dw-btn-primary:hover::before { opacity:1; }
        .dw-btn-ghost {
          background: rgba(255,255,255,0.06);
          color: #e2e8f0;
          border: 1px solid rgba(255,255,255,0.12);
          padding: 0.9rem 2.2rem;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.25s cubic-bezier(0.16,1,0.3,1);
          backdrop-filter: blur(10px);
        }
        .dw-btn-ghost:hover { background:rgba(255,255,255,0.1); border-color:rgba(255,255,255,0.25); transform:translateY(-3px); }
        .nav-link { color:#94a3b8; text-decoration:none; font-size:0.9rem; font-weight:500; transition:color 0.2s; cursor:pointer; }
        .nav-link:hover { color:#f1f5f9; }
        .workflow-step { transition: all 0.5s cubic-bezier(0.16,1,0.3,1); }
        .workflow-step:hover { transform:scale(1.06) translateY(-4px); }
        .tech-pill {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 999px;
          padding: 0.4rem 1rem;
          font-size: 0.78rem;
          color: #94a3b8;
          font-family: 'JetBrains Mono', monospace;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
        }
        .tech-pill:hover { background:rgba(99,102,241,0.15); border-color:rgba(99,102,241,0.4); color:#c4b5fd; }
      `}</style>

      <NeuralCanvas />

      {/* ─── NAVBAR ────────────────────────────────────────── */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        background: scrollY > 40 ? 'rgba(5,9,20,0.9)' : 'transparent',
        backdropFilter: scrollY > 40 ? 'blur(20px)' : 'none',
        borderBottom: scrollY > 40 ? '1px solid rgba(255,255,255,0.06)' : 'none',
        transition:'all 0.3s',
        padding:'0 2rem', height:64, display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,rgba(99,102,241,0.4),rgba(139,92,246,0.3))', border:'1px solid rgba(99,102,241,0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span className="material-symbols-outlined" style={{ color:'#818cf8', fontSize:20 }}>hub</span>
          </div>
          <span style={{ fontWeight:800, fontSize:'1.1rem', letterSpacing:'-0.02em', color:'#f8fafc' }}>
            DataWise <span style={{ color:'#6366f1', fontFamily:'JetBrains Mono', fontSize:'0.85rem', fontWeight:500 }}>AI</span>
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'2rem' }}>
          <span className="nav-link" onClick={() => document.getElementById('features')?.scrollIntoView({behavior:'smooth'})}>Features</span>
          <span className="nav-link" onClick={() => document.getElementById('workflow')?.scrollIntoView({behavior:'smooth'})}>How It Works</span>
          <span className="nav-link" onClick={() => document.getElementById('stats')?.scrollIntoView({behavior:'smooth'})}>Platform</span>
          <span className="nav-link" onClick={() => navigate('/docs')} style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>menu_book</span>
            Docs & Learning
          </span>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            {isAuthenticated ? (
              <>
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.35rem 0.75rem', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', fontSize:'0.82rem', color:'#cbd5e1' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:16, color:'#34d399' }}>account_circle</span>
                  <span>{user?.name || user?.email || 'User'}</span>
                </div>
                <button className="dw-btn-primary" style={{ padding:'0.5rem 1.25rem', fontSize:'0.875rem', animation:'none' }} onClick={() => navigate('/projects')}>
                  <span className="material-symbols-outlined" style={{ fontSize:16 }}>dashboard</span>
                  Open Projects →
                </button>
                <button className="dw-btn-ghost" style={{ padding:'0.5rem 0.9rem', fontSize:'0.875rem' }} onClick={() => logout()}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button className="dw-btn-ghost" style={{ padding:'0.5rem 1.25rem', fontSize:'0.875rem' }} onClick={() => navigate('/login')}>
                  <span className="material-symbols-outlined" style={{ fontSize:16 }}>login</span>
                  Sign In
                </button>
                <button className="dw-btn-primary" style={{ padding:'0.5rem 1.25rem', fontSize:'0.875rem', animation:'none' }} onClick={() => navigate('/register')}>
                  <span className="material-symbols-outlined" style={{ fontSize:16 }}>person_add</span>
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── HERO ──────────────────────────────────────────── */}
      <section style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', position:'relative', zIndex:1, padding:'8rem 2rem 4rem', textAlign:'center' }}>

        {/* floating badge */}
        <div style={{
          display:'inline-flex', alignItems:'center', gap:'0.5rem',
          padding:'0.4rem 1.25rem', borderRadius:999,
          background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.3)',
          color:'#a5b4fc', fontSize:'0.78rem', fontFamily:'JetBrains Mono', letterSpacing:'0.06em',
          marginBottom:'2rem',
          opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
          transition:'all 0.8s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#34d399', boxShadow:'0 0 8px #34d399', animation:'pulse-glow 2s ease-in-out infinite' }}/>
          Autonomous Data Science Platform — Powered by Gemini AI
        </div>

        {/* headline */}
        <h1 style={{
          fontSize:'clamp(2.5rem, 6vw, 5.5rem)',
          fontWeight:900,
          lineHeight:1.05,
          letterSpacing:'-0.04em',
          color:'#f8fafc',
          maxWidth:900,
          margin:'0 auto 1.25rem',
          opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(30px)',
          transition:'all 0.9s cubic-bezier(0.16,1,0.3,1) 100ms',
        }}>
          Your Data Science Pipeline,{' '}
          <span style={{
            background:'linear-gradient(135deg, #6366f1 0%, #a78bfa 40%, #38bdf8 70%, #34d399 100%)',
            backgroundSize:'300% 300%',
            animation:'gradient-shift 4s ease infinite',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
          }}>Fully Autonomous</span>
        </h1>

        {/* typewriter subheadline */}
        <div style={{
          fontSize:'clamp(1.1rem, 2.5vw, 1.5rem)',
          color:'#64748b',
          marginBottom:'3rem', maxWidth:660,
          opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
          transition:'all 0.9s cubic-bezier(0.16,1,0.3,1) 200ms',
          height: '2.5rem', display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <Typewriter phrases={[
            'From raw CSV to production model in minutes.',
            'Multi-agent EDA & preprocessing engine.',
            'AutoML with LangGraph orchestration.',
            'Zero-code. Full transparency. Enterprise-grade.',
          ]} />
        </div>

        {/* CTA Buttons */}
        <div style={{
          display:'flex', gap:'1rem', flexWrap:'wrap', justifyContent:'center',
          opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
          transition:'all 0.9s cubic-bezier(0.16,1,0.3,1) 350ms',
        }}>
          {isAuthenticated ? (
            <>
              <button className="dw-btn-primary" onClick={() => navigate('/projects')} style={{ fontSize:'1.05rem', padding:'1rem 2.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize:20 }}>arrow_forward</span>
                Enter Projects Studio →
              </button>
              <button className="dw-btn-ghost" onClick={() => navigate('/projects/new')} style={{ fontSize:'1.05rem', padding:'1rem 2.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize:20 }}>add_circle</span>
                New Project
              </button>
            </>
          ) : (
            <>
              <button className="dw-btn-primary" onClick={() => navigate('/register')} style={{ fontSize:'1.05rem', padding:'1rem 2.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize:20 }}>rocket_launch</span>
                Start Free — No Credit Card
              </button>
              <button className="dw-btn-ghost" onClick={() => navigate('/login')} style={{ fontSize:'1.05rem', padding:'1rem 2.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize:20 }}>login</span>
                Sign In to Dashboard
              </button>
            </>
          )}
        </div>

        {/* tech stack pills */}
        <div style={{
          display:'flex', flexWrap:'wrap', gap:'0.5rem', justifyContent:'center', marginTop:'2.5rem', maxWidth:700,
          opacity: heroVisible ? 1 : 0, transition:'all 1s cubic-bezier(0.16,1,0.3,1) 500ms',
        }}>
          {['⚡ LangGraph','🔮 Gemini AI','🧠 PyTorch','📊 Plotly','🔬 Scikit-Learn','⚗️ Optuna','🛡️ SQLite + Redis','🔐 Clerk Auth'].map(t => (
            <span key={t} className="tech-pill">{t}</span>
          ))}
        </div>

        {/* Hero Visual — animated dashboard mockup */}
        <div style={{
          marginTop:'4rem', width:'100%', maxWidth:960, position:'relative',
          opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(50px)',
          transition:'all 1.2s cubic-bezier(0.16,1,0.3,1) 400ms',
        }}>
          <div style={{
            background:'rgba(10,15,30,0.85)', backdropFilter:'blur(20px)',
            border:'1px solid rgba(255,255,255,0.08)', borderRadius:20,
            padding:'1.5rem', boxShadow:'0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
            overflow:'hidden',
          }}>
            {/* window chrome */}
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1.25rem', paddingBottom:'1rem', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display:'flex', gap:'6px' }}>
                {['#f87171','#fbbf24','#34d399'].map((c,i) => <div key={i} style={{ width:10,height:10,borderRadius:'50%', background:c }}/>)}
              </div>
              <div style={{ flex:1, display:'flex', justifyContent:'center' }}>
                <div style={{ background:'rgba(255,255,255,0.05)', borderRadius:6, padding:'0.2rem 1rem', fontSize:'0.72rem', color:'#64748b', fontFamily:'JetBrains Mono' }}>
                  datawise.ai/projects/customer-churn-model
                </div>
              </div>
            </div>
            {/* mock dashboard grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'0.75rem', marginBottom:'0.75rem' }}>
              {[
                { label:'Model Accuracy', val:'94.7%', delta:'+2.3%', color:'#34d399' },
                { label:'Features Engineered', val:'128', delta:'+14 new', color:'#38bdf8' },
                { label:'Training Time', val:'4.2 min', delta:'-68%', color:'#a78bfa' },
                { label:'Data Quality', val:'99.1%', delta:'Excellent', color:'#f472b6' },
              ].map(m => (
                <div key={m.label} style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'0.85rem', border:'1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize:'0.68rem', color:'#64748b', fontFamily:'JetBrains Mono', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>{m.label}</div>
                  <div style={{ fontSize:'1.4rem', fontWeight:800, color:m.color, fontFamily:'JetBrains Mono' }}>{m.val}</div>
                  <div style={{ fontSize:'0.7rem', color:'#34d399', marginTop:2, fontFamily:'JetBrains Mono' }}>{m.delta}</div>
                </div>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'0.75rem' }}>
              <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'1rem', border:'1px solid rgba(255,255,255,0.06)', minHeight:110 }}>
                <div style={{ fontSize:'0.7rem', color:'#64748b', fontFamily:'JetBrains Mono', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.75rem' }}>Agent Activity Log</div>
                {['EDA Agent: Detected 3 outlier clusters in column "revenue"','Preprocessing Agent: Applied StandardScaler to 12 numeric features','Feature Agent: Created 8 interaction features via mutual information','AutoML Agent: XGBoost selected — AUC 0.947 on hold-out set'].map((msg, i) => (
                  <div key={i} style={{ display:'flex', gap:'0.5rem', marginBottom:'0.4rem', fontSize:'0.72rem', color:['#38bdf8','#34d399','#a78bfa','#f472b6'][i], fontFamily:'JetBrains Mono' }}>
                    <span>▸</span><span style={{ color:'#94a3b8' }}>{msg}</span>
                  </div>
                ))}
              </div>
              <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'1rem', border:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize:'0.7rem', color:'#64748b', fontFamily:'JetBrains Mono', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.75rem' }}>Pipeline Status</div>
                {[
                  { step:'Data Ingestion', done:true },
                  { step:'EDA & Profiling', done:true },
                  { step:'Preprocessing', done:true },
                  { step:'Feature Engineering', done:true },
                  { step:'Model Training', done:true },
                  { step:'Deployment', done:false },
                ].map((s, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.4rem' }}>
                    <span style={{ fontSize:12, color: s.done ? '#34d399' : '#475569' }} className="material-symbols-outlined">{s.done ? 'check_circle' : 'radio_button_unchecked'}</span>
                    <span style={{ fontSize:'0.72rem', color: s.done ? '#94a3b8' : '#475569', fontFamily:'JetBrains Mono' }}>{s.step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* glow below */}
          <div style={{ position:'absolute', bottom:-60, left:'50%', transform:'translateX(-50%)', width:'70%', height:100, background:'radial-gradient(ellipse, rgba(99,102,241,0.25) 0%, transparent 70%)', filter:'blur(20px)', pointerEvents:'none' }}/>
        </div>

        {/* scroll indicator */}
        <div style={{ position:'absolute', bottom:'2rem', left:'50%', transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:'0.4rem', opacity:0.5, animation:'float 2s ease-in-out infinite' }}>
          <span style={{ fontSize:'0.7rem', color:'#64748b', letterSpacing:'0.1em', fontFamily:'JetBrains Mono' }}>SCROLL</span>
          <span className="material-symbols-outlined" style={{ color:'#64748b', fontSize:18 }}>keyboard_arrow_down</span>
        </div>
      </section>

      {/* ─── STATS ─────────────────────────────────────────── */}
      <section id="stats" style={{ padding:'5rem 2rem', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:'3rem' }}>
            <div style={{ fontFamily:'JetBrains Mono', fontSize:'0.75rem', color:'#6366f1', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'0.75rem' }}>Platform Metrics</div>
            <h2 style={{ fontSize:'clamp(1.75rem,3vw,2.75rem)', fontWeight:800, color:'#f1f5f9', letterSpacing:'-0.03em' }}>
              Built for <span style={{ color:'#6366f1' }}>scale.</span> Trusted for <span style={{ color:'#34d399' }}>reliability.</span>
            </h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:'1rem' }}>
            <StatCard value={150000} suffix="+" label="Datasets Processed" color="#6366f1" started={statsVisible} chartData={chartData1}/>
            <StatCard value={99} suffix=".9%" label="Pipeline Uptime" color="#34d399" started={statsVisible} chartData={chartData2.map(v=>100-v)}/>
            <StatCard value={94} suffix="%" label="Avg. Model Accuracy" color="#38bdf8" started={statsVisible} chartData={chartData3}/>
            <StatCard value={3200} suffix="+" label="Agent Runs / Day" color="#a78bfa" started={statsVisible} chartData={chartData4}/>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ──────────────────────────────────────── */}
      <section id="features" style={{ padding:'5rem 2rem', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:'3.5rem' }}>
            <div style={{ fontFamily:'JetBrains Mono', fontSize:'0.75rem', color:'#38bdf8', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'0.75rem' }}>Core Capabilities</div>
            <h2 style={{ fontSize:'clamp(1.75rem,3vw,2.75rem)', fontWeight:800, color:'#f1f5f9', letterSpacing:'-0.03em', marginBottom:'1rem' }}>
              Everything you need to go from data to deployment.
            </h2>
            <p style={{ color:'#64748b', fontSize:'1.05rem', maxWidth:580, margin:'0 auto', lineHeight:1.6 }}>
              DataWise AI brings together agentic AI, automated ML, and production-grade infrastructure into one cohesive platform.
            </p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:'1.25rem' }}>
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} {...f} delay={i * 80} visible={featuresVisible}/>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WORKFLOW ──────────────────────────────────────── */}
      <section id="workflow" style={{ padding:'5rem 2rem', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:'3.5rem' }}>
            <div style={{ fontFamily:'JetBrains Mono', fontSize:'0.75rem', color:'#a78bfa', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'0.75rem' }}>How It Works</div>
            <h2 style={{ fontSize:'clamp(1.75rem,3vw,2.75rem)', fontWeight:800, color:'#f1f5f9', letterSpacing:'-0.03em' }}>
              Six steps. Fully automated.
            </h2>
          </div>
          <div style={{ display:'flex', alignItems:'flex-start', gap:'0', flexWrap:'nowrap', overflowX:'auto', paddingBottom:'1rem' }}>
            {WORKFLOW_STEPS.map((s, i) => (
              <React.Fragment key={s.label}>
                <div className="workflow-step" style={{
                  flex:'0 0 auto', width:155, display:'flex', flexDirection:'column', alignItems:'center', gap:'0.75rem', textAlign:'center',
                  opacity: workflowVisible ? 1 : 0, transform: workflowVisible ? 'translateY(0)' : 'translateY(30px)',
                  transition:`all 0.6s cubic-bezier(0.16,1,0.3,1) ${i*100}ms`,
                }}>
                  <div style={{ width:70, height:70, borderRadius:'50%', background:`${s.color}15`, border:`2px solid ${s.color}40`, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                    <span className="material-symbols-outlined" style={{ color:s.color, fontSize:30 }}>{s.icon}</span>
                    <div style={{ position:'absolute', top:-2, right:-2, width:20, height:20, borderRadius:'50%', background:'#050914', border:`2px solid ${s.color}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.65rem', color:s.color, fontFamily:'JetBrains Mono', fontWeight:700 }}>{i+1}</div>
                  </div>
                  <div style={{ fontWeight:700, fontSize:'0.9rem', color:'#f1f5f9' }}>{s.label}</div>
                  <div style={{ fontSize:'0.75rem', color:'#64748b', lineHeight:1.4 }}>{s.desc}</div>
                </div>
                {i < WORKFLOW_STEPS.length - 1 && (
                  <div style={{ flex:'1', height:2, background:`linear-gradient(90deg,${s.color}40,${WORKFLOW_STEPS[i+1].color}40)`, marginTop:35, minWidth:20, opacity: workflowVisible ? 1 : 0, transition:`opacity 0.5s ${i*100+200}ms` }}/>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA SECTION ───────────────────────────────────── */}
      <section style={{ padding:'6rem 2rem', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:800, margin:'0 auto', textAlign:'center' }}>
          <div style={{
            background:'rgba(99,102,241,0.08)', backdropFilter:'blur(20px)',
            border:'1px solid rgba(99,102,241,0.2)', borderRadius:24, padding:'4rem 3rem',
            position:'relative', overflow:'hidden',
          }}>
            {/* background glow */}
            <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:400, height:200, background:'radial-gradient(ellipse, rgba(99,102,241,0.2) 0%, transparent 70%)', pointerEvents:'none', filter:'blur(40px)' }}/>
            <div style={{ fontFamily:'JetBrains Mono', fontSize:'0.75rem', color:'#a78bfa', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'1.25rem' }}>
              Ready to accelerate your data science?
            </div>
            <h2 style={{ fontSize:'clamp(2rem,4vw,3rem)', fontWeight:900, color:'#f8fafc', letterSpacing:'-0.04em', marginBottom:'1rem', lineHeight:1.1 }}>
              Start building with autonomous AI agents — today.
            </h2>
            <p style={{ color:'#94a3b8', fontSize:'1rem', marginBottom:'2.5rem', lineHeight:1.6, maxWidth:520, margin:'0 auto 2.5rem' }}>
              Join thousands of data scientists using DataWise AI to slash model development time from weeks to minutes. Free to get started.
            </p>
            <div style={{ display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap' }}>
              {isAuthenticated ? (
                <>
                  <button className="dw-btn-primary" onClick={() => navigate('/projects')} style={{ fontSize:'1.1rem', padding:'1.1rem 2.75rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize:22 }}>arrow_forward</span>
                    Launch Projects Workspace →
                  </button>
                  <button className="dw-btn-ghost" onClick={() => navigate('/projects/new')} style={{ fontSize:'1.1rem', padding:'1.1rem 2.75rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize:22 }}>add_circle</span>
                    + Create Project
                  </button>
                </>
              ) : (
                <>
                  <button className="dw-btn-primary" onClick={() => navigate('/register')} style={{ fontSize:'1.1rem', padding:'1.1rem 2.75rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize:22 }}>person_add</span>
                    Create Free Account
                  </button>
                  <button className="dw-btn-ghost" onClick={() => navigate('/login')} style={{ fontSize:'1.1rem', padding:'1.1rem 2.75rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize:22 }}>login</span>
                    Sign In
                  </button>
                </>
              )}
            </div>
            <div style={{ marginTop:'1.5rem', display:'flex', gap:'1.5rem', justifyContent:'center', flexWrap:'wrap' }}>
              {['✓ No credit card required','✓ SOC2 Compliant','✓ Your data stays private'].map(t => (
                <span key={t} style={{ fontSize:'0.8rem', color:'#64748b', fontFamily:'JetBrains Mono' }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ────────────────────────────────────────── */}
      <footer style={{ borderTop:'1px solid rgba(255,255,255,0.06)', padding:'2.5rem 2rem', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <div style={{ width:30, height:30, borderRadius:8, background:'rgba(99,102,241,0.2)', border:'1px solid rgba(99,102,241,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span className="material-symbols-outlined" style={{ color:'#818cf8', fontSize:16 }}>hub</span>
            </div>
            <span style={{ fontWeight:700, fontSize:'0.95rem', color:'#f8fafc' }}>DataWise AI</span>
          </div>
          <div style={{ display:'flex', gap:'1.5rem', flexWrap:'wrap' }}>
            {['Privacy','Security','API Docs & Libraries','Status'].map(l => (
              <span key={l} style={{ fontSize:'0.8rem', color: l === 'API Docs & Libraries' ? '#818cf8' : '#64748b', cursor:'pointer', transition:'color 0.2s' }}
                onClick={() => { if (l === 'API Docs & Libraries') navigate('/docs') }}
                onMouseEnter={e => (e.currentTarget.style.color='#94a3b8')}
                onMouseLeave={e => (e.currentTarget.style.color=l === 'API Docs & Libraries' ? '#818cf8' : '#64748b')}>{l}</span>
            ))}
          </div>
          <div style={{ fontSize:'0.75rem', color:'#475569', fontFamily:'JetBrains Mono' }}>
            © 2026 DataWise AI • Air-Gapped • Zero-Egress
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
