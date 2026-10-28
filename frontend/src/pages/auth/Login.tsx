import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../services/authStore';
import { SignIn, SignUp, SignInButton, useUser } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import './Login.css';

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface LoginProps {
  initialMode?: 'signin' | 'register';
}

interface AgentNode {
  id: string;
  name: string;
  role: string;
  metricLabel: string;
  metricValue: string;
  status: 'active' | 'synced' | 'isolated';
  accentColor: string;
  details: { latency: string; throughput: string; hardware: string };
}

const AGENT_NODES: AgentNode[] = [
  {
    id: 'node-01',
    name: 'Telemetry Router',
    role: 'Autonomous Ingestion & Event Broker',
    metricLabel: 'Event Throughput',
    metricValue: '94.2k evt/sec',
    status: 'active',
    accentColor: '#34d399', // emerald
    details: { latency: '1.2 ms', throughput: '128 MB/s', hardware: 'Bare-Metal US-East' },
  },
  {
    id: 'node-02',
    name: 'Vector Sandbox',
    role: 'HNSW Index & High-Dim Embeddings',
    metricLabel: 'Indexed Vectors',
    metricValue: '1.4B Embeddings',
    status: 'synced',
    accentColor: '#38bdf8', // sky/cyan
    details: { latency: '4.8 ms', throughput: '4,850 QPS', hardware: 'CUDA 12.4 Enclave' },
  },
  {
    id: 'node-03',
    name: 'Air-Gapped Vault',
    role: 'Model Governance & Key Rotation',
    metricLabel: 'Isolation Boundary',
    metricValue: 'Enclave Verified',
    status: 'isolated',
    accentColor: '#a78bfa', // purple/indigo
    details: { latency: '0.4 ms', throughput: 'FIPS 140-3', hardware: 'Confidential Compute' },
  },
];

// ─────────────────────────────────────────────────────────────
// Organic Interactive Neural Fabric Canvas
// ─────────────────────────────────────────────────────────────
const NeuralOrchestratorCanvas: React.FC<{ activeNodeIndex: number }> = ({ activeNodeIndex }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.clientWidth || 800);
    let height = (canvas.height = canvas.clientHeight || 700);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.clientWidth || 800;
      height = canvas.height = canvas.clientHeight || 700;
    };
    window.addEventListener('resize', handleResize);

    // Particle nodes for organic neural mesh
    const particleCount = 42;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: Math.random() * 2 + 1,
      baseAlpha: Math.random() * 0.35 + 0.15,
      pulse: Math.random() * Math.PI,
    }));

    // Data pulse packets traveling along synaptic lines
    interface Packet {
      fromIndex: number;
      toIndex: number;
      progress: number;
      speed: number;
      color: string;
    }
    const packets: Packet[] = [];

    const colors = ['#38bdf8', '#34d399', '#a78bfa'];

    let frame = 0;
    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // Spawn packets periodically
      if (frame % 35 === 0 && particles.length > 5) {
        const from = Math.floor(Math.random() * particles.length);
        const to = (from + Math.floor(Math.random() * 5) + 1) % particles.length;
        packets.push({
          fromIndex: from,
          toIndex: to,
          progress: 0,
          speed: 0.012 + Math.random() * 0.01,
          color: colors[activeNodeIndex % colors.length],
        });
      }

      // Update and draw synaptic connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            const alpha = (1 - dist / 130) * 0.18;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Draw and update packets
      for (let k = packets.length - 1; k >= 0; k--) {
        const p = packets[k];
        p.progress += p.speed;
        if (p.progress >= 1) {
          packets.splice(k, 1);
          continue;
        }
        const p1 = particles[p.fromIndex];
        const p2 = particles[p.toIndex];
        if (p1 && p2) {
          const px = p1.x + (p2.x - p1.x) * p.progress;
          const py = p1.y + (p2.y - p1.y) * p.progress;
          ctx.beginPath();
          ctx.arc(px, py, 2.4, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // Draw particles
      particles.forEach((pt) => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        if (pt.x < 0 || pt.x > width) pt.vx *= -1;
        if (pt.y < 0 || pt.y > height) pt.vy *= -1;

        pt.pulse += 0.02;
        const currentAlpha = pt.baseAlpha + Math.sin(pt.pulse) * 0.1;

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167, 139, 250, ${Math.max(0.08, currentAlpha)})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeNodeIndex]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity: 0.75,
      }}
    />
  );
};

// ─────────────────────────────────────────────────────────────
// Main Login / Provisioning Page
// ─────────────────────────────────────────────────────────────
export const Login: React.FC<LoginProps> = ({ initialMode = 'signin' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, isAuthenticated } = useAuthStore();

  const [mode, setMode] = useState<'signin' | 'register'>(initialMode);
  const [authMethod, setAuthMethod] = useState<'clerk' | 'credentials'>('clerk');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [framework, setFramework] = useState('pytorch');
  const [dataAgreement, setDataAgreement] = useState(true);

  // Active node selection for live telemetry inspection
  const [activeNode, setActiveNode] = useState<number>(0);

  // States for submission & feedback — must be declared before any effect that uses them
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Clerk hooks (read-only — App.tsx ClerkSyncManager handles the actual sync)
  const { isLoaded: clerkLoaded, isSignedIn: clerkSignedIn } = useUser();

  // Redirect to projects once Clerk confirms the user is signed in
  // (ClerkSyncManager in App.tsx will have already synced the backend session)
  useEffect(() => {
    if (clerkLoaded && clerkSignedIn && isAuthenticated) {
      navigate('/projects', { replace: true });
    }
  }, [clerkLoaded, clerkSignedIn, isAuthenticated, navigate]);

  // OAuth Help Modal state
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [oauthModalProvider, setOauthModalProvider] = useState<'google' | 'github'>('google');

  // Parse URL query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const err = params.get('error');
    if (err === 'gmail_only') {
      setErrorMessage('Security Gate: Only authorized enterprise @gmail.com accounts are permitted.');
    } else if (err === 'google_deleted_client') {
      setErrorMessage('Google OAuth Notice: The Google Cloud OAuth client was deleted or expired. Click "OAuth Configuration" below for guided setup.');
      setShowOAuthModal(true);
      setOauthModalProvider('google');
    } else if (err === 'google_cancelled' || err === 'github_cancelled') {
      setErrorMessage('OAuth session was cancelled.');
    } else if (err === 'oauth_not_configured') {
      setErrorMessage('OAuth credentials are not configured in your root .env file.');
      setShowOAuthModal(true);
    } else if (err) {
      setErrorMessage(`Authentication event: ${err}`);
    }

    const tab = params.get('tab');
    if (tab === 'register') setMode('register');
    if (tab === 'signin') setMode('signin');
  }, [location.search]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/projects', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Dynamic password entropy evaluation
  const evaluatePassword = (val: string) => {
    if (!val) return { score: 0, label: 'Awaiting key', color: '#64748b', percent: '0%' };
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    switch (score) {
      case 1:
        return { score: 1, label: 'Vulnerable Key', color: '#f87171', percent: '25%' };
      case 2:
        return { score: 2, label: 'Standard Entropy', color: '#fbbf24', percent: '50%' };
      case 3:
        return { score: 3, label: 'High Resilience', color: '#38bdf8', percent: '75%' };
      case 4:
        return { score: 4, label: 'Enclave Hardened', color: '#34d399', percent: '100%' };
      default:
        return { score: 0, label: 'Awaiting key', color: '#64748b', percent: '0%' };
    }
  };

  const strength = evaluatePassword(password);

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    if (mode === 'register' && !dataAgreement) {
      setErrorMessage('Please confirm the zero-retraining data confidentiality agreement.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        setSubmissionStep('Verifying Argon2id cryptographic credentials...');
        await signIn(cleanEmail, password);
        setSubmissionStep('Cluster node access granted. Launching...');
        setTimeout(() => navigate('/projects'), 500);
      } else {
        setSubmissionStep('Synthesizing workspace enclave & cluster nodes...');
        await signUp(cleanEmail, password, fullName || cleanEmail.split('@')[0], framework);
        setSubmissionStep('Workspace provisioned. Initializing...');
        setTimeout(() => navigate('/projects'), 600);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setSubmissionStep('');
      setErrorMessage(err.message || 'Authentication error. Please verify credentials.');
    }
  };

  // Safe Google SSO trigger
  const handleGoogleSSO = () => {
    window.location.href = `${API_BASE}/api/auth/google`;
  };

  // Safe GitHub SSO trigger
  const handleGitHubSSO = () => {
    window.location.href = `${API_BASE}/api/auth/github`;
  };

  // 1-Click Demo Evaluation Autofill
  const loadDemoCredentials = () => {
    setEmail('demo.scientist@gmail.com');
    setPassword('DataWise_2025!');
    setFullName('Dr. Elena Vance');
    setMode('signin');
    setErrorMessage('');
  };

  return (
    <div className="dw-login-root">
      {/* ─────────────────────────────────────────────────────────────
          LEFT PANEL: Autonomous Multi-Agent Orchestrator (55% Split)
         ───────────────────────────────────────────────────────────── */}
      <div className="dw-orchestrator-panel">
        <div className="dw-ambient-glow-1" />
        <div className="dw-ambient-glow-2" />
        <NeuralOrchestratorCanvas activeNodeIndex={activeNode} />

        {/* Top Header / Brand Hub */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(99, 102, 241, 0.25))',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(56, 189, 248, 0.2)',
            }}>
              <span className="material-symbols-outlined" style={{ color: '#38bdf8', fontSize: 22 }}>
                hub
              </span>
            </div>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#f8fafc' }}>
                DataWise <span style={{ color: '#38bdf8', fontFamily: 'JetBrains Mono', fontSize: '0.9rem', fontWeight: 500 }}>AI</span>
              </span>
            </div>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.3rem 0.75rem',
            borderRadius: 999,
            background: 'rgba(52, 211, 153, 0.1)',
            border: '1px solid rgba(52, 211, 153, 0.25)',
            color: '#34d399',
            fontSize: '0.7rem',
            fontFamily: 'JetBrains Mono',
            letterSpacing: '0.04em',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
            <span>100% AIR-GAPPED // ZERO-EGRESS</span>
          </div>
        </div>

        {/* Central Narrative & Live Agent Topology */}
        <div style={{ position: 'relative', zIndex: 10, margin: 'auto 0', padding: '2rem 0' }}>
          <div style={{ maxWidth: 540 }}>
            <div style={{
              display: 'inline-block',
              marginBottom: '0.75rem',
              padding: '0.2rem 0.65rem',
              borderRadius: 4,
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              color: '#38bdf8',
              fontFamily: 'JetBrains Mono',
              fontSize: '0.7rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              Autonomous Orchestration Fabric
            </div>

            <h1 style={{
              fontSize: 'clamp(1.75rem, 3.2vw, 2.75rem)',
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              color: '#f8fafc',
            }}>
              Architect intelligence with{' '}
              <span style={{
                background: 'linear-gradient(135deg, #38bdf8 0%, #a78bfa 50%, #34d399 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                autonomous agent fleets.
              </span>
            </h1>

            <p style={{ marginTop: '0.85rem', color: '#94a3b8', fontSize: '0.975rem', lineHeight: 1.55 }}>
              Provision your isolated multi-agent cluster. Accelerate model engineering and dataset preparation from days to minutes.
            </p>
          </div>

          {/* Interactive Agent Cluster Diagnostics */}
          <div style={{
            marginTop: '1.75rem',
            background: 'rgba(15, 22, 36, 0.75)',
            backdropFilter: 'blur(16px)',
            borderRadius: 14,
            border: '1px solid rgba(255, 255, 255, 0.07)',
            padding: '1.25rem',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#38bdf8' }}>memory</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.775rem', color: '#e2e8f0', letterSpacing: '0.05em' }}>
                  CLUSTER-NODE-MAP // US-EAST-ISOLATE
                </span>
              </div>
              <span style={{
                fontFamily: 'JetBrains Mono',
                fontSize: '0.675rem',
                padding: '0.15rem 0.5rem',
                borderRadius: 4,
                background: 'rgba(56, 189, 248, 0.1)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.2)',
              }}>
                ACTIVE ROUTING
              </span>
            </div>

            {/* Nodes Grid */}
            <div className="dw-nodes-grid">
              {AGENT_NODES.map((node, idx) => (
                <div
                  key={node.id}
                  onClick={() => setActiveNode(idx)}
                  className={`dw-node-card ${activeNode === idx ? 'active' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: '#64748b' }}>
                      NODE::0{idx + 1}
                    </span>
                    <span style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: node.accentColor,
                      boxShadow: `0 0 8px ${node.accentColor}`,
                    }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f1f5f9' }}>{node.name}</div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: node.accentColor, marginTop: '0.15rem' }}>
                      {node.metricValue}
                    </div>
                  </div>
                  {activeNode === idx && (
                    <div style={{
                      marginTop: '0.35rem',
                      paddingTop: '0.45rem',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.675rem',
                      fontFamily: 'JetBrains Mono',
                      color: '#94a3b8',
                    }}>
                      <span>LATENCY: {node.details.latency}</span>
                      <span>{node.details.hardware}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Governance Checklist Bar */}
            <div style={{
              marginTop: '1rem',
              paddingTop: '0.85rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.65rem',
              fontSize: '0.7rem',
              fontFamily: 'JetBrains Mono',
              color: '#94a3b8',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#34d399' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
                <span>SOC2 TYPE II COMPLIANT</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#34d399' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>verified_user</span>
                <span>FIPS 140-3 HARDENED</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#38bdf8' }}>lock</span>
                <span>NO MODEL RETRAINING GUARANTEE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Security Audit Log Strip */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.675rem', fontFamily: 'JetBrains Mono', color: '#64748b' }}>
            <span>SECURE TELEMETRY STREAM</span>
            <span style={{ color: '#38bdf8' }}>TLS 1.3 ENCLAVE SESSION</span>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '0.35rem',
            fontFamily: 'JetBrains Mono',
            fontSize: '0.65rem',
            textAlign: 'center',
          }}>
            {['INIT', 'SECURE', 'SYNC', 'OPTIMIZE', 'SERVE'].map((stage, i) => (
              <div
                key={stage}
                style={{
                  padding: '0.3rem 0.2rem',
                  borderRadius: 4,
                  background: 'rgba(18, 24, 38, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  color: i <= 3 ? '#38bdf8' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem',
                }}
              >
                <span style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: i <= 3 ? '#38bdf8' : '#475569',
                }} />
                <span>{stage}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          RIGHT PANEL: Executive Provisioning Portal (45% Split)
         ───────────────────────────────────────────────────────────── */}
      <div className="dw-portal-panel">
        <div className="dw-portal-card">
          {/* Top Pill & Switcher */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.725rem', color: '#38bdf8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Provisioning Portal
              </span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.675rem', color: '#64748b', background: 'rgba(255, 255, 255, 0.05)', padding: '0.15rem 0.5rem', borderRadius: 4 }}>
                v4.18.2
              </span>
            </div>

            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.025em', color: '#f8fafc' }}>
                {mode === 'register' ? 'Create your workspace' : 'Welcome back to DataWise'}
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {mode === 'register'
                  ? 'Deploy specialized AI agents on your data infrastructure.'
                  : 'Sign in to access your agent clusters, datasets & pipelines.'}
              </p>
            </div>

            {/* Segmented Mode Switcher */}
            <div className="dw-segmented-tab">
              <button
                type="button"
                onClick={() => { setMode('signin'); setErrorMessage(''); }}
                className={`dw-tab-btn ${mode === 'signin' ? 'active' : ''}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setErrorMessage(''); }}
                className={`dw-tab-btn ${mode === 'register' ? 'active' : ''}`}
              >
                Create Account
              </button>
            </div>

            {/* Auth Method Switcher: Clerk Universal SSO vs Air-Gapped Form */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px',
              borderRadius: '8px',
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginTop: '0.4rem',
            }}>
              <button
                type="button"
                onClick={() => { setAuthMethod('clerk'); setErrorMessage(''); }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: authMethod === 'clerk' ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                  color: authMethod === 'clerk' ? '#38bdf8' : '#64748b',
                  boxShadow: authMethod === 'clerk' ? '0 0 12px rgba(99, 102, 241, 0.25)' : 'none',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>verified_user</span>
                <span>Clerk Universal Auth</span>
              </button>
              <button
                type="button"
                onClick={() => { setAuthMethod('credentials'); setErrorMessage(''); }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: authMethod === 'credentials' ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                  color: authMethod === 'credentials' ? '#38bdf8' : '#64748b',
                  boxShadow: authMethod === 'credentials' ? '0 0 12px rgba(99, 102, 241, 0.25)' : 'none',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>key</span>
                <span>Air-Gapped / Demo</span>
              </button>
            </div>
          </div>

          {authMethod === 'clerk' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', marginTop: '0.5rem' }}>
              {mode === 'signin' ? (
                <SignIn
                  appearance={{
                    baseTheme: dark,
                    variables: {
                      colorPrimary: '#6366f1',
                      colorBackground: '#0b0f19',
                      colorInputBackground: '#131b2e',
                      colorInputText: '#f8fafc',
                      colorText: '#f8fafc',
                      colorTextSecondary: '#94a3b8',
                      borderRadius: '0.65rem',
                    },
                    elements: {
                      rootBox: { width: '100%' },
                      card: {
                        backgroundColor: '#0b0f19',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: 'none',
                        width: '100%',
                      },
                      headerTitle: { color: '#f8fafc', fontSize: '1.25rem' },
                      headerSubtitle: { color: '#94a3b8' },
                      formButtonPrimary: {
                        backgroundColor: '#6366f1',
                        '&:hover': { backgroundColor: '#4f46e5' },
                      },
                      footerActionLink: { color: '#38bdf8' },
                    },
                  }}
                />
              ) : (
                <SignUp
                  appearance={{
                    baseTheme: dark,
                    variables: {
                      colorPrimary: '#6366f1',
                      colorBackground: '#0b0f19',
                      colorInputBackground: '#131b2e',
                      colorInputText: '#f8fafc',
                      colorText: '#f8fafc',
                      colorTextSecondary: '#94a3b8',
                      borderRadius: '0.65rem',
                    },
                    elements: {
                      rootBox: { width: '100%' },
                      card: {
                        backgroundColor: '#0b0f19',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: 'none',
                        width: '100%',
                      },
                      headerTitle: { color: '#f8fafc', fontSize: '1.25rem' },
                      headerSubtitle: { color: '#94a3b8' },
                      formButtonPrimary: {
                        backgroundColor: '#6366f1',
                        '&:hover': { backgroundColor: '#4f46e5' },
                      },
                      footerActionLink: { color: '#38bdf8' },
                    },
                  }}
                />
              )}
            </div>
          ) : (
            <>
              {/* SSO Identity Providers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="dw-sso-btn"
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(56, 189, 248, 0.2))',
                      border: '1px solid rgba(99, 102, 241, 0.45)',
                      color: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.6rem',
                      padding: '0.65rem 1rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      borderRadius: 8,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#38bdf8' }}>verified_user</span>
                    <span>Sign in with Clerk Modal (Google &amp; GitHub)</span>
                  </button>
                </SignInButton>

                <div className="dw-sso-grid">
                  {/* Google SSO */}
                  <button
                    type="button"
                    onClick={handleGoogleSSO}
                    className="dw-sso-btn"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                    <span>Google SSO</span>
                  </button>

                  {/* GitHub Org SSO */}
                  <button
                    type="button"
                    onClick={handleGitHubSSO}
                    className="dw-sso-btn"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" color="#e2e8f0">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                    <span>GitHub Org</span>
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.725rem', color: '#64748b' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#34d399' }}>check_circle</span>
                  <span>Encrypted SAML &amp; SSO Ready</span>
                  <button
                    type="button"
                    onClick={() => { setShowOAuthModal(true); setOauthModalProvider('google'); }}
                    style={{ marginLeft: 6, color: '#38bdf8', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.725rem', textDecoration: 'underline' }}
                  >
                    OAuth Setup Guide
                  </button>
                </div>
              </div>


          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', height: 1, background: 'rgba(255, 255, 255, 0.07)' }} />
            <span style={{
              position: 'absolute',
              padding: '0 0.75rem',
              background: '#07090e',
              fontFamily: 'JetBrains Mono',
              fontSize: '0.65rem',
              color: '#64748b',
              letterSpacing: '0.08em',
            }}>
              {mode === 'register' ? 'OR REGISTER WITH IDENTITY' : 'OR SIGN IN WITH CREDENTIALS'}
            </span>
          </div>

          {/* Feedback & Error Banner */}
          {errorMessage && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: 8,
              background: 'rgba(248, 113, 113, 0.1)',
              border: '1px solid rgba(248, 113, 113, 0.25)',
              color: '#f87171',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              lineHeight: 1.45,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, marginTop: 1, flexShrink: 0 }}>error</span>
              <div style={{ flex: 1 }}>{errorMessage}</div>
            </div>
          )}

          {/* Core Credentials Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {mode === 'register' && (
              <div className="dw-input-group">
                <label className="dw-input-label" htmlFor="name-input">
                  Full Name &amp; Title
                </label>
                <div className="dw-input-wrapper">
                  <input
                    id="name-input"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Dr. Elena Vance"
                    className="dw-input"
                  />
                  <span className="material-symbols-outlined dw-input-icon" style={{ fontSize: 18 }}>badge</span>
                </div>
              </div>
            )}

            <div className="dw-input-group">
              <label className="dw-input-label" htmlFor="email-input">
                Enterprise Email (@gmail.com)
              </label>
              <div className="dw-input-wrapper">
                <input
                  id="email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="elena.vance@gmail.com"
                  className="dw-input"
                />
                <span className="material-symbols-outlined dw-input-icon" style={{ fontSize: 18 }}>mail</span>
              </div>
            </div>

            <div className="dw-input-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="dw-input-label" htmlFor="password-field">
                  Root Security Key / Password
                </label>
                {mode === 'register' && (
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.675rem', color: strength.color }}>
                    {strength.label}
                  </span>
                )}
              </div>
              <div className="dw-input-wrapper">
                <input
                  id="password-field"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="dw-input"
                  style={{ fontFamily: showPassword ? 'inherit' : 'monospace', letterSpacing: showPassword ? 'normal' : '0.15em' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.75rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex' }}
                  aria-label="Toggle password visibility"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>

              {/* Entropy Bar (Register mode) */}
              {mode === 'register' && (
                <div style={{ width: '100%', height: 4, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: strength.percent,
                    background: strength.color,
                    transition: 'all 0.3s ease',
                    borderRadius: 2,
                  }} />
                </div>
              )}
            </div>

            {/* Machine Learning Ecosystem (Register mode only) */}
            {mode === 'register' && (
              <div className="dw-input-group">
                <span className="dw-input-label">Primary Machine Learning Ecosystem</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginTop: 2 }}>
                  {[
                    { id: 'pytorch', label: 'PyTorch' },
                    { id: 'tensorflow', label: 'TensorFlow' },
                    { id: 'jax', label: 'JAX' },
                    { id: 'sklearn', label: 'Scikit-Learn' },
                    { id: 'xgboost', label: 'XGBoost' },
                  ].map((fw) => (
                    <button
                      key={fw.id}
                      type="button"
                      onClick={() => setFramework(fw.id)}
                      className={`dw-fw-pill ${framework === fw.id ? 'selected' : ''}`}
                    >
                      {fw.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Data Confidentiality Agreement (Register mode only) */}
            {mode === 'register' && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: 4 }}>
                <input
                  id="data-conf-check"
                  type="checkbox"
                  required
                  checked={dataAgreement}
                  onChange={(e) => setDataAgreement(e.target.checked)}
                  style={{ marginTop: 3, accentColor: '#38bdf8', cursor: 'pointer' }}
                />
                <label htmlFor="data-conf-check" style={{ fontSize: '0.775rem', color: '#94a3b8', lineHeight: 1.45, cursor: 'pointer' }}>
                  I agree that my proprietary training sets and pipeline metadata remain confidential and are{' '}
                  <span style={{ color: '#f8fafc', fontWeight: 500 }}>never utilized for foundation model retraining</span>.
                </label>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="dw-submit-btn"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, animation: 'spin 1s linear infinite' }}>
                    refresh
                  </span>
                  <span>{submissionStep || 'Securing Node Access...'}</span>
                </>
              ) : (
                <>
                  <span>{mode === 'register' ? 'Provision AI Workspace' : 'Access Neural Cluster'}</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            borderRadius: 8,
            background: 'rgba(18, 24, 38, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            fontSize: '0.775rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#38bdf8' }}>bolt</span>
              <span>Need instant evaluation?</span>
            </div>
            <button
              type="button"
              onClick={loadDemoCredentials}
              style={{
                background: 'none',
                border: 'none',
                color: '#38bdf8',
                fontFamily: 'JetBrains Mono',
                fontSize: '0.725rem',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Load Demo Credentials
            </button>
          </div>
          </>
          )}

          {/* Footer Switcher */}
          <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
            {mode === 'register' ? (
              <>
                Already have an active cluster?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setErrorMessage(''); }}
                  style={{ background: 'none', border: 'none', color: '#38bdf8', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Need to provision an isolated cluster?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('register'); setErrorMessage(''); }}
                  style={{ background: 'none', border: 'none', color: '#38bdf8', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Create account
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          OAUTH CONFIGURATION MODAL (Private, Secure In-App Guide)
         ───────────────────────────────────────────────────────────── */}
      {showOAuthModal && (
        <div className="dw-modal-overlay" onClick={() => setShowOAuthModal(false)}>
          <div className="dw-modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ color: '#38bdf8', fontSize: 20 }}>security</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                  OAuth Provider Security Setup
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowOAuthModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18 }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.55 }}>
              <p>
                To keep all your API keys and secrets 100% private and protected, OAuth credentials are <strong style={{ color: '#f8fafc' }}>only loaded from your private local .env file</strong> and never exposed to the public bundle.
              </p>
              <div style={{ marginTop: '0.85rem', background: 'rgba(0, 0, 0, 0.4)', borderRadius: 8, padding: '0.85rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.725rem', color: '#38bdf8', marginBottom: 4 }}>
                  // In your root .env file:
                </div>
                <pre style={{ fontFamily: 'JetBrains Mono', fontSize: '0.725rem', color: '#f8fafc', margin: 0, overflowX: 'auto' }}>
{`GOOGLE_CLIENT_ID=your_new_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_new_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
OAUTH_REDIRECT_BASE_URL=http://localhost:8000`}
                </pre>
              </div>
              <p style={{ marginTop: '0.85rem', fontSize: '0.775rem', color: '#64748b' }}>
                Redirect URI configured in Google Cloud Console: <code style={{ color: '#38bdf8' }}>http://localhost:8000/api/auth/google/callback</code>
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowOAuthModal(false)}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: 6,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'transparent',
                  color: '#94a3b8',
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOAuthModal(false);
                  if (oauthModalProvider === 'google') handleGoogleSSO();
                  else handleGitHubSSO();
                }}
                style={{
                  padding: '0.55rem 1.15rem',
                  borderRadius: 6,
                  border: 'none',
                  background: '#38bdf8',
                  color: '#041019',
                  fontWeight: 600,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                }}
              >
                Proceed to {oauthModalProvider === 'google' ? 'Google' : 'GitHub'} SSO →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
