import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import styles from '../styles/Home.module.css'

const VERSION = 'v0.2'

const COLOUR_OPTIONS = [
  {
    id: 'B',
    label: 'Auto blue',
    description: 'No Xero palette equivalent (wood, ceramic, concrete…)',
    swatch: '#4A9FD4',
    detail: null,
  },
  {
    id: 'A-gold',
    label: 'Gold',
    description: 'Coins, money, stars, premium elements',
    swatch: '#FDCC08',
    detail: 'Gold #FDCC08 — use for coins, money, stars, premium elements',
    option: 'A',
  },
  {
    id: 'A-coral',
    label: 'Coral',
    description: 'Alerts, emotion, leisure, relationships',
    swatch: '#FF719B',
    detail: 'Coral #FF719B — use for alerts, emotion, leisure, relationships',
    option: 'A',
  },
  {
    id: 'A-mint',
    label: 'Mint',
    description: 'Success, growth, nature, money notes',
    swatch: '#6AEAAA',
    detail: 'Mint #6AEAAA — use for success, growth, nature, money notes',
    option: 'A',
  },
  {
    id: 'C-purple',
    label: 'Purple',
    description: 'Creative, magical, percentage',
    swatch: '#CF89FE',
    detail: 'Purple #CF89FE',
    option: 'C',
  },
  {
    id: 'C-orange',
    label: 'Orange',
    description: 'Fire, energy, urgency only',
    swatch: '#E99000',
    detail: 'Orange #E99000 — use only for fire, energy, urgency',
    option: 'C',
  },
]

const COLOUR_LABEL_TO_ID = {
  'auto blue': 'B',
  'gold': 'A-gold',
  'coral': 'A-coral',
  'mint': 'A-mint',
  'purple': 'C-purple',
  'orange': 'C-orange',
}

const EXAMPLE_SUBJECTS = [
  'piggy bank',
  'alarm clock',
  'house',
  'rocket ship',
  'trophy',
  'plant',
]

const LOADING_MESSAGES = [
  'Assembling your charm prompt…',
  'Uploading reference image…',
  'Generating your charms…',
  'Almost there…',
]

export default function Home() {
  const [subject, setSubject] = useState('')
  const [enhancedSubject, setEnhancedSubject] = useState('')
  const [selectedColour, setSelectedColour] = useState('B')
  const [recommendedColour, setRecommendedColour] = useState(null)
  const [referenceFile, setReferenceFile] = useState(null)
  const [referencePreview, setReferencePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [enhancing, setEnhancing] = useState(false)
  const [images, setImages] = useState([])
  const [error, setError] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [lightboxImage, setLightboxImage] = useState(null)
  const [loadingStep, setLoadingStep] = useState(0)
  const [fullPrompt, setFullPrompt] = useState(null)
  const [promptExpanded, setPromptExpanded] = useState(false)
  const fileInputRef = useRef(null)
  const dropRef = useRef(null)

  // Close lightbox on escape
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') setLightboxImage(null)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  function handleFileChange(file) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, WebP)')
      return
    }
    setReferenceFile(file)
    setError(null)
    const reader = new FileReader()
    reader.onload = e => setReferencePreview(e.target.result)
    reader.readAsDataURL(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    dropRef.current?.classList.remove(styles.dropZoneOver)
    handleFileChange(e.dataTransfer.files[0])
  }

  function handleDragOver(e) {
    e.preventDefault()
    dropRef.current?.classList.add(styles.dropZoneOver)
  }

  function handleDragLeave() {
    dropRef.current?.classList.remove(styles.dropZoneOver)
  }

  async function handleEnhance() {
    if (!subject.trim()) return
    setEnhancing(true)
    setError(null)
    try {
      const res = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, mode: 'both' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Enhancement failed')
      if (data.enhanced) setEnhancedSubject(data.enhanced)
      if (data.colour) {
        const id = COLOUR_LABEL_TO_ID[data.colour.toLowerCase()]
        if (id) {
          setRecommendedColour(id)
          setSelectedColour(id)
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setEnhancing(false)
    }
  }

  async function uploadReferenceImage(file) {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to upload reference image')
    }
    const data = await res.json()
    return data.url
  }

  async function handleGenerate() {
    const subjectToUse = enhancedSubject || subject
    if (!subjectToUse.trim() || !referenceFile) return
    setLoading(true)
    setImages([])
    setError(null)
    setSelectedImage(null)
    setFullPrompt(null)
    setPromptExpanded(false)
    setLoadingStep(0)

    const stepInterval = setInterval(() => {
      setLoadingStep(s => Math.min(s + 1, 3))
    }, 7000)

    try {
      const referenceImageUrl = await uploadReferenceImage(referenceFile)
      const colourConfig = COLOUR_OPTIONS.find(c => c.id === selectedColour)

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subjectToUse,
          colourOption: colourConfig.option || colourConfig.id,
          colourDetail: colourConfig.detail,
          referenceImageUrl,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setImages(data.images)
      if (data.prompt) setFullPrompt(data.prompt)
    } catch (err) {
      setError(err.message)
    } finally {
      clearInterval(stepInterval)
      setLoading(false)
    }
  }

  function handleDownload(url) {
    const a = document.createElement('a')
    a.href = url
    a.download = `xero-charm-${Date.now()}.png`
    a.target = '_blank'
    a.click()
  }

  function clearReference() {
    setReferenceFile(null)
    setReferencePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const subjectToUse = enhancedSubject || subject
  const canGenerate = subjectToUse.trim() && referenceFile && !loading

  return (
    <>
      <Head>
        <title>Xero Charm Generator</title>
        <meta name="description" content="Generate on-brand Xero charm icons with AI" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Lightbox */}
      {lightboxImage && (
        <div className={styles.lightbox} onClick={() => setLightboxImage(null)}>
          <button className={styles.lightboxClose} onClick={() => setLightboxImage(null)}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M2 2l16 16M18 2L2 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <img
            src={lightboxImage}
            alt="Charm enlarged"
            className={styles.lightboxImg}
            onClick={e => e.stopPropagation()}
          />
          <button
            className={styles.lightboxDownload}
            onClick={e => { e.stopPropagation(); handleDownload(lightboxImage) }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v8M5 7l3 3 3-3M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Download
          </button>
        </div>
      )}

      <div className={styles.page}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <div className={styles.logo}>
              <svg width="52" height="18" viewBox="0 0 52 18" fill="none">
                <path d="M7.2 0L0 9l7.2 9h5.4L5.4 9 12.6 0H7.2zM14.4 0l7.2 9-7.2 9h5.4L27 9l-7.2-9h-5.4z" fill="#3ECCFF"/>
                <text x="30" y="13" fill="white" fontSize="13" fontFamily="DM Sans" fontWeight="600" letterSpacing="-0.3">xero</text>
              </svg>
            </div>
            <div className={styles.headerRight}>
              <span className={styles.badge}>Charm Generator</span>
              <span className={styles.betaBadge}>Beta {VERSION}</span>
            </div>
          </div>
        </header>

        <main className={styles.main}>
          <div className={styles.hero}>
            <h1 className={styles.heroTitle}>
              Create a new<br />
              <em>charm</em>
            </h1>
            <p className={styles.heroSub}>
              Upload a reference charm, describe your object, and we'll generate four on-brand options.
            </p>
          </div>

          <div className={styles.formCard}>

            {/* Reference image */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                Reference charm
                <span className={styles.fieldHint}>Upload an existing charm similar in shape or colour</span>
              </label>
              {referencePreview ? (
                <div className={styles.referencePreviewWrap}>
                  <img src={referencePreview} alt="Reference charm" className={styles.referencePreview} />
                  <div className={styles.referenceInfo}>
                    <span className={styles.referenceFilename}>{referenceFile.name}</span>
                    <span className={styles.referenceHint}>Used as a visual style reference — the model will not copy this object</span>
                  </div>
                  <button className={styles.clearBtn} onClick={clearReference} title="Remove">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              ) : (
                <div
                  ref={dropRef}
                  className={styles.dropZone}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={styles.uploadIcon}>
                    <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M8 12l4-4 4 4M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className={styles.dropZoneText}>Drop a charm image here</span>
                  <span className={styles.dropZoneSubtext}>or click to browse · PNG, JPG, WebP</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className={styles.hiddenInput}
                    onChange={e => handleFileChange(e.target.files[0])}
                  />
                </div>
              )}
            </div>

            {/* Subject */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                What should the charm represent?
              </label>

              <div className={styles.subjectRow}>
                <input
                  className={styles.subjectInput}
                  placeholder="e.g. piggy bank, alarm clock, trophy…"
                  value={subject}
                  onChange={e => {
                    setSubject(e.target.value)
                    setEnhancedSubject('')
                    setRecommendedColour(null)
                  }}
                  onKeyDown={e => { if (e.key === 'Enter') handleEnhance() }}
                />
                <button
                  className={styles.enhanceBtn}
                  onClick={handleEnhance}
                  disabled={!subject.trim() || enhancing}
                  title="Let AI expand your description and suggest a colour"
                >
                  {enhancing ? (
                    <span className={styles.spinnerSmall} />
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1l1.2 3.8L12 6l-3.8 1.2L7 11l-1.2-3.8L2 6l3.8-1.2L7 1z" fill="currentColor"/>
                    </svg>
                  )}
                  {enhancing ? 'Enhancing…' : 'Enhance'}
                </button>
              </div>

              {/* Enhanced result */}
              {enhancedSubject && (
                <div className={styles.enhancedResult}>
                  <div className={styles.enhancedLabel}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 1l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" fill="#3ECCFF"/>
                    </svg>
                    Enhanced description
                  </div>
                  <p className={styles.enhancedText}>{enhancedSubject}</p>
                  <button
                    className={styles.enhancedEdit}
                    onClick={() => {
                      setSubject(enhancedSubject)
                      setEnhancedSubject('')
                    }}
                  >
                    Edit
                  </button>
                </div>
              )}

              <div className={styles.examples}>
                <span className={styles.examplesLabel}>Try:</span>
                {EXAMPLE_SUBJECTS.map(ex => (
                  <button
                    key={ex}
                    className={styles.exampleChip}
                    onClick={() => {
                      setSubject(ex)
                      setEnhancedSubject('')
                      setRecommendedColour(null)
                    }}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            {/* Colour */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                Colour
                <span className={styles.fieldHint}>
                  {recommendedColour ? 'Recommended based on your description' : 'Choose the most fitting colour for your object'}
                </span>
              </label>
              <div className={styles.colourGrid}>
                {COLOUR_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    className={`${styles.colourOption} ${selectedColour === opt.id ? styles.colourOptionActive : ''} ${recommendedColour === opt.id ? styles.colourOptionRecommended : ''}`}
                    onClick={() => setSelectedColour(opt.id)}
                  >
                    <div className={styles.colourTop}>
                      <span className={styles.colourSwatch} style={{ background: opt.swatch }} />
                      {recommendedColour === opt.id && (
                        <span className={styles.recommendedBadge}>Suggested</span>
                      )}
                    </div>
                    <span className={styles.colourLabel}>{opt.label}</span>
                    <span className={styles.colourDesc}>{opt.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate */}
            <button className={styles.generateBtn} onClick={handleGenerate} disabled={!canGenerate}>
              {loading ? (
                <>
                  <span className={styles.spinner} />
                  {LOADING_MESSAGES[loadingStep]}
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5L8 1z" fill="currentColor"/>
                  </svg>
                  Generate charms
                  {!referenceFile && <span className={styles.btnHint}> — upload a reference first</span>}
                </>
              )}
            </button>

            {error && (
              <div className={styles.error}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="#FF719B" strokeWidth="1.5"/>
                  <path d="M8 5v4M8 11v1" stroke="#FF719B" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            {/* Prompt viewer */}
            {fullPrompt && (
              <div className={styles.promptSection}>
                <button
                  className={styles.promptToggle}
                  onClick={() => setPromptExpanded(p => !p)}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: promptExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                    <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {promptExpanded ? 'Hide' : 'View'} full prompt sent to Flora
                </button>
                {promptExpanded && (
                  <pre className={styles.promptBox}>{fullPrompt}</pre>
                )}
              </div>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className={styles.loadingSection}>
              <div className={styles.loadingGrid}>
                {[0,1,2,3].map(i => (
                  <div key={i} className={styles.loadingCard}>
                    <div className={styles.loadingPulse} style={{ animationDelay: `${i * 0.15}s` }} />
                  </div>
                ))}
              </div>
              <p className={styles.loadingNote}>This usually takes 20–40 seconds</p>
            </div>
          )}

          {/* Results */}
          {images.length > 0 && !loading && (
            <div className={styles.results}>
              <div className={styles.resultsHeader}>
                <h2 className={styles.resultsTitle}>Your charms</h2>
                <p className={styles.resultsSub}>Click to enlarge, select your favourite, then download</p>
              </div>
              <div className={styles.imageGrid}>
                {images.map((url, i) => (
                  <div
                    key={i}
                    className={`${styles.imageCard} ${selectedImage === i ? styles.imageCardSelected : ''}`}
                    onClick={() => setLightboxImage(url)}
                  >
                    <img src={url} alt={`Charm option ${i + 1}`} className={styles.charmImage} />
                    <div className={styles.imageOverlay}>
                      <span className={styles.imageNum}>Option {i + 1}</span>
                      <button
                        className={styles.selectBtn}
                        onClick={e => { e.stopPropagation(); setSelectedImage(i) }}
                      >
                        {selectedImage === i ? '✓ Selected' : 'Select'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.actions}>
                {selectedImage !== null && (
                  <button className={styles.downloadBtn} onClick={() => handleDownload(images[selectedImage])}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 2v8M5 7l3 3 3-3M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Download option {selectedImage + 1}
                  </button>
                )}
                <button className={styles.regenerateBtn} onClick={handleGenerate}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13.5 8A5.5 5.5 0 112.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M2.5 2.5v3h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Regenerate
                </button>
              </div>
            </div>
          )}
        </main>

        <footer className={styles.footer}>
          <p>Xero Charm Generator · Internal tool · Powered by Flora AI</p>
        </footer>
      </div>
    </>
  )
}
