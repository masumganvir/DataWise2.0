import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Upload,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Settings2,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Cpu,
  Database,
  ArrowRight,
  Layers,
  Search,
  RefreshCw,
  Zap,
  Brain,
  BarChart3,
  Shield,
  FlaskConical,
  X,
  Play,
  ChevronRight,
  Lock,
  Unlock,
  SlidersHorizontal,
  Info,
  Target,
  Compass,
} from 'lucide-react'
import { projectsApi } from '../../services/api'
import { authStore } from '../../services/authStore'

/* ────────────────────────────────────────────────────────────────
   Inline global keyframes — injected once into document head
──────────────────────────────────────────────────────────────── */
const STYLE_ID = 'new-project-animations'
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    @keyframes floatBall {
      0%,100% { transform: translate(0, 0) scale(1); }
      33% { transform: translate(40px, -60px) scale(1.08); }
      66% { transform: translate(-30px, 40px) scale(0.95); }
    }
    @keyframes orbitRing {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes pulseGlow {
      0%,100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); }
      50% { box-shadow: 0 0 0 16px rgba(99,102,241,0); }
    }
    @keyframes shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(24px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes progressPulse {
      0%,100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
    @keyframes checkPop {
      0% { transform: scale(0); opacity: 0; }
      60% { transform: scale(1.2); }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes spinSlow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .np-slide-up { animation: slideUp 0.5s cubic-bezier(0.16,1,0.3,1) both; }
    .np-fade-in { animation: fadeIn 0.4s ease both; }
    .np-check-pop { animation: checkPop 0.45s cubic-bezier(0.34,1.56,0.64,1) both; }
    .np-spin-slow { animation: spinSlow 3s linear infinite; }
    .np-card:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.35) !important; }
    .np-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
    .np-btn-glow:not(:disabled):hover {
      transform: translateY(-2px) scale(1.01);
      box-shadow: 0 14px 36px rgba(99,102,241,0.55) !important;
    }
    .np-btn-glow { transition: all 0.2s cubic-bezier(0.16,1,0.3,1); }
    .np-input:focus { border-color: rgba(99,102,241,0.7) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
    .np-input { transition: border-color 0.15s, box-shadow 0.15s; }
    .np-tag:hover { background: rgba(99,102,241,0.25) !important; transform: scale(1.05); }
    .np-tag { transition: all 0.15s ease; cursor: pointer; }
    .np-drop:hover { border-color: var(--primary) !important; background: rgba(99,102,241,0.06) !important; }
    .np-drop { transition: all 0.2s ease; }
    .np-feature-pill:hover { background: rgba(99,102,241,0.14) !important; color: #fff !important; }
    .np-feature-pill { transition: all 0.15s ease; }
  `
  document.head.appendChild(style)
}

/* ────────────────────────────────────────────────────────────────
   Floating ambient particles background
──────────────────────────────────────────────────────────────── */
function AmbientParticles() {
  const balls = [
    { w: 320, h: 320, top: '-60px', left: '-80px', color: 'rgba(99,102,241,0.12)', delay: '0s', dur: '14s' },
    { w: 220, h: 220, top: '40%', right: '-60px', color: 'rgba(16,185,129,0.08)', delay: '-5s', dur: '18s' },
    { w: 260, h: 260, bottom: '-40px', left: '40%', color: 'rgba(139,92,246,0.1)', delay: '-9s', dur: '22s' },
    { w: 160, h: 160, top: '20%', left: '60%', color: 'rgba(99,102,241,0.07)', delay: '-3s', dur: '16s' },
  ]
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {balls.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: b.w,
            height: b.h,
            top: b.top,
            left: b.left,
            right: (b as any).right,
            bottom: (b as any).bottom,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)`,
            animationName: 'floatBall',
            animationDuration: b.dur,
            animationDelay: b.delay,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            filter: 'blur(2px)',
          }}
        />
      ))}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────
   Main Component
──────────────────────────────────────────────────────────────── */
export function NewProject() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Project Configuration & Dual Problem Prompts
  const [projectName, setProjectName] = useState('')
  const [prompt, setPrompt] = useState('')
  const [promptA, setPromptA] = useState('')
  const [promptB, setPromptB] = useState('')
  const [currentStage, setCurrentStage] = useState<number>(1)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

  // Problem Formulation State
  const [formulationResult, setFormulationResult] = useState<any>(null)
  const [isFormulating, setIsFormulating] = useState(false)

  // Advanced Options & Objectives
  const [targetColumn, setTargetColumn] = useState('Auto')
  const [taskType, setTaskType] = useState('Auto Detect')
  const [optimizationMetric, setOptimizationMetric] = useState('Auto')
  const [secondaryMetrics, setSecondaryMetrics] = useState<string[]>(['Precision', 'Recall', 'ROC-AUC'])
  const [objectiveProfile, setObjectiveProfile] = useState<string>('best_performance')
  const [validationStrategy, setValidationStrategy] = useState<string>('stratified_kfold')
  const [computeBudget, setComputeBudget] = useState('Balanced')
  const [cvFolds, setCvFolds] = useState(5)
  const [deepLearning, setDeepLearning] = useState('Auto')

  // Stage 4: Hyperparameter Workbench & Tuning Modes
  const [tuningMode, setTuningMode] = useState<'hybrid' | 'agent' | 'manual'>('hybrid')
  const [searchStrategy, setSearchStrategy] = useState<'optuna_tpe' | 'randomized'>('optuna_tpe')
  const [hpoBudget, setHpoBudget] = useState<number>(20)
  const [selectedAlgorithms, setSelectedAlgorithms] = useState<string[]>([
    'random_forest_clf',
    'hist_gradient_boosting_clf',
    'logistic_regression',
    'decision_tree_clf',
  ])
  const [algorithmSchemas, setAlgorithmSchemas] = useState<any[]>([])
  const [lockedParameters, setLockedParameters] = useState<Record<string, Record<string, any>>>({})
  const [userParameters, setUserParameters] = useState<Record<string, Record<string, any>>>({})
  const [validationNote, setValidationNote] = useState<string>('')

  // Dataset State
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'profiling' | 'ready' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [datasetMeta, setDatasetMeta] = useState<any>(null)
  const [previewData, setPreviewData] = useState<{ columns: string[]; rows: any[]; total_rows: number } | null>(null)
  const [previewSearch, setPreviewSearch] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [createdProjectId, setCreatedProjectId] = useState<string>('')

  // AI Project Planner & Human Approval Modals
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false)
  const [aiProposal, setAiProposal] = useState<any>(null)
  const [isEditingProposal, setIsEditingProposal] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState<any>(null)
  const [isPlanning, setIsPlanning] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Create project immediately using explicit name (avoids React closure state race) ──
  const ensureProjectCreated = async (customName?: string): Promise<string> => {
    if (createdProjectId) return createdProjectId
    const activeName = (customName || projectName || 'New ML Project').trim()
    const activePromptA = promptA.trim() || prompt.trim() || 'Analyze dataset and predict outcome.'
    const activePromptB = promptB.trim() || 'Build a high-performance, calibrated, interpretable model.'
    const combinedPrompt = `${activePromptA}\n\nSolution Requirements:\n${activePromptB}`

    const proj = await projectsApi.create({
      name: activeName,
      description: `Autonomous ML analysis for ${activeName}`,
      prompt: combinedPrompt,
      prompt_a: activePromptA,
      prompt_b: activePromptB,
      tuning_mode: tuningMode,
      locked_parameters: lockedParameters,
      configuration: {
        prompt_a: activePromptA,
        prompt_b: activePromptB,
        tuning_mode: tuningMode,
        locked_parameters: lockedParameters,
        user_parameters: userParameters,
        selected_algorithms: selectedAlgorithms,
        objective_profile: objectiveProfile,
        secondary_metrics: secondaryMetrics,
        validation_strategy: validationStrategy,
        target_column: targetColumn,
        task_type: taskType,
        optimization_metric: optimizationMetric,
        compute_budget: computeBudget,
        cv_folds: cvFolds,
        deep_learning: deepLearning,
        hpo_budget: hpoBudget,
        search_strategy: searchStrategy,
      },
    })
    setCreatedProjectId(proj.id)
    authStore.setCurrentProject(proj)
    return proj.id
  }

  // Process Dataset File
  const handleFileUpload = async (selectedFile: File, forceUpload: boolean = false) => {
    setFile(selectedFile)
    setUploadStatus('uploading')
    setErrorMessage('')
    setDuplicateWarning(null)

    // Derive project name from file
    const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
    const titleCase = cleanName
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')

    const activeProjectName = (projectName.trim() || titleCase || 'New ML Project').trim()
    if (!projectName.trim() && titleCase) {
      setProjectName(titleCase)
    }

    // Check if image file
    const isImageFile = selectedFile.type.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(selectedFile.name)
    if (isImageFile) {
      setTaskType('Image Classification')
      setTargetColumn('class_label')
      setPrompt(`Classify uploaded images into visual target categories using deep vision models.`)
    }

    try {
      setUploadStatus('profiling')
      const projId = await ensureProjectCreated(activeProjectName)

      const result = await projectsApi.uploadDataset(projId, selectedFile, (pct) => {
        setUploadProgress(pct)
      })

      if (result.duplicate && !forceUpload) {
        setDuplicateWarning(result)
        setUploadStatus('idle')
        return
      }

      if (result.dataset || result.row_count) {
        const meta = result.dataset || result
        setDatasetMeta(meta)
        setPreviewData(result.preview || null)
        setUploadStatus('ready')

        const recTarget = meta.recommended_target || targetColumn
        if (recTarget && recTarget !== 'Auto') {
          setTargetColumn(recTarget)
        }
        if (meta.recommended_task && meta.recommended_task !== 'Auto Detect') {
          const fmt = meta.recommended_task.charAt(0).toUpperCase() + meta.recommended_task.slice(1)
          setTaskType(fmt)
        }

        if (!isImageFile) {
          setPrompt(
            `Analyze this dataset to predict '${recTarget || 'target'}' using an autonomous ML pipeline. Maximize generalization performance and explain feature contributions.`
          )
        }

        // Proactively generate AI Project Plan proposal
        setIsPlanning(true)
        try {
          const planRes = await projectsApi.proposePlan(projId, {
            prompt: prompt.trim() || `Analyze this dataset to predict '${recTarget || 'target'}'`,
            custom_name: activeProjectName,
          })
          if (planRes?.proposal) {
            setAiProposal(planRes.proposal)
            setIsProposalModalOpen(true)
          }
        } catch (planErr) {
          console.warn('Could not generate plan proposal:', planErr)
        } finally {
          setIsPlanning(false)
        }
      } else {
        setUploadStatus('ready')
      }
    } catch (err: any) {
      setUploadStatus('error')
      setErrorMessage(err.message || 'Failed to upload and profile dataset')
    }
  }

  // Load sample dataset with realistic Prompts A & B
  const handleLoadSample = async (sampleName: string) => {
    setUploadStatus('uploading')
    setErrorMessage('')
    try {
      let dummyCsv = ''
      let derivedTitle = 'Sample Dataset Analysis'
      let derivedPromptA = ''
      let derivedPromptB = ''
      let derivedTarget = 'target'
      let derivedTask = 'Classification'

      if (sampleName === 'telecom_churn') {
        derivedTitle = 'Telecom Customer Churn'
        derivedPromptA = 'Identify customers at high risk of canceling mobile and fiber internet contracts. Churners cost 5x more to acquire than retain, so I need to detect churn early without disturbing loyal subscribers.'
        derivedPromptB = 'Build an autonomous classification pipeline that calculates churn risk probabilities, generates SHAP explanations for customer success agents, supports an adjustable decision threshold (prioritizing recall > 80%), and outputs a deployable inference API.'
        derivedTarget = 'churn'
        derivedTask = 'Classification'
        dummyCsv =
          'customer_id,age,tenure_months,monthly_charges,total_charges,payment_type,support_calls,churn\n' +
          Array.from({ length: 120 }, (_, i) => {
            const churn = Math.random() > 0.72 ? 1 : 0
            const charges = (Math.random() * 80 + 20).toFixed(2)
            const tenure = Math.floor(Math.random() * 60) + 1
            const total = (parseFloat(charges) * tenure).toFixed(2)
            const payment = ['Credit Card', 'Bank Transfer', 'Electronic Check'][i % 3]
            return `CUST_${1000 + i},${Math.floor(Math.random() * 50) + 20},${tenure},${charges},${total},${payment},${Math.floor(Math.random() * 5)},${churn}`
          }).join('\n')
      } else if (sampleName === 'financial_fraud') {
        derivedTitle = 'Credit Card Fraud Detection'
        derivedPromptA = 'I need to identify fraudulent credit card transactions. Fraud cases are rare (<0.5%), and I want to minimize missed fraud without blocking too many legitimate customers.'
        derivedPromptB = 'Build a fraud-risk prediction system that produces a risk probability, identifies suspicious transactions, explains the strongest contributing features, supports an adjustable decision threshold, and generates a deployable inference API.'
        derivedTarget = 'is_fraud'
        derivedTask = 'Classification'
        dummyCsv =
          'transaction_id,amount,transaction_hour,distance_from_home,used_pin_number,online_order,high_risk_merchant,is_fraud\n' +
          Array.from({ length: 120 }, (_, i) => {
            const fraud = Math.random() > 0.88 ? 1 : 0
            const amount = fraud ? (Math.random() * 900 + 100).toFixed(2) : (Math.random() * 90 + 5).toFixed(2)
            const hour = Math.floor(Math.random() * 24)
            const dist = (Math.random() * 80).toFixed(1)
            const pin = Math.random() > 0.5 ? 1 : 0
            const online = Math.random() > 0.4 ? 1 : 0
            const highRisk = fraud ? (Math.random() > 0.3 ? 1 : 0) : (Math.random() > 0.9 ? 1 : 0)
            return `TX_${5000 + i},${amount},${hour},${dist},${pin},${online},${highRisk},${fraud}`
          }).join('\n')
      } else if (sampleName === 'student_performance') {
        derivedTitle = 'Student Exam Performance'
        derivedPromptA = 'Predict final student exam scores to identify students at risk of failing early in the semester, allowing academic advisors to schedule targeted tutoring.'
        derivedPromptB = 'Build an interpretable regression model explaining contributing study habits and socioeconomic factors, with error bounds and calibrated confidence intervals.'
        derivedTarget = 'exam_score'
        derivedTask = 'Regression'
        dummyCsv =
          'student_id,hours_studied,attendance_pct,parental_education,tutoring_sessions,previous_exam_score,exam_score\n' +
          Array.from({ length: 120 }, (_, i) => {
            const hours = (Math.random() * 35 + 5).toFixed(1)
            const att = Math.floor(Math.random() * 30 + 70)
            const parent = ['High School', 'Bachelor', 'Master', 'Doctorate'][i % 4]
            const tutor = Math.floor(Math.random() * 6)
            const prev = Math.floor(Math.random() * 40 + 55)
            const exam = Math.min(100, Math.max(30, Math.round(prev * 0.4 + parseFloat(hours) * 1.2 + att * 0.3 + tutor * 2 + (Math.random() * 8 - 4))))
            return `STU_${2000 + i},${hours},${att},${parent},${tutor},${prev},${exam}`
          }).join('\n')
      } else if (sampleName === 'house_prices') {
        derivedTitle = 'Real Estate House Prices'
        derivedPromptA = 'Estimate residential property market prices based on square footage, location tier, construction year, and quality indicators.'
        derivedPromptB = 'Build a robust regression pipeline minimizing RMSE and MAE, handling non-linear price relationships and neighborhood effects with feature importance.'
        derivedTarget = 'price_k'
        derivedTask = 'Regression'
        dummyCsv =
          'house_id,square_feet,bedrooms,bathrooms,neighborhood_tier,year_built,garage_cars,price_k\n' +
          Array.from({ length: 120 }, (_, i) => {
            const sqft = Math.floor(Math.random() * 2500 + 800)
            const bed = Math.floor(Math.random() * 4 + 1)
            const bath = Math.floor(Math.random() * 3 + 1)
            const tier = ['Tier 1', 'Tier 2', 'Tier 3'][i % 3]
            const year = Math.floor(Math.random() * 40 + 1980)
            const garage = Math.floor(Math.random() * 3)
            const price = Math.round(sqft * 0.18 + bed * 15 + (year - 1980) * 2 + garage * 10 + (i % 3 === 0 ? 80 : 20))
            return `PROP_${3000 + i},${sqft},${bed},${bath},${tier},${year},${garage},${price}`
          }).join('\n')
      } else if (sampleName === 'image_classification') {
        derivedTitle = 'Visual Object & Defect Classifier'
        derivedPromptA = 'Automate manufacturing quality inspection by identifying surface cracks and micro-defects from camera snapshots on the assembly line.'
        derivedPromptB = 'Train high-accuracy visual classification models with low latency inference to trigger automated sorting alerts.'
        derivedTarget = 'class_label'
        derivedTask = 'Image Classification'
        dummyCsv =
          'image_id,width,height,channels,sharpness_score,ambient_light,class_label\n' +
          Array.from({ length: 120 }, (_, i) => {
            const classes = ['Defect Free', 'Surface Scratch', 'Micro Crack', 'Color Mismatch']
            const label = classes[i % classes.length]
            const sharpness = (Math.random() * 40 + 60).toFixed(1)
            const light = (Math.random() * 50 + 50).toFixed(1)
            return `IMG_${4000 + i},224,224,3,${sharpness},${light},${label}`
          }).join('\n')
      }

      setProjectName(derivedTitle)
      setPrompt(`${derivedPromptA}\n\n${derivedPromptB}`)
      setPromptA(derivedPromptA)
      setPromptB(derivedPromptB)
      setTargetColumn(derivedTarget)
      setTaskType(derivedTask)

      const sampleFile = new File([dummyCsv], `${sampleName}.csv`, { type: 'text/csv' })
      await handleFileUpload(sampleFile)
    } catch (err: any) {
      setErrorMessage(err.message)
      setUploadStatus('error')
    }
  }

  // Auto-load benchmark sample if passed via URL parameter
  useEffect(() => {
    const sample = searchParams.get('sample')
    if (sample && uploadStatus === 'idle' && !file) {
      handleLoadSample(sample)
    }
  }, [searchParams])

  // AI Problem Formulation Handler
  const handleFormulate = async () => {
    const activePromptA = promptA.trim() || prompt.trim()
    const activePromptB = promptB.trim() || prompt.trim()
    if (!activePromptA && !activePromptB) {
      setErrorMessage('Please provide both Problem Definition (Prompt A) and Desired Solution (Prompt B).')
      return
    }
    setIsFormulating(true)
    setErrorMessage('')
    try {
      const projId = await ensureProjectCreated()
      const res = await projectsApi.formulate(projId, {
        prompt_a: activePromptA,
        prompt_b: activePromptB,
      })
      setFormulationResult(res)
      if (res.task_type && (taskType === 'Auto Detect' || taskType === 'Auto')) {
        const fmt = res.task_type.charAt(0).toUpperCase() + res.task_type.slice(1)
        setTaskType(fmt)
      }
      if (res.target_candidate && (targetColumn === 'Auto' || !targetColumn)) {
        setTargetColumn(res.target_candidate)
      }
      if (res.recommended_primary_metric && (optimizationMetric === 'Auto' || !optimizationMetric)) {
        setOptimizationMetric(res.recommended_primary_metric)
      }
      if (res.recommended_secondary_metrics) {
        setSecondaryMetrics(res.recommended_secondary_metrics)
      }
      if (res.selected_algorithm_ids && res.selected_algorithm_ids.length > 0) {
        setSelectedAlgorithms(res.selected_algorithm_ids)
      }
    } catch (err: any) {
      console.warn('Formulation error:', err)
      setErrorMessage(err.message || 'Problem formulation failed')
    } finally {
      setIsFormulating(false)
    }
  }

  // Hyperparameter Schema Loader & Locking Handlers
  const loadHyperparameterSchemas = async () => {
    try {
      const projId = await ensureProjectCreated()
      const res = await projectsApi.getHyperparameterSchemas(projId, taskType.toLowerCase())
      if (res?.algorithms) {
        setAlgorithmSchemas(res.algorithms)
      }
    } catch (err) {
      console.warn('Failed loading hyperparameter schemas:', err)
    }
  }

  const toggleLockParameter = (algId: string, paramName: string, defaultValue: any) => {
    setLockedParameters((prev) => {
      const copy = { ...prev }
      if (!copy[algId]) copy[algId] = {}
      if (paramName in copy[algId]) {
        delete copy[algId][paramName]
      } else {
        copy[algId][paramName] = defaultValue
      }
      return copy
    })
  }

  const updateLockedParameterValue = (algId: string, paramName: string, value: any) => {
    setLockedParameters((prev) => ({
      ...prev,
      [algId]: {
        ...(prev[algId] || {}),
        [paramName]: value,
      },
    }))
  }

  const handleValidateAlgorithmParameters = async (algId: string) => {
    setValidationNote('')
    try {
      const projId = await ensureProjectCreated()
      const params = lockedParameters[algId] || {}
      const res = await projectsApi.validateHyperparameters(projId, {
        algorithm_id: algId,
        parameters: params,
      })
      if (res.valid) {
        setValidationNote(`✓ Parameters for ${algId} are valid against estimator.`)
      } else {
        setValidationNote(`⚠ Parameter error: ${res.error}`)
      }
    } catch (err: any) {
      setValidationNote(`Validation failed: ${err.message}`)
    }
  }

  // Drag & Drop
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0])
  }

  // Primary CTA: Start Real Training Run
  const handleStartAnalysis = async () => {
    setIsStarting(true)
    setErrorMessage('')
    try {
      let projId = createdProjectId
      const activePromptA = promptA.trim() || prompt.trim() || 'Analyze dataset and predict target.'
      const activePromptB = promptB.trim() || 'Build a high-performance, calibrated, interpretable model.'
      const combinedPrompt = `${activePromptA}\n\nSolution Requirements:\n${activePromptB}`

      const payloadConfig = {
        prompt_a: activePromptA,
        prompt_b: activePromptB,
        tuning_mode: tuningMode,
        locked_parameters: lockedParameters,
        user_parameters: userParameters,
        selected_algorithms: selectedAlgorithms,
        objective_profile: objectiveProfile,
        secondary_metrics: secondaryMetrics,
        validation_strategy: validationStrategy,
        hpo_budget: hpoBudget,
        search_strategy: searchStrategy,
        target_column: targetColumn,
        task_type: taskType,
        optimization_metric: optimizationMetric,
        compute_budget: computeBudget,
        cv_folds: cvFolds,
        deep_learning: deepLearning,
        dataset_name: datasetMeta?.filename || file?.name || 'dataset.csv',
        dataset_rows: datasetMeta?.row_count || 1000,
        dataset_cols: datasetMeta?.column_count || 14,
      }

      if (!projId) {
        const proj = await projectsApi.create({
          name: projectName,
          description: `Autonomous ML analysis for ${projectName}`,
          prompt: combinedPrompt,
          prompt_a: activePromptA,
          prompt_b: activePromptB,
          tuning_mode: tuningMode,
          locked_parameters: lockedParameters,
          configuration: payloadConfig,
        })
        projId = proj.id
        authStore.setCurrentProject(proj)
      } else {
        await projectsApi.update(projId, {
          name: projectName,
          configuration: payloadConfig,
        }).catch(() => {})
      }

      // Record approved experiment plan
      await projectsApi.approvePlan(projId, {
        project_name: projectName,
        target: targetColumn,
        task: taskType,
        primary_metric: optimizationMetric,
        prompt_a: activePromptA,
        prompt_b: activePromptB,
        tuning_mode: tuningMode,
        locked_parameters: lockedParameters,
        selected_algorithms: selectedAlgorithms,
      }).catch(() => {})

      // Start asynchronous LangGraph run
      const runResult = await projectsApi.startRun(projId, {
        prompt: combinedPrompt,
        configuration: payloadConfig,
      })

      navigate(`/projects/${projId}/run/${runResult.run_id}`)
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to start AI analysis run')
      setIsStarting(false)
    }
  }

  // AI Project Planner actions
  const handleApproveProposal = async () => {
    if (!createdProjectId || !aiProposal) return
    try {
      await projectsApi.approvePlan(createdProjectId, { proposal: aiProposal })
      if (aiProposal.project_name) setProjectName(aiProposal.project_name)
      if (aiProposal.target_candidate) setTargetColumn(aiProposal.target_candidate)
      if (aiProposal.task_type) {
        const fmt = aiProposal.task_type.charAt(0).toUpperCase() + aiProposal.task_type.slice(1)
        setTaskType(fmt)
      }
      setIsProposalModalOpen(false)
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to approve AI proposal')
    }
  }

  const handleRegenerateProposal = async () => {
    if (!createdProjectId) return
    setIsPlanning(true)
    try {
      const res = await projectsApi.regeneratePlan(createdProjectId, {
        prompt: prompt.trim() || undefined,
        custom_name: projectName.trim() || undefined,
      })
      if (res?.proposal) {
        setAiProposal(res.proposal)
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to regenerate plan')
    } finally {
      setIsPlanning(false)
    }
  }

  const handleForceUploadDuplicate = async () => {
    if (file) {
      const currentFile = file
      setDuplicateWarning(null)
      await handleFileUpload(currentFile, true)
    }
  }

  const filteredRows = previewData?.rows.filter((row: any) => {
    if (!previewSearch) return true
    return Object.values(row).some((v) => String(v).toLowerCase().includes(previewSearch.toLowerCase()))
  })

  const agentPipeline = [
    { icon: Database, label: 'Data Profiler', color: '#6366f1' },
    { icon: Shield, label: 'Quality Auditor', color: '#10b981' },
    { icon: BarChart3, label: 'EDA Agent', color: '#f59e0b' },
    { icon: Sliders, label: 'Preprocessor', color: '#8b5cf6' },
    { icon: Zap, label: 'Feature Eng.', color: '#ec4899' },
    { icon: Brain, label: 'Model Trainer', color: '#06b6d4' },
    { icon: FlaskConical, label: 'Evaluator', color: '#84cc16' },
    { icon: Sparkles, label: 'Orchestrator', color: '#f97316' },
  ]

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <AmbientParticles />

      <div
        className="np-slide-up"
        style={{
          maxWidth: '1360px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
          paddingBottom: '80px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* ── HERO HEADER ── */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.06) 50%, rgba(16,185,129,0.04) 100%)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '24px',
            padding: '36px 40px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative orbit ring */}
          <div
            style={{
              position: 'absolute',
              top: '-80px',
              right: '-80px',
              width: '280px',
              height: '280px',
              borderRadius: '50%',
              border: '1px solid rgba(99,102,241,0.15)',
              animationName: 'orbitRing',
              animationDuration: '20s',
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              border: '1px dashed rgba(139,92,246,0.12)',
              animationName: 'orbitRing',
              animationDuration: '14s',
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite',
              animationDirection: 'reverse',
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    borderRadius: '10px',
                    width: '38px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                    animationName: 'pulseGlow',
                    animationDuration: '3s',
                    animationTimingFunction: 'ease-in-out',
                    animationIterationCount: 'infinite',
                  }}
                >
                  <Sparkles size={20} color="#fff" />
                </div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    fontWeight: 800,
                    color: 'var(--primary-light)',
                    background: 'rgba(99,102,241,0.12)',
                    padding: '3px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(99,102,241,0.25)',
                  }}
                >
                  Autonomous DataLab
                </span>
                <ChevronRight size={14} color="var(--text-muted)" />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/workspace/new</span>
              </div>

              <h1
                style={{
                  fontSize: '2.4rem',
                  fontWeight: 900,
                  margin: '0 0 10px 0',
                  letterSpacing: '-0.03em',
                  background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.75) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Create New ML Project
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0, maxWidth: '680px' }}>
                Upload your dataset and describe what you want to predict. The <strong style={{ color: 'var(--primary-light)' }}>17-stage LangGraph orchestrator</strong> handles profiling, cleaning, feature engineering, model selection, training, and report generation — autonomously.
              </p>
            </div>

            {/* Agent Pipeline Visualization */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
                Agents Ready
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', maxWidth: '340px', justifyContent: 'flex-end' }}>
                {agentPipeline.map((agent, i) => {
                  const Icon = agent.icon
                  return (
                    <div
                      key={i}
                      className="np-feature-pill"
                      title={agent.label}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '5px 10px',
                        borderRadius: '100px',
                        background: `${agent.color}14`,
                        border: `1px solid ${agent.color}30`,
                        color: agent.color,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                      }}
                    >
                      <Icon size={11} />
                      <span>{agent.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── ERROR BANNER ── */}
        {errorMessage && (
          <div
            className="np-fade-in"
            style={{
              padding: '14px 20px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.06))',
              border: '1px solid rgba(239,68,68,0.35)',
              color: '#fca5a5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              fontSize: '0.9rem',
              boxShadow: '0 4px 20px rgba(239,68,68,0.12)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={18} color="#f87171" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage('')}
              style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ── MULTI-STAGE WORKBENCH STEP NAVIGATION ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            background: 'rgba(15,23,42,0.7)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '16px',
            padding: '10px',
          }}
        >
          {[
            { stage: 1, title: 'Stage 1 — Dataset & Problem', subtitle: 'Upload & Dual Problem Prompts' },
            { stage: 2, title: 'Stage 2 — Target & Task', subtitle: 'Inference & Target Confirmation' },
            { stage: 3, title: 'Stage 3 — Objectives', subtitle: 'Profiles & Validation Metrics' },
            { stage: 4, title: 'Stage 4 — Hyperparameter Workbench', subtitle: 'Hybrid/Manual Tuning & Lock' },
          ].map((s) => {
            const isActive = currentStage === s.stage
            const isCompleted = currentStage > s.stage
            return (
              <button
                key={s.stage}
                type="button"
                onClick={() => {
                  setCurrentStage(s.stage)
                  if (s.stage === 4) loadHyperparameterSchemas()
                }}
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.18))'
                    : isCompleted
                    ? 'rgba(16,185,129,0.08)'
                    : 'transparent',
                  border: isActive
                    ? '1px solid rgba(99,102,241,0.5)'
                    : isCompleted
                    ? '1px solid rgba(16,185,129,0.25)'
                    : '1px solid transparent',
                  color: isActive ? '#fff' : isCompleted ? '#34d399' : 'var(--text-muted)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '7px',
                      background: isActive
                        ? '#6366f1'
                        : isCompleted
                        ? '#10b981'
                        : 'rgba(255,255,255,0.08)',
                      color: '#fff',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isCompleted ? '✓' : s.stage}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.86rem' }}>{s.title}</div>
                    <div style={{ fontSize: '0.72rem', color: isActive ? 'var(--primary-light)' : 'var(--text-muted)', marginTop: '2px' }}>
                      {s.subtitle}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* ══════════════════════════════════════════════════════════════
            STAGE 1: DATASET AND PROBLEM DEFINITION (DUAL PROMPTS)
        ══════════════════════════════════════════════════════════════ */}
        {currentStage === 1 && (
          <div className="np-slide-up" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: '24px' }}>
            {/* Left Column: Name, Upload, and Dual Prompts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Project Name */}
              <div
                className="np-card"
                style={{
                  background: 'rgba(15,23,42,0.7)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(99,102,241,0.15)',
                  borderRadius: '20px',
                  padding: '22px 26px',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: 'var(--primary-light)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: '10px',
                  }}
                >
                  <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 900 }}>1</div>
                  Project Name (Preserved & Editable)
                </label>
                <input
                  className="np-input"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Credit Card Fraud Detection, House Price Prediction, Sales Forecasting"
                  style={{
                    width: '100%',
                    padding: '12px 18px',
                    borderRadius: '12px',
                    background: 'rgba(15,23,42,0.6)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    fontWeight: 700,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Dataset Upload */}
              <div
                className="np-card"
                style={{
                  background: 'rgba(15,23,42,0.7)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(99,102,241,0.15)',
                  borderRadius: '20px',
                  padding: '24px 28px',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: 'var(--primary-light)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}
                  >
                    <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 900 }}>2</div>
                    Dataset Upload & Benchmarks
                  </label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => handleLoadSample('telecom_churn')}
                      disabled={uploadStatus === 'uploading' || uploadStatus === 'profiling'}
                      style={{
                        fontSize: '0.72rem',
                        padding: '4px 10px',
                        borderRadius: '100px',
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.08))',
                        border: '1px solid rgba(99,102,241,0.3)',
                        color: 'var(--primary-light)',
                        cursor: 'pointer',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Zap size={11} /> Churn
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadSample('financial_fraud')}
                      disabled={uploadStatus === 'uploading' || uploadStatus === 'profiling'}
                      style={{
                        fontSize: '0.72rem',
                        padding: '4px 10px',
                        borderRadius: '100px',
                        background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.08))',
                        border: '1px solid rgba(16,185,129,0.3)',
                        color: '#34d399',
                        cursor: 'pointer',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Shield size={11} /> Fraud
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadSample('student_performance')}
                      disabled={uploadStatus === 'uploading' || uploadStatus === 'profiling'}
                      style={{
                        fontSize: '0.72rem',
                        padding: '4px 10px',
                        borderRadius: '100px',
                        background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.08))',
                        border: '1px solid rgba(245,158,11,0.3)',
                        color: '#fbbf24',
                        cursor: 'pointer',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <FlaskConical size={11} /> Exams
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadSample('house_prices')}
                      disabled={uploadStatus === 'uploading' || uploadStatus === 'profiling'}
                      style={{
                        fontSize: '0.72rem',
                        padding: '4px 10px',
                        borderRadius: '100px',
                        background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.08))',
                        border: '1px solid rgba(139,92,246,0.3)',
                        color: '#c084fc',
                        cursor: 'pointer',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <BarChart3 size={11} /> Prices
                    </button>
                  </div>
                </div>

                {/* Drop Zone */}
                <div
                  className="np-drop"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${isDragging ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '16px',
                    padding: '30px 20px',
                    textAlign: 'center',
                    background: isDragging
                      ? 'rgba(99,102,241,0.08)'
                      : 'linear-gradient(135deg, rgba(15,23,42,0.5), rgba(30,41,59,0.3))',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls,.json,.parquet,.pq,.png,.jpg,.jpeg,.webp,.zip"
                    style={{ display: 'none' }}
                    onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]) }}
                  />
                  <Upload size={24} color="#818cf8" style={{ margin: '0 auto 10px auto' }} />
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0' }}>
                    {file ? file.name : 'Click to Upload Dataset or Drag & Drop'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    CSV, XLSX, JSON, Parquet, or Image Tarballs
                  </div>
                </div>

                {uploadStatus !== 'idle' && (
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: uploadStatus === 'ready' ? '#34d399' : 'var(--primary-light)' }}>
                      {uploadStatus === 'profiling' ? 'Profiling dataset schema...' : uploadStatus === 'ready' ? `Dataset ready (${datasetMeta?.row_count?.toLocaleString() || 0} rows)` : 'Uploading...'}
                    </span>
                    {uploadStatus === 'ready' && <CheckCircle2 size={16} color="#34d399" />}
                  </div>
                )}
              </div>

              {/* MANDATORY PROMPT A: Problem Definition */}
              <div
                className="np-card"
                style={{
                  background: 'rgba(15,23,42,0.7)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '20px',
                  padding: '24px 28px',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      color: 'var(--primary-light)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 900 }}>A</div>
                    Prompt A — What problem are you trying to solve?
                  </label>
                  <span style={{ fontSize: '0.68rem', color: '#818cf8', background: 'rgba(99,102,241,0.12)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                    MANDATORY
                  </span>
                </div>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
                  Describe the business or scientific objective, current workflow limitations, and operational costs of false positives vs. false negatives.
                </p>
                <textarea
                  className="np-input"
                  rows={4}
                  value={promptA}
                  onChange={(e) => setPromptA(e.target.value)}
                  placeholder="Example: I need to identify fraudulent credit card transactions. Fraud cases are rare, and I want to minimize missed fraud without blocking too many legitimate customers."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(15,23,42,0.6)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    lineHeight: 1.5,
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* MANDATORY PROMPT B: Desired Solution and Expected Behavior */}
              <div
                className="np-card"
                style={{
                  background: 'rgba(15,23,42,0.7)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '20px',
                  padding: '24px 28px',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      color: 'var(--primary-light)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 900 }}>B</div>
                    Prompt B — What solution should the AI build, and how should it work?
                  </label>
                  <span style={{ fontSize: '0.68rem', color: '#818cf8', background: 'rgba(99,102,241,0.12)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                    MANDATORY
                  </span>
                </div>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
                  Describe expected model outputs (risk probabilities, classification labels), explainability requirements (SHAP), latency limits, and deployment expectations.
                </p>
                <textarea
                  className="np-input"
                  rows={4}
                  value={promptB}
                  onChange={(e) => setPromptB(e.target.value)}
                  placeholder="Example: Build a fraud-risk prediction system that produces a risk probability, identifies suspicious transactions, explains the strongest contributing features, supports an adjustable decision threshold, and generates a deployable inference API."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(15,23,42,0.6)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    lineHeight: 1.5,
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />

                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={handleFormulate}
                    disabled={isFormulating}
                    style={{
                      background: 'linear-gradient(135deg, rgba(99,102,241,0.3) 0%, rgba(168,85,247,0.25) 100%)',
                      border: '1px solid rgba(99,102,241,0.5)',
                      color: '#ffffff',
                      padding: '12px 24px',
                      borderRadius: '12px',
                      fontSize: '0.92rem',
                      fontWeight: 800,
                      cursor: isFormulating ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      boxShadow: '0 4px 18px rgba(99,102,241,0.3)',
                    }}
                  >
                    {isFormulating ? <RefreshCw size={17} className="spin" color="#a5b4fc" /> : <Sparkles size={17} color="#fde047" />}
                    <span>{isFormulating ? 'Agents Profiling Data & Solution...' : '✨ Analyze Dataset & Generate AI Strategy'}</span>
                  </button>
                </div>
              </div>

              {/* ── AI Structured Interpretation & Algorithm Selection Feedback Box ── */}
              {formulationResult && (
                <div
                  className="np-slide-up"
                  style={{
                    background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.45) 0%, rgba(15, 23, 42, 0.8) 100%)',
                    border: '1px solid rgba(99,102,241,0.35)',
                    borderRadius: '20px',
                    padding: '24px 26px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a5b4fc' }}>
                        <Brain size={18} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#f8fafc' }}>
                          AI Strategy & Automated Algorithm Portfolio
                        </span>
                        <div style={{ fontSize: '0.72rem', color: '#818cf8' }}>
                          Agents analyzed dataset distributions vs. Prompt A & B requirements
                        </div>
                      </div>
                    </div>

                    <span style={{ fontSize: '0.68rem', padding: '3px 10px', borderRadius: '100px', background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', fontWeight: 800 }}>
                      ✓ Strategy Formulated
                    </span>
                  </div>

                  {/* LLM Executive Strategy Rationale */}
                  {formulationResult.llm_strategy_rationale && (
                    <div
                      style={{
                        background: 'rgba(99,102,241,0.08)',
                        borderLeft: '3px solid #818cf8',
                        borderRadius: '0 10px 10px 0',
                        padding: '12px 16px',
                        marginBottom: '18px',
                        fontSize: '0.84rem',
                        lineHeight: 1.55,
                        color: '#cbd5e1',
                      }}
                    >
                      <strong style={{ color: '#a5b4fc', display: 'block', marginBottom: '4px', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Agent Intelligence Rationale:
                      </strong>
                      {formulationResult.llm_strategy_rationale}
                    </div>
                  )}

                  {/* Key Metrics & Objective Diagnosis */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '0.82rem', marginBottom: '18px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>INFERRED TASK</span>
                      <strong style={{ color: '#fff', fontSize: '0.92rem' }}>{formulationResult.task_type || taskType}</strong>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>TARGET VARIABLE</span>
                      <strong style={{ color: '#818cf8', fontSize: '0.92rem' }}>{formulationResult.target_candidate || targetColumn}</strong>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>PRIMARY METRIC</span>
                      <strong style={{ color: '#34d399', fontSize: '0.92rem' }}>{formulationResult.recommended_primary_metric || 'F1-Score'}</strong>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>COST CONSIDERATION</span>
                      <strong style={{ color: '#fbbf24', fontSize: '0.82rem', lineHeight: 1.3, display: 'block', marginTop: '2px' }}>
                        {formulationResult.cost_considerations?.false_negative_cost ? 'High False-Negative Cost' : 'Balanced Generalization'}
                      </strong>
                    </div>
                  </div>

                  {/* Automatically Chosen Algorithms with Explanations */}
                  <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div>
                        <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#f8fafc' }}>
                          Selected Algorithms for Training Portfolio
                        </span>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Automatically chosen for your dataset & problem. Toggle candidates for custom adjustments:
                        </div>
                      </div>
                      <span style={{ fontSize: '0.74rem', color: '#a5b4fc', fontWeight: 700 }}>
                        {selectedAlgorithms.length} algorithms enabled
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(formulationResult.recommended_algorithms || [
                        { id: 'lightgbm_clf', name: 'LightGBM Classifier', category: 'Gradient Boosting', reason: 'High-speed leaf-wise trees tailored for tabular relationships and low inference latency.' },
                        { id: 'xgboost_clf', name: 'XGBoost Classifier', category: 'Gradient Boosting', reason: 'Regularized gradient boosting to prevent overfitting on structured business features.' },
                        { id: 'random_forest_clf', name: 'Random Forest Classifier', category: 'Ensemble Bagging', reason: 'Bootstrap aggregation robust against noise, outliers, and varying feature scales.' },
                        { id: 'hist_gradient_boosting_clf', name: 'HistGradientBoosting', category: 'Gradient Boosting', reason: 'Binned split finding with native handling of missing observations.' },
                        { id: 'logistic_regression', name: 'Logistic Regression', category: 'Linear Baseline', reason: 'Calibrated baseline providing transparent odds ratios and coefficients.' },
                      ]).map((alg: any) => {
                        const isSelected = selectedAlgorithms.includes(alg.id)
                        return (
                          <div
                            key={alg.id}
                            onClick={() => {
                              if (isSelected) {
                                if (selectedAlgorithms.length > 1) {
                                  setSelectedAlgorithms(selectedAlgorithms.filter((a) => a !== alg.id))
                                }
                              } else {
                                setSelectedAlgorithms([...selectedAlgorithms, alg.id])
                              }
                            }}
                            style={{
                              padding: '10px 14px',
                              borderRadius: '10px',
                              background: isSelected ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.02)',
                              border: `1px solid ${isSelected ? 'rgba(99,102,241,0.45)' : 'rgba(255,255,255,0.06)'}`,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '12px',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              style={{ accentColor: '#6366f1', marginTop: '3px' }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.86rem', fontWeight: 800, color: isSelected ? '#fff' : '#94a3b8' }}>
                                  {alg.name}
                                </span>
                                {alg.category && (
                                  <span style={{ fontSize: '0.64rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                                    {alg.category}
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: 1.4 }}>
                                💡 {alg.reason}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Direct Launch Step-by-Step Action */}
                  <div style={{ marginTop: '22px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Tuning Strategy:</span>
                      <select
                        value={tuningMode}
                        onChange={(e) => setTuningMode(e.target.value as any)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: 'rgba(15,23,42,0.8)',
                          border: '1px solid rgba(99,102,241,0.3)',
                          color: '#fff',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                        }}
                      >
                        <option value="hybrid">Hybrid Mode (Recommended)</option>
                        <option value="agent">Autonomous Agent Mode</option>
                        <option value="manual">Manual Override Mode</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleStartAnalysis}
                      disabled={isStarting}
                      style={{
                        padding: '12px 28px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#fff',
                        fontWeight: 900,
                        fontSize: '0.94rem',
                        border: 'none',
                        cursor: isStarting ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 8px 24px rgba(16,185,129,0.4)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {isStarting ? <RefreshCw size={16} className="spin" /> : <Play size={16} />}
                      <span>{isStarting ? 'Launching Agents...' : '🚀 Start Step-by-Step AI Pipeline'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Dataset Profiling & Stage 1 Navigation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Dataset Profiling Card */}
              {datasetMeta ? (
                <div
                  className="np-card"
                  style={{
                    background: 'rgba(15,23,42,0.7)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(16,185,129,0.2)',
                    borderRadius: '20px',
                    padding: '22px 24px',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                  }}
                >
                  <h3 style={{ fontSize: '0.88rem', fontWeight: 800, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Database size={15} color="#34d399" />
                    <span style={{ color: '#34d399' }}>Dataset Health & Schema</span>
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                    {[
                      { label: 'ROWS', value: datasetMeta.row_count?.toLocaleString() || '—' },
                      { label: 'COLUMNS', value: datasetMeta.column_count || '—' },
                      { label: 'MEMORY', value: `${((datasetMeta.memory_usage_bytes || 0) / 1024).toFixed(1)} KB` },
                      { label: 'DUPLICATES', value: `${datasetMeta.duplicate_rows_count || 0}`, color: datasetMeta.has_duplicates ? '#f87171' : '#34d399' },
                    ].map((m) => (
                      <div
                        key={m.label}
                        style={{
                          padding: '12px 14px',
                          background: 'rgba(15,23,42,0.5)',
                          borderRadius: '12px',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{m.label}</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: m.color || 'var(--text-primary)', marginTop: '3px' }}>{m.value}</div>
                      </div>
                    ))}
                  </div>

                  {datasetMeta.target_candidates?.length > 0 && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Inferred Target Candidates
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {datasetMeta.target_candidates.map((tc: any) => (
                          <span
                            key={tc.column}
                            className="np-tag"
                            onClick={() => setTargetColumn(tc.column)}
                            style={{
                              fontSize: '0.72rem',
                              padding: '4px 10px',
                              borderRadius: '100px',
                              background: targetColumn === tc.column ? 'rgba(99,102,241,0.35)' : 'rgba(99,102,241,0.1)',
                              border: `1px solid ${targetColumn === tc.column ? 'rgba(99,102,241,0.6)' : 'rgba(99,102,241,0.2)'}`,
                              color: targetColumn === tc.column ? '#c7d2fe' : 'var(--primary-light)',
                              fontWeight: 700,
                            }}
                          >
                            {tc.column} ({Math.round((tc.confidence || 0.9) * 100)}%)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    background: 'rgba(15,23,42,0.4)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '20px',
                    padding: '24px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                  }}
                >
                  <Database size={32} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                  <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>No Dataset Uploaded Yet</div>
                  <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>Upload a dataset or choose a benchmark sample to unlock target profiling and model candidate exploration.</div>
                </div>
              )}

              {/* Stage 1 Next Button */}
              <button
                type="button"
                className="np-btn-glow"
                onClick={() => setCurrentStage(2)}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
                  color: '#fff',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
                }}
              >
                <span>Proceed to Stage 2: Target & Task</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            STAGE 2: TARGET & TASK CONFIRMATION
        ══════════════════════════════════════════════════════════════ */}
        {currentStage === 2 && (
          <div className="np-slide-up" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Target Column Selector */}
              <div
                className="np-card"
                style={{
                  background: 'rgba(15,23,42,0.7)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '20px',
                  padding: '26px 28px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <Target size={20} color="var(--primary-light)" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Target Column Confirmation</h3>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
                  Confirm the target column you want to predict. If you are conducting unsupervised clustering or anomaly detection, select "None (Unsupervised)".
                </p>

                <select
                  value={targetColumn}
                  onChange={(e) => setTargetColumn(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(15,23,42,0.6)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-primary)',
                    fontSize: '0.92rem',
                    outline: 'none',
                  }}
                >
                  <option value="Auto">⚡ Auto Detect Target</option>
                  <option value="none">None — Unsupervised Task (Clustering / Anomaly Detection)</option>
                  {datasetMeta?.columns?.map((col: any) => (
                    <option key={col.name} value={col.name}>{col.name} ({col.dtype})</option>
                  ))}
                </select>

                {datasetMeta?.target_candidates?.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 700 }}>
                      AGENT RECOMMENDATIONS:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {datasetMeta.target_candidates.map((tc: any) => (
                        <button
                          key={tc.column}
                          type="button"
                          onClick={() => setTargetColumn(tc.column)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            background: targetColumn === tc.column ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${targetColumn === tc.column ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.08)'}`,
                            color: targetColumn === tc.column ? '#c7d2fe' : 'var(--text-secondary)',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {tc.column} ({(tc.confidence ? tc.confidence * 100 : 92).toFixed(0)}% confidence)
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Task Type Confirmation */}
              <div
                className="np-card"
                style={{
                  background: 'rgba(15,23,42,0.7)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '20px',
                  padding: '26px 28px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <Compass size={20} color="#818cf8" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>ML Task Formulation</h3>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
                  Select or confirm the specific mathematical ML task type for your model pipeline.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { id: 'Classification', label: 'Binary / Multiclass Classification', desc: 'Predict categorical outcomes, risk probabilities, or class tiers.' },
                    { id: 'Regression', label: 'Continuous Numeric Regression', desc: 'Forecast continuous numeric values (prices, scores, demand).' },
                    { id: 'Time Series', label: 'Time-Series Forecasting', desc: 'Chronological lag-based sequence prediction without future leakage.' },
                    { id: 'Clustering', label: 'Unsupervised Clustering', desc: 'Discover geometric clusters using K-Means and DBSCAN.' },
                    { id: 'Anomaly Detection', label: 'Anomaly & Outlier Detection', desc: 'Identify extreme or suspicious events using Isolation Forest.' },
                  ].map((t) => {
                    const isSelected = taskType.toLowerCase().includes(t.id.toLowerCase())
                    return (
                      <div
                        key={t.id}
                        onClick={() => setTaskType(t.id)}
                        style={{
                          padding: '14px 16px',
                          borderRadius: '12px',
                          background: isSelected ? 'rgba(99,102,241,0.18)' : 'rgba(15,23,42,0.5)',
                          border: `1px solid ${isSelected ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.06)'}`,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: '0.86rem', color: isSelected ? 'var(--primary-light)' : 'var(--text-primary)' }}>
                          {t.label}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                          {t.desc}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Unsupervised Guidance Box */}
              {(taskType.toLowerCase().includes('cluster') || taskType.toLowerCase().includes('anomaly') || targetColumn === 'none') && (
                <div
                  className="np-slide-up"
                  style={{
                    padding: '16px 20px',
                    borderRadius: '14px',
                    background: 'rgba(245,158,11,0.08)',
                    border: '1px solid rgba(245,158,11,0.3)',
                    color: '#fbbf24',
                    fontSize: '0.84rem',
                    lineHeight: 1.5,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, marginBottom: '4px' }}>
                    <Info size={16} />
                    <span>Unsupervised ML Task Policy</span>
                  </div>
                  For unsupervised learning (clustering or anomaly detection), conventional ground-truth target columns are not required. The engine uses silhouette validation, internal cohesion, and distance geometries to optimize candidates.
                </div>
              )}
            </div>

            {/* Right Column: Leakage Safeguards & Stage 2 Navigation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  background: 'rgba(15,23,42,0.7)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: '20px',
                  padding: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <Shield size={18} color="#34d399" />
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#34d399' }}>
                    Data Leakage Safeguards
                  </h4>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Our Data Quality & Leakage Agent ensures:
                  <ul style={{ margin: '8px 0 0 0', paddingLeft: '18px' }}>
                    <li>Identifier and constant columns are flagged and pruned.</li>
                    <li>ColumnTransformers fit solely on training folds — never test data.</li>
                    <li>Holdout test split remains untouched until final model acceptance.</li>
                  </ul>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setCurrentStage(1)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: '14px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ← Stage 1: Problem
                </button>
                <button
                  type="button"
                  className="np-btn-glow"
                  onClick={() => setCurrentStage(3)}
                  style={{
                    flex: 1.5,
                    padding: '14px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #6366f1, #4338ca)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Stage 3: Objectives →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            STAGE 3: REQUIREMENTS & OPTIMIZATION OBJECTIVE
        ══════════════════════════════════════════════════════════════ */}
        {currentStage === 3 && (
          <div className="np-slide-up" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Predefined Objective Profiles */}
              <div
                className="np-card"
                style={{
                  background: 'rgba(15,23,42,0.7)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '20px',
                  padding: '24px 28px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <SlidersHorizontal size={20} color="var(--primary-light)" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Optimization Objective Profiles</h3>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
                  Select an objective profile aligned with your business criteria. Profiles set metric directions, validation trade-offs, and pruning rules.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {[
                    { id: 'best_performance', title: 'Best Performance', desc: 'Max ROC-AUC/F1 with deep tree ensembles.', metric: 'F1' },
                    { id: 'imbalanced_detection', title: 'Imbalanced Fraud', desc: 'Optimizes PR-AUC and recall for rare events.', metric: 'Recall' },
                    { id: 'fast_inference', title: 'Fast Inference', desc: 'Sub-10ms latency models for real-time APIs.', metric: 'F1' },
                    { id: 'low_memory', title: 'Low Memory', desc: 'Minimal RAM footprint and compact serialization.', metric: 'F1' },
                    { id: 'interpretable', title: 'Interpretable Model', desc: 'Linear and decision trees with SHAP transparency.', metric: 'F1' },
                    { id: 'small_data', title: 'Small Data Safe', desc: 'Heavy regularization to prevent overfitting.', metric: 'F1' },
                    { id: 'large_scale', title: 'Large Data Scale', desc: 'Histogram gradient boosting with parallel workers.', metric: 'F1' },
                    { id: 'time_series', title: 'Time Series', desc: 'Rolling-origin temporal walk-forward splits.', metric: 'RMSE' },
                    { id: 'cost_efficient', title: 'Cost Efficient', desc: 'Capped trial budget and early stopping.', metric: 'F1' },
                  ].map((p) => {
                    const isSelected = objectiveProfile === p.id
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setObjectiveProfile(p.id)
                          if (optimizationMetric === 'Auto') setOptimizationMetric(p.metric)
                        }}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '12px',
                          background: isSelected ? 'rgba(99,102,241,0.22)' : 'rgba(15,23,42,0.5)',
                          border: `1px solid ${isSelected ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.06)'}`,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: '0.82rem', color: isSelected ? 'var(--primary-light)' : 'var(--text-primary)' }}>
                          {p.title}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.3 }}>
                          {p.desc}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Primary & Secondary Metrics Configuration */}
              <div
                className="np-card"
                style={{
                  background: 'rgba(15,23,42,0.7)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '20px',
                  padding: '24px 28px',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 700 }}>
                      PRIMARY OPTIMIZATION METRIC
                    </label>
                    <select
                      value={optimizationMetric}
                      onChange={(e) => setOptimizationMetric(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: 'rgba(15,23,42,0.6)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    >
                      <option value="Auto">⚡ Auto (Based on Profile)</option>
                      <option value="F1">F1-Score (Balanced Precision/Recall)</option>
                      <option value="ROC-AUC">ROC-AUC (Ranking & Calibration)</option>
                      <option value="Balanced Accuracy">Balanced Accuracy (Imbalanced Classes)</option>
                      <option value="Recall">Recall (Minimize Missed Positives)</option>
                      <option value="Precision">Precision (Minimize False Alerts)</option>
                      <option value="RMSE">RMSE (Regression Penalty)</option>
                      <option value="MAE">MAE (Median Absolute Error)</option>
                      <option value="R²">R² Score (Variance Explained)</option>
                      <option value="Silhouette">Silhouette (Clustering Cohesion)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 700 }}>
                      VALIDATION SPLIT METHOD
                    </label>
                    <select
                      value={validationStrategy}
                      onChange={(e) => setValidationStrategy(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: 'rgba(15,23,42,0.6)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    >
                      <option value="stratified_kfold">Stratified K-Fold (Preserve Class Ratios)</option>
                      <option value="kfold">Standard K-Fold Cross-Validation</option>
                      <option value="time_series_split">TimeSeriesSplit (Rolling Walk-Forward)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 700 }}>
                    SECONDARY REPORTED METRICS
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['Precision', 'Recall', 'ROC-AUC', 'Log Loss', 'Balanced Accuracy', 'MAE'].map((m) => {
                      const isChecked = secondaryMetrics.includes(m)
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            if (isChecked) {
                              setSecondaryMetrics(secondaryMetrics.filter((x) => x !== m))
                            } else {
                              setSecondaryMetrics([...secondaryMetrics, m])
                            }
                          }}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '100px',
                            background: isChecked ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${isChecked ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
                            color: isChecked ? '#c7d2fe' : 'var(--text-muted)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {isChecked ? '✓ ' : '+ '}{m}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Compute & Stage 3 Navigation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  background: 'rgba(15,23,42,0.7)',
                  border: '1px solid rgba(99,102,241,0.15)',
                  borderRadius: '20px',
                  padding: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <Cpu size={18} color="var(--primary-light)" />
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800 }}>
                    Compute & Cross-Validation
                  </h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>CV FOLDS</label>
                    <input
                      type="number"
                      min={2}
                      max={10}
                      value={cvFolds}
                      onChange={(e) => setCvFolds(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: 'rgba(15,23,42,0.6)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>COMPUTE BUDGET</label>
                    <select
                      value={computeBudget}
                      onChange={(e) => setComputeBudget(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: 'rgba(15,23,42,0.6)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    >
                      <option>Low (Fast ~15s)</option>
                      <option value="Balanced">Balanced (~45s)</option>
                      <option>High (Deep ~120s)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setCurrentStage(2)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: '14px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ← Stage 2: Target
                </button>
                <button
                  type="button"
                  className="np-btn-glow"
                  onClick={() => {
                    setCurrentStage(4)
                    loadHyperparameterSchemas()
                  }}
                  style={{
                    flex: 1.5,
                    padding: '14px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #6366f1, #4338ca)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Stage 4: HPO Workbench →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            STAGE 4: INTERACTIVE HYPERPARAMETER WORKBENCH & TUNING
        ══════════════════════════════════════════════════════════════ */}
        {currentStage === 4 && (
          <div className="np-slide-up" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Tuning Modes: Hybrid, Agent, Manual */}
              <div
                className="np-card"
                style={{
                  background: 'rgba(15,23,42,0.7)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '20px',
                  padding: '24px 28px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <Sliders size={20} color="var(--primary-light)" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Tuning Execution Mode</h3>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
                  Choose whether you want the agent to guide optimization, lock your custom values, or run strictly manual trials.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {[
                    { id: 'hybrid', title: 'Hybrid Mode (Recommended)', desc: 'Lock critical parameters; agents optimize remaining search space.', badge: 'Default' },
                    { id: 'agent', title: 'Agent Mode', desc: 'Autonomous algorithm choice, candidate spaces, and resource budgets.', badge: 'Autonomous' },
                    { id: 'manual', title: 'Manual Mode', desc: 'Execute strictly user-selected candidates and locked parameter grids.', badge: 'User Driven' },
                  ].map((m) => {
                    const isSelected = tuningMode === m.id
                    return (
                      <div
                        key={m.id}
                        onClick={() => setTuningMode(m.id as any)}
                        style={{
                          padding: '14px 16px',
                          borderRadius: '12px',
                          background: isSelected ? 'rgba(99,102,241,0.2)' : 'rgba(15,23,42,0.5)',
                          border: `1px solid ${isSelected ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.06)'}`,
                          cursor: 'pointer',
                          position: 'relative',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: isSelected ? '#fff' : 'var(--text-primary)' }}>
                            {m.title}
                          </span>
                          <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(99,102,241,0.2)', color: 'var(--primary-light)', fontWeight: 700 }}>
                            {m.badge}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
                          {m.desc}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Algorithm Family Portfolio Selection */}
              <div
                className="np-card"
                style={{
                  background: 'rgba(15,23,42,0.7)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '20px',
                  padding: '24px 28px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={17} color="var(--primary-light)" />
                    Algorithm Candidates for Training
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {selectedAlgorithms.length} algorithms selected
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { id: 'random_forest_clf', label: 'Random Forest (Ensemble Trees)' },
                    { id: 'hist_gradient_boosting_clf', label: 'HistGradientBoosting (Fast GBDT)' },
                    { id: 'logistic_regression', label: 'Logistic / Ridge Regression (Linear)' },
                    { id: 'decision_tree_clf', label: 'Decision Tree (Interpretable Baseline)' },
                    { id: 'lightgbm_clf', label: 'LightGBM (Leaf-wise Gradient Boosting)' },
                    { id: 'xgboost_clf', label: 'XGBoost (Extreme Gradient Boosting)' },
                  ].map((alg) => {
                    const isChecked = selectedAlgorithms.includes(alg.id)
                    return (
                      <div
                        key={alg.id}
                        onClick={() => {
                          if (isChecked) {
                            if (selectedAlgorithms.length > 1) {
                              setSelectedAlgorithms(selectedAlgorithms.filter((a) => a !== alg.id))
                            }
                          } else {
                            setSelectedAlgorithms([...selectedAlgorithms, alg.id])
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: isChecked ? 'rgba(99,102,241,0.12)' : 'rgba(15,23,42,0.4)',
                          border: `1px solid ${isChecked ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.06)'}`,
                          cursor: 'pointer',
                        }}
                      >
                        <input type="checkbox" checked={isChecked} readOnly style={{ accentColor: '#6366f1' }} />
                        <span style={{ fontSize: '0.82rem', fontWeight: isChecked ? 700 : 500, color: isChecked ? '#fff' : 'var(--text-secondary)' }}>
                          {alg.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Interactive Parameter Workbench with Locking (Padlock) */}
              <div
                className="np-card"
                style={{
                  background: 'rgba(15,23,42,0.7)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '20px',
                  padding: '24px 28px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <h3 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Lock size={16} color="#fbbf24" />
                      Hyperparameter Space & Parameter Locking
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Lock specific hyperparameters to enforce exact user choices. Unlocked parameters are tuned autonomously via Bayesian Optuna TPESampler.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Parameter controls for Random Forest */}
                  <div style={{ background: 'rgba(15,23,42,0.5)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--primary-light)' }}>Random Forest Estimator</strong>
                      <button
                        type="button"
                        onClick={() => handleValidateAlgorithmParameters('random_forest_clf')}
                        style={{
                          fontSize: '0.7rem',
                          background: 'rgba(99,102,241,0.15)',
                          border: '1px solid rgba(99,102,241,0.3)',
                          color: 'var(--primary-light)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        Validate Parameters
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {/* n_estimators */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '8px' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>n_estimators</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {lockedParameters['random_forest_clf']?.['n_estimators'] !== undefined
                              ? `Locked: ${lockedParameters['random_forest_clf']['n_estimators']}`
                              : 'Auto Search: [50, 200]'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleLockParameter('random_forest_clf', 'n_estimators', 100)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: lockedParameters['random_forest_clf']?.['n_estimators'] !== undefined ? '#fbbf24' : 'var(--text-muted)',
                          }}
                        >
                          {lockedParameters['random_forest_clf']?.['n_estimators'] !== undefined ? <Lock size={16} /> : <Unlock size={16} />}
                        </button>
                      </div>

                      {/* max_depth */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '8px' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>max_depth</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {lockedParameters['random_forest_clf']?.['max_depth'] !== undefined
                              ? `Locked: ${lockedParameters['random_forest_clf']['max_depth']}`
                              : 'Auto Search: [4, 16]'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleLockParameter('random_forest_clf', 'max_depth', 8)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: lockedParameters['random_forest_clf']?.['max_depth'] !== undefined ? '#fbbf24' : 'var(--text-muted)',
                          }}
                        >
                          {lockedParameters['random_forest_clf']?.['max_depth'] !== undefined ? <Lock size={16} /> : <Unlock size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Parameter controls for Gradient Boosting */}
                  <div style={{ background: 'rgba(15,23,42,0.5)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <strong style={{ fontSize: '0.85rem', color: '#34d399' }}>HistGradientBoosting Estimator</strong>
                      <button
                        type="button"
                        onClick={() => handleValidateAlgorithmParameters('hist_gradient_boosting_clf')}
                        style={{
                          fontSize: '0.7rem',
                          background: 'rgba(16,185,129,0.15)',
                          border: '1px solid rgba(16,185,129,0.3)',
                          color: '#34d399',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        Validate Parameters
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {/* learning_rate */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '8px' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>learning_rate</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {lockedParameters['hist_gradient_boosting_clf']?.['learning_rate'] !== undefined
                              ? `Locked: ${lockedParameters['hist_gradient_boosting_clf']['learning_rate']}`
                              : 'Auto Search: [0.01, 0.2]'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleLockParameter('hist_gradient_boosting_clf', 'learning_rate', 0.05)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: lockedParameters['hist_gradient_boosting_clf']?.['learning_rate'] !== undefined ? '#fbbf24' : 'var(--text-muted)',
                          }}
                        >
                          {lockedParameters['hist_gradient_boosting_clf']?.['learning_rate'] !== undefined ? <Lock size={16} /> : <Unlock size={16} />}
                        </button>
                      </div>

                      {/* max_iter */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '8px' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>max_iter</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {lockedParameters['hist_gradient_boosting_clf']?.['max_iter'] !== undefined
                              ? `Locked: ${lockedParameters['hist_gradient_boosting_clf']['max_iter']}`
                              : 'Auto Search: [50, 150]'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleLockParameter('hist_gradient_boosting_clf', 'max_iter', 100)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: lockedParameters['hist_gradient_boosting_clf']?.['max_iter'] !== undefined ? '#fbbf24' : 'var(--text-muted)',
                          }}
                        >
                          {lockedParameters['hist_gradient_boosting_clf']?.['max_iter'] !== undefined ? <Lock size={16} /> : <Unlock size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {validationNote && (
                    <div style={{ fontSize: '0.78rem', color: validationNote.includes('✓') ? '#34d399' : '#f87171' }}>
                      {validationNote}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Search Strategy & Plan Approval Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Search Engine Settings */}
              <div
                style={{
                  background: 'rgba(15,23,42,0.7)',
                  border: '1px solid rgba(99,102,241,0.15)',
                  borderRadius: '20px',
                  padding: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <Brain size={18} color="var(--primary-light)" />
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800 }}>Search Engine & Budget</h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>SEARCH STRATEGY</label>
                    <select
                      value={searchStrategy}
                      onChange={(e) => setSearchStrategy(e.target.value as any)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: 'rgba(15,23,42,0.6)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    >
                      <option value="optuna_tpe">Optuna Bayesian TPESampler (Recommended)</option>
                      <option value="randomized">RandomizedSearchCV (Budget Exploration)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      MAX HPO TRIALS ({hpoBudget} trials)
                    </label>
                    <input
                      type="range"
                      min={5}
                      max={50}
                      step={5}
                      value={hpoBudget}
                      onChange={(e) => setHpoBudget(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#6366f1' }}
                    />
                  </div>
                </div>
              </div>

              {/* Experiment Plan Approval Preview Card */}
              <div
                style={{
                  background: 'rgba(99,102,241,0.06)',
                  border: '1px solid rgba(99,102,241,0.25)',
                  borderRadius: '20px',
                  padding: '24px',
                }}
              >
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.92rem', fontWeight: 800, color: 'var(--primary-light)' }}>
                  📋 Experiment Plan Approval Summary
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Tuning Mode:</span>
                    <strong style={{ color: '#fff' }}>{tuningMode.toUpperCase()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>User Locked Parameters:</span>
                    <strong style={{ color: Object.keys(lockedParameters).length > 0 ? '#fbbf24' : 'var(--text-muted)' }}>
                      {Object.keys(lockedParameters).length > 0 ? `${Object.keys(lockedParameters).length} locked` : 'None (Full search)'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Candidate Algorithms:</span>
                    <strong style={{ color: '#818cf8' }}>{selectedAlgorithms.length} Selected</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Validation Folds:</span>
                    <strong style={{ color: '#34d399' }}>{cvFolds}-fold Stratified CV</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Holdout Test Split:</span>
                    <strong style={{ color: '#34d399' }}>Untouched 20% Holdout</strong>
                  </div>
                </div>

                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                  Execution will generate real measured trials across all folds with zero hardcoded or fabricated scores.
                </div>
              </div>

              {/* Primary CTA: Launch AI Training */}
              <button
                type="button"
                className="np-btn-glow"
                onClick={handleStartAnalysis}
                disabled={isStarting}
                style={{
                  width: '100%',
                  padding: '18px 28px',
                  borderRadius: '16px',
                  background: isStarting
                    ? 'linear-gradient(135deg, rgba(99,102,241,0.6), rgba(67,56,202,0.6))'
                    : 'linear-gradient(135deg, #6366f1 0%, #4338ca 50%, #7c3aed 100%)',
                  color: '#fff',
                  border: 'none',
                  fontSize: '1.05rem',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  cursor: isStarting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 8px 30px rgba(99,102,241,0.45)',
                }}
              >
                {isStarting ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    <span>Launching Multi-Agent Training...</span>
                  </>
                ) : (
                  <>
                    <Play size={20} />
                    <span>Approve Plan & Launch AutoML</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── DATASET PREVIEW TABLE ── */}
        {previewData && (
          <div
            className="np-card np-slide-up"
            style={{
              background: 'rgba(15,23,42,0.7)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(99,102,241,0.15)',
              borderRadius: '20px',
              padding: '24px 28px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 4px 0' }}>
                  📊 Interactive Dataset Preview
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  Showing first {previewData.rows.length} rows of {previewData.total_rows?.toLocaleString() || '—'} total observations
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(15,23,42,0.5)',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <Search size={14} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Filter rows..."
                  value={previewSearch}
                  onChange={(e) => setPreviewSearch(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    outline: 'none',
                    width: '140px',
                  }}
                />
              </div>
            </div>

            <div style={{ overflowX: 'auto', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(15,23,42,0.8)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <th style={{ padding: '11px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, width: '40px' }}>#</th>
                    {previewData.columns.map((col) => (
                      <th
                        key={col}
                        style={{
                          padding: '11px 16px',
                          textAlign: 'left',
                          fontWeight: 700,
                          color: targetColumn === col ? '#818cf8' : 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {col}
                        {targetColumn === col && (
                          <span style={{ marginLeft: '6px', fontSize: '0.64rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(99,102,241,0.25)', color: '#c7d2fe' }}>
                            Target
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows?.slice(0, 30).map((row: any, rIdx: number) => (
                    <tr
                      key={rIdx}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: rIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)',
                        transition: 'background 0.1s',
                      }}
                    >
                      <td style={{ padding: '9px 16px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{rIdx + 1}</td>
                      {previewData.columns.map((col) => (
                        <td key={col} style={{ padding: '9px 16px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row[col] === null || row[col] === undefined
                            ? <em style={{ opacity: 0.4, fontSize: '0.75rem' }}>null</em>
                            : String(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── AI PROJECT PLANNER PROPOSAL MODAL (HUMAN-IN-THE-LOOP) ── */}
        {isProposalModalOpen && aiProposal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              backgroundColor: 'rgba(5, 7, 15, 0.82)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
            }}
          >
            <div
              className="np-card np-slide-up"
              style={{
                width: '100%',
                maxWidth: '740px',
                maxHeight: '90vh',
                overflowY: 'auto',
                background: 'linear-gradient(135deg, rgba(23, 27, 44, 0.98) 0%, rgba(15, 18, 30, 0.98) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                borderRadius: '20px',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(99, 102, 241, 0.15)',
                padding: '32px',
                position: 'relative',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 20px rgba(99,102,241,0.4)',
                    }}
                  >
                    <Sparkles size={22} color="#fff" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                      AI Project Proposal
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                      Human Approval Required &bull; Review AI-recommended strategy before autonomous execution
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsProposalModalOpen(false)}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: 'none',
                    borderRadius: '8px',
                    width: '32px',
                    height: '32px',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Proposal Content */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Project Name Field */}
                <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#818cf8', fontWeight: 700 }}>
                      Proposed Project Name
                    </label>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Editable by user</span>
                  </div>
                  {isEditingProposal ? (
                    <input
                      type="text"
                      value={aiProposal.project_name || ''}
                      onChange={(e) => setAiProposal({ ...aiProposal, project_name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid #6366f1',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '1rem',
                        fontWeight: 600,
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
                      {aiProposal.project_name || 'Autonomous ML Project'}
                    </div>
                  )}
                </div>

                {/* Objective & Business Problem */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, marginBottom: '6px' }}>
                      Objective
                    </div>
                    {isEditingProposal ? (
                      <textarea
                        rows={3}
                        value={aiProposal.objective || ''}
                        onChange={(e) => setAiProposal({ ...aiProposal, objective: e.target.value })}
                        style={{ width: '100%', padding: '8px', background: 'rgba(15,23,42,0.8)', border: '1px solid #6366f1', borderRadius: '6px', color: '#fff', fontSize: '0.82rem' }}
                      />
                    ) : (
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                        {aiProposal.objective || 'Predict key outcomes with maximum accuracy and explainability.'}
                      </p>
                    )}
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, marginBottom: '6px' }}>
                      Business Problem
                    </div>
                    {isEditingProposal ? (
                      <textarea
                        rows={3}
                        value={aiProposal.business_problem || ''}
                        onChange={(e) => setAiProposal({ ...aiProposal, business_problem: e.target.value })}
                        style={{ width: '100%', padding: '8px', background: 'rgba(15,23,42,0.8)', border: '1px solid #6366f1', borderRadius: '6px', color: '#fff', fontSize: '0.82rem' }}
                      />
                    ) : (
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                        {aiProposal.business_problem || 'Optimize downstream business decision making.'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Technical Specs: Target, Task, Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div style={{ background: 'rgba(99,102,241,0.08)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <div style={{ fontSize: '0.7rem', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase' }}>Target Column</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
                      {aiProposal.target_candidate || 'Auto'}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <div style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>ML Task</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginTop: '4px', textTransform: 'capitalize' }}>
                      {aiProposal.task_type || 'Classification'}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(245,158,11,0.08)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <div style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase' }}>Primary Metric</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
                      {aiProposal.primary_metric || 'F1 / ROC-AUC'}
                    </div>
                  </div>
                </div>

                {/* Pipeline Strategy */}
                {aiProposal.recommended_pipeline && aiProposal.recommended_pipeline.length > 0 && (
                  <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, marginBottom: '8px' }}>
                      Recommended Execution Pipeline
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {aiProposal.recommended_pipeline.map((step: string, idx: number) => (
                        <span
                          key={idx}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: 'rgba(99,102,241,0.15)',
                            color: '#c7d2fe',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            border: '1px solid rgba(99,102,241,0.3)',
                          }}
                        >
                          {idx + 1}. {step}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deployment Context */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#94a3b8' }}>
                  <Cpu size={15} color="#818cf8" />
                  <span>Deployment Context: <strong style={{ color: '#e2e8f0' }}>{aiProposal.deployment_context || 'REST API microservice / Docker container'}</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  marginTop: '28px',
                  paddingTop: '20px',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setIsEditingProposal(!isEditingProposal)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '10px',
                      background: isEditingProposal ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#f8fafc',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Sliders size={15} />
                    {isEditingProposal ? 'Done Editing' : 'Edit Plan'}
                  </button>
                  <button
                    onClick={handleRegenerateProposal}
                    disabled={isPlanning}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '10px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#f8fafc',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: isPlanning ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <RefreshCw size={15} className={isPlanning ? 'np-spin-slow' : ''} />
                    {isPlanning ? 'Regenerating...' : 'Regenerate'}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setIsProposalModalOpen(false)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '10px',
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#94a3b8',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApproveProposal}
                    className="np-btn-glow"
                    style={{
                      padding: '11px 24px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)',
                    }}
                  >
                    <CheckCircle2 size={17} />
                    Approve & Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── DUPLICATE DATASET WARNING MODAL ── */}
        {duplicateWarning && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              backgroundColor: 'rgba(5, 7, 15, 0.85)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
            }}
          >
            <div
              className="np-card np-slide-up"
              style={{
                width: '100%',
                maxWidth: '560px',
                background: 'linear-gradient(135deg, rgba(30, 24, 18, 0.98) 0%, rgba(20, 16, 14, 0.98) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '20px',
                padding: '30px',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 35px rgba(245, 158, 11, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: 'rgba(245, 158, 11, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fbbf24',
                  }}
                >
                  <AlertCircle size={26} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#fef3c7' }}>
                    Duplicate Dataset Detected
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#d97706' }}>
                    SHA-256 match found in project storage
                  </p>
                </div>
              </div>

              <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '22px' }}>
                This dataset already exists in this project (SHA-256:{' '}
                <code style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: '4px', color: '#fbbf24' }}>
                  {duplicateWarning.file_hash ? duplicateWarning.file_hash.substring(0, 16) + '...' : 'matched'}
                </code>
                ). What would you like to do?
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={() => {
                    setDuplicateWarning(null)
                    if (createdProjectId) navigate(`/projects/${createdProjectId}`)
                  }}
                  style={{
                    padding: '12px 18px',
                    borderRadius: '10px',
                    background: 'rgba(99, 102, 241, 0.2)',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    color: '#c7d2fe',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  &rarr; Use Existing Dataset &amp; Analysis
                </button>
                <button
                  onClick={handleForceUploadDuplicate}
                  style={{
                    padding: '12px 18px',
                    borderRadius: '10px',
                    background: 'rgba(245, 158, 11, 0.2)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    color: '#fef3c7',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  &rarr; Create New Dataset Version (Force Re-upload)
                </button>
                <button
                  onClick={() => {
                    setDuplicateWarning(null)
                    setFile(null)
                  }}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#94a3b8',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
