import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FolderGit2,
  Plus,
  ArrowRight,
  Database,
  Box,
  Calendar,
  Tag,
  Shield,
  Search,
  Copy,
  RefreshCw,
  Upload,
  Trash2,
  Zap,
  Sparkles,
  Layers,
  Brain,
  Cpu,
  CheckCircle2,
  Sliders,
  BarChart3,
  TrendingUp,
} from 'lucide-react'

import { authStore } from '../../services/authStore'
import { projectsApi } from '../../services/api'
import { Project } from '../../types'

export function ProjectsList() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  const [newProjectTag, setNewProjectTag] = useState('Classification')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadProjects = async () => {
    setIsLoading(true)
    try {
      const list = await projectsApi.list()
      setProjects(list || [])
    } catch (err) {
      console.error('Failed to load projects:', err)
      setProjects([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName.trim()) return
    setIsSubmitting(true)

    try {
      const created = await projectsApi.create({
        name: newProjectName.trim(),
        description: newProjectDesc.trim() || `Data science workspace for ${newProjectName.trim()}`,
        objective: newProjectDesc.trim() || undefined,
        configuration: {
          task_type: newProjectTag,
        },
      })
      authStore.setCurrentProject(created)
      setIsModalOpen(false)
      setNewProjectName('')
      setNewProjectDesc('')
      navigate(`/projects/${created.id}`)
    } catch (err) {
      console.error('Failed to create project:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloneProject = async (e: React.MouseEvent, projId: string) => {
    e.stopPropagation()
    try {
      const cloned = await projectsApi.clone(projId)
      await loadProjects()
      authStore.setCurrentProject(cloned)
    } catch (err) {
      console.error('Failed to clone project:', err)
    }
  }

  const handleDeleteProject = async (e: React.MouseEvent, projId: string) => {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this project?')) return
    try {
      await projectsApi.delete(projId)
      await loadProjects()
    } catch (err) {
      console.error('Failed to delete project:', err)
    }
  }

  const handleSelect = (proj: any) => {
    authStore.setCurrentProject(proj)
    navigate(`/projects/${proj.id}`)
  }

  const filteredProjects = projects.filter((p) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.objective?.toLowerCase().includes(q) ||
      p.configuration?.dataset_name?.toLowerCase().includes(q)
    )
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
      {/* ── Top Header with BIG New Project Button ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--primary-light)' }}>
              AI Workspace Hub
            </span>
            <span style={{ fontSize: '0.72rem', background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
              Database Persisted
            </span>
          </div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: '#f8fafc' }}>
            Projects Workspace
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: '6px 0 0 0', maxWidth: '640px' }}>
            Multi-tenant isolated data science environments. Upload your dataset, formulate your problem, and let specialized agents build and tune optimal models step-by-step.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          {projects.length > 0 && (
            <div style={{ position: 'relative', minWidth: '240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search your projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 36px',
                  borderRadius: '10px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#f8fafc',
                  fontSize: '0.88rem',
                  outline: 'none',
                }}
              />
            </div>
          )}

          {/* ── BIG NEW PROJECT BUTTON (Required Specification) ── */}
          <Link
            to="/projects/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '13px 26px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.96rem',
              textDecoration: 'none',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4), inset 0 1px 1px rgba(255,255,255,0.3)',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(99, 102, 241, 0.6), inset 0 1px 1px rgba(255,255,255,0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.4), inset 0 1px 1px rgba(255,255,255,0.3)'
            }}
          >
            <Plus size={19} strokeWidth={2.8} />
            <span>Create New Project</span>
            <Sparkles size={16} color="#fde047" />
          </Link>
        </div>
      </div>

      {/* ── Loading State ── */}
      {isLoading ? (
        <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="spin" style={{ marginBottom: '14px', color: '#818cf8' }} />
          <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>Loading workspace database...</div>
        </div>
      ) : filteredProjects.length === 0 ? (
        /* ══════════════════════════════════════════════════════════════
           ZERO PROJECTS WELCOME HERO (Clean Slate After Login)
        ══════════════════════════════════════════════════════════════ */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.5) 0%, rgba(15, 23, 42, 0.8) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: '24px',
              padding: '52px 36px',
              textAlign: 'center',
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.35)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Ambient Background Aura */}
            <div
              style={{
                position: 'absolute',
                top: '-50px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '400px',
                height: '180px',
                background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)',
                filter: 'blur(40px)',
                pointerEvents: 'none',
              }}
            />

            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '24px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.2) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                color: '#a5b4fc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 22px',
                boxShadow: '0 8px 30px rgba(99, 102, 241, 0.25)',
              }}
            >
              <FolderGit2 size={38} strokeWidth={2} />
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99,102,241,0.3)', padding: '4px 14px', borderRadius: '100px', marginBottom: '14px' }}>
              <Sparkles size={13} color="#a5b4fc" />
              <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Fresh Workspace Initialized
              </span>
            </div>

            <h2 style={{ fontSize: '1.9rem', fontWeight: 900, margin: '0 0 12px 0', letterSpacing: '-0.02em', color: '#f8fafc' }}>
              {searchQuery ? 'No matching projects found' : 'No Projects Created Yet'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', maxWidth: '580px', margin: '0 auto 32px', lineHeight: 1.65 }}>
              {searchQuery
                ? `No projects matched "${searchQuery}". Clear your search query or create a new project.`
                : 'Your workspace is empty and ready. Upload your dataset, specify the problem to solve, and our autonomous agent fleet will analyze the data, recommend the best ML algorithms, and train state-of-the-art models step-by-step.'}
            </p>

            {/* ── EXTRA LARGE NEW PROJECT CTA BUTTON ── */}
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
              <Link
                to="/projects/new"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px 36px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '1.05rem',
                  textDecoration: 'none',
                  boxShadow: '0 12px 32px rgba(124, 58, 237, 0.45)',
                  transition: 'all 0.25s ease',
                  border: '1px solid rgba(255,255,255,0.25)',
                }}
              >
                <Plus size={22} strokeWidth={3} />
                <span>Create Your First Project</span>
                <ArrowRight size={18} />
              </Link>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="btn btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '16px 24px',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  borderRadius: '14px',
                }}
              >
                <Zap size={16} color="#fbbf24" /> Quick Name Setup
              </button>
            </div>

            {/* ── Instant Inline Quick Creator ── */}
            <div
              style={{
                marginTop: '34px',
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '20px 24px',
                maxWidth: '620px',
                margin: '34px auto 0',
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#a5b4fc', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={14} color="#818cf8" /> Quick Project Creator (Saved directly to database)
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Enter project name (e.g. Sales Forecast 2026, Churn Predictor)..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreateProject(e) }}
                  style={{
                    flex: 1,
                    minWidth: '240px',
                    padding: '11px 16px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={handleCreateProject}
                  disabled={isSubmitting || !newProjectName.trim()}
                  className="btn btn-primary"
                  style={{ padding: '11px 20px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 800, borderRadius: '10px' }}
                >
                  <Plus size={16} /> {isSubmitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </div>
          </div>

          {/* ── 4-Step Process Guide for New Users ── */}
          <div style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid var(--border-subtle)', borderRadius: '20px', padding: '28px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <Brain size={18} color="var(--primary-light)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#cbd5e1' }}>
                How DataWise Autonomous AI Works
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
              {[
                {
                  step: '01',
                  title: 'Upload Dataset',
                  desc: 'Provide your raw dataset file in CSV, Excel, Parquet, or JSON format. Automatic schema ingestion and profiling.',
                  icon: Database,
                  color: '#818cf8',
                },
                {
                  step: '02',
                  title: 'Problem & Solution Prompts',
                  desc: 'Describe what problem you are solving (Prompt A) and your performance & operational requirements (Prompt B).',
                  icon: Sliders,
                  color: '#38bdf8',
                },
                {
                  step: '03',
                  title: 'Agent Analysis & Algorithm Choice',
                  desc: 'LLM analyzes data distributions, selects the best algorithms (XGBoost, LightGBM, Random Forest, etc.) with full reasoning.',
                  icon: Layers,
                  color: '#a78bfa',
                },
                {
                  step: '04',
                  title: 'Step-by-Step Training & Decisions',
                  desc: 'Watch 17 agent stages execute with human checkpoints for major changes. Deploy instant real-time prediction APIs.',
                  icon: Cpu,
                  color: '#34d399',
                },
              ].map((s) => {
                const IconComponent = s.icon
                return (
                  <div
                    key={s.step}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '16px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: s.color }}>
                        STEP {s.step}
                      </span>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                        <IconComponent size={16} />
                      </div>
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                      {s.title}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {s.desc}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Quick Benchmark Presets */}
            <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Don't have a dataset file right now? Try a pre-configured benchmark scenario:
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { name: 'Telecom Churn', sample: 'telecom_churn', icon: TrendingUp },
                  { name: 'Credit Fraud', sample: 'financial_fraud', icon: Shield },
                  { name: 'Exam Performance', sample: 'student_performance', icon: BarChart3 },
                  { name: 'House Prices', sample: 'house_prices', icon: Box },
                ].map((item) => (
                  <Link
                    key={item.sample}
                    to={`/projects/new?sample=${item.sample}`}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#cbd5e1',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(99,102,241,0.2)'
                      e.currentTarget.style.color = '#fff'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                      e.currentTarget.style.color = '#cbd5e1'
                    }}
                  >
                    <span>{item.name}</span>
                    <ArrowRight size={11} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════
           PROJECTS GRID (Populated After 1st and Subsequent Projects)
        ══════════════════════════════════════════════════════════════ */
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#f8fafc' }}>
                Your Saved Projects
              </span>
              <span style={{ fontSize: '0.75rem', background: 'rgba(99,102,241,0.18)', color: '#a5b4fc', padding: '2px 10px', borderRadius: '12px', fontWeight: 800 }}>
                {filteredProjects.length} {filteredProjects.length === 1 ? 'Project' : 'Projects'} in Database
              </span>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Select any project to enter its multi-agent workspace
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '22px' }}>
            {filteredProjects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => handleSelect(proj)}
                className="project-card"
                style={{
                  background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '18px',
                  padding: '22px',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)'
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%)',
                          color: 'var(--primary-light)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid rgba(99,102,241,0.3)',
                        }}
                      >
                        <FolderGit2 size={22} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.08rem', fontWeight: 800, margin: 0, color: '#f8fafc', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {proj.name}
                        </h3>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                          ID: {proj.id}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '0.65rem',
                        padding: '4px 10px',
                        borderRadius: '100px',
                        background: proj.status === 'completed' ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)',
                        color: proj.status === 'completed' ? 'var(--success)' : 'var(--primary-light)',
                        border: `1px solid ${proj.status === 'completed' ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)'}`,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {proj.status || 'Active'}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px', minHeight: '38px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {proj.description || proj.objective || 'Autonomous machine learning project workspace.'}
                  </p>

                  {/* Dataset & Model Overview Chips */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', padding: '7px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Dataset:</span>
                      <strong style={{ color: '#cbd5e1' }}>
                        {proj.dataset_name || proj.configuration?.dataset_name || 'Dataset Ingested'}
                      </strong>
                    </div>

                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', padding: '7px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Champion Model:</span>
                      <strong style={{ color: '#a5b4fc' }}>
                        {proj.best_model || proj.configuration?.best_model || 'Ready to Run'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={(e) => handleCloneProject(e, proj.id)}
                        title="Clone Project Configuration"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          color: 'var(--text-muted)',
                          fontSize: '0.74rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Copy size={12} /> Clone
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteProject(e, proj.id)}
                        title="Delete Project"
                        style={{
                          background: 'rgba(239, 68, 68, 0.08)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          color: '#f87171',
                          fontSize: '0.74rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelect(proj)}
                      className="btn btn-primary"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '8px 16px', borderRadius: '8px', fontWeight: 700 }}
                    >
                      <span>Open Workspace</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Create Project Quick Modal ── */}
      {isModalOpen && (
        <div className="cmd-palette-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="cmd-palette-modal" style={{ padding: '28px', maxWidth: '520px', borderRadius: '20px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                <Plus size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>Create New ML Project</h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Saved directly to your persistent database</span>
              </div>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '12px 0 20px 0', lineHeight: 1.5 }}>
              Creates an isolated data science environment with dedicated storage, models, and artifact registries.
            </p>

            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '6px', color: '#cbd5e1' }}>
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Telecom Customer Churn, Fraud Detector"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '6px', color: '#cbd5e1' }}>
                  Description / Objective
                </label>
                <textarea
                  rows={3}
                  placeholder="Business objective, target KPI, and dataset domain..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="form-textarea"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '6px', color: '#cbd5e1' }}>
                  Primary Objective
                </label>
                <select
                  value={newProjectTag}
                  onChange={(e) => setNewProjectTag(e.target.value)}
                  className="form-select"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                >
                  <option value="Classification">Supervised Classification</option>
                  <option value="Regression">Supervised Regression</option>
                  <option value="Deep Learning">PyTorch Deep Learning / Neural Network</option>
                  <option value="Time Series">Time Series Forecasting</option>
                  <option value="Anomaly Detection">Fraud / Anomaly Detection</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ padding: '10px 22px', fontWeight: 800 }}>
                  {isSubmitting ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectsList
