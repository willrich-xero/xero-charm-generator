import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import styles from '../styles/Home.module.css'

const VERSION = 'v0.3'

const CHARMS = [
  { slug: 'alarm-bell', label: 'Alarm bell' },
  { slug: 'battery-low', label: 'Battery low' },
  { slug: 'beach-chair', label: 'Beach chair' },
  { slug: 'broken-chain', label: 'Broken chain' },
  { slug: 'calendar-cross', label: 'Calendar cross' },
  { slug: 'calendar-tick', label: 'Calendar tick' },
  { slug: 'cash-note', label: 'Cash note' },
  { slug: 'chain', label: 'Chain' },
  { slug: 'chart-growth', label: 'Chart growth' },
  { slug: 'chart-pie', label: 'Chart pie' },
  { slug: 'click-hand', label: 'Click hand' },
  { slug: 'clock-melt', label: 'Clock melt' },
  { slug: 'clock', label: 'Clock' },
  { slug: 'cocktail-glass', label: 'Cocktail glass' },
  { slug: 'coconut-drink', label: 'Coconut drink' },
  { slug: 'coffee-mug', label: 'Coffee mug' },
  { slug: 'coins-face', label: 'Coins face' },
  { slug: 'coins', label: 'Coins' },
  { slug: 'flame', label: 'Flame' },
  { slug: 'hourglass', label: 'Hourglass' },
  { slug: 'light-bulb', label: 'Light bulb' },
  { slug: 'lock', label: 'Lock' },
  { slug: 'meter', label: 'Meter' },
  { slug: 'paper-plane', label: 'Paper plane' },
  { slug: 'paperwork', label: 'Paperwork' },
  { slug: 'percent', label: 'Percent' },
  { slug: 'relationship-heart', label: 'Relationship heart' },
  { slug: 'sparkle', label: 'Sparkle' },
  { slug: 'speech-bubbles', label: 'Speech bubbles' },
  { slug: 'stopwatch', label: 'Stopwatch' },
  { slug: 'tax-weight', label: 'Tax weight' },
  { slug: 'thumbs-up', label: 'Thumbs up' },
  { slug: 'tick', label: 'Tick' },
]

const COLOUR_OPTIONS = [
  { id: 'B', label: 'Auto blue', description: 'No Xero palette equivalent (wood, ceramic, concrete…)', swatch: '#4A9FD4', detail: null },
  { id: 'A-gold', label: 'Gold', description: 'Coins, money, stars, premium elements', swatch: '#FDCC08', detail: 'Gold #FDCC08 — use for coins, money, stars, premium elements', option: 'A' },
  { id: 'A-coral', label: 'Coral', description: 'Alerts, emotion, leisure, relationships', swatch: '#FF719B', detail: 'Coral #FF719B — use for alerts, emotion, leisure, relationships', option: 'A' },
  { id: 'A-mint', label: 'Mint', description: 'Success, growth, nature, money notes', swatch: '#6AEAAA', detail: 'Mint #6AEAAA — use for success, growth, nature, money notes', option: 'A' },
  { id: 'C-purple', label: 'Purple', description: 'Creative, magical, percentage', swatch: '#CF89FE', detail: 'Purple #CF89FE', option: 'C' },
  { id: 'C-orange', label: 'Orange', description: 'Fire, energy, urgency only', swatch: '#E99000', detail: 'Orange #E99000 — use only for fire, energy, urgency', option: 'C' },
]

const COLOUR_LABEL_TO_ID = {
  'auto blue': 'B', 'gold': 'A-gold', 'coral': 'A-coral',
  'mint': 'A-mint', 'purple': 'C-purple', 'orange': 'C-orange',
}

const EXAMPLE_SUBJECTS = ['piggy bank', 'alarm clock', 'house', 'rocket ship', 'trophy', 'plant']
const LOADING_MESSAGES = ['Preparing reference image…', 'Starting generation…', 'Generating your charms…', 'Finishing up…']

export default function Home() {
  const [subject, setSubject] = useState('')
  const [enhancedSubject, setEnhancedSubject] = useState('')
  const [selectedColour, setSelectedColour] = useState('B')
  const [recommendedColour, setRecommendedColour] = useState(null)
  const [selectedCharm, setSelectedCharm] = useState(null)
  const [suggestedCharm, setSuggestedCharm] = useState(null)
  const [previewCharm, setPreviewCharm] = useState(null)
  const [charmSearch, setCharmSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [enhancing, setEnhancing] = useState(false)
  const [images, setImages] = useState([])
  const [error, setError] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [lightboxImage, setLightboxImage] = useState(null)
  const [loadingStep, setLoadingStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [fullPrompt, setFullPrompt] = useState(null)
  const [promptExpanded, setPromptExpanded] = useState(false)
  const [enhancePrompt, setEnhancePrompt] = useState(null)
  const [enhancePromptExpanded, setEnhancePromptExpanded] = useState(false)

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') setLightboxImage(null)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const filteredCharms = charmSearch.trim()
    ? CHARMS.filter(c => c.label.toLowerCase().includes(charmSearch.toLowerCase()))
    : CHARMS

  async function handleEnhance() {
    if (!subject.trim()) return
    setEnhancing(true)
    setError(null)
    setSuggestedCharm(null)
    try {
      const res = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject }),
      })
      const data = await res.json()
      if (res.status === 503) throw new Error('Enhance is only available on Xero VPN')
      if (!res.ok) throw new Error(data.error || 'Enhancement failed')
      if (data.enhanced) setEnhancedSubject(data.enhanced)
      if (data.prompt) setEnhancePrompt(data.prompt)
      if (data.colour) {
        const id = COLOUR_LABEL_TO_ID[data.colour.toLowerCase()]
        if (id) { setRecommendedColour(id); setSelectedColour(id) }
      }
      if (data.charm) {
        setSuggestedCharm(data.charm)
        setSelectedCharm(data.charm)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setEnhancing(false)
    }
  }

  async function getCharmImageUrl(slug) {
    // Convert the public charm PNG to a blob URL we can upload to ImageKit
    const res = await fetch(`/charms/${slug}.png`)
    const blob = await res.blob()
    const uploadRes = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'image/png' },
      body: blob,
    })
    if (!uploadRes.ok) throw new Error('Failed to upload reference charm')
    const data = await uploadRes.json()
    return data.url
  }

  async function handleGenerate() {
    const subjectToUse = enhancedSubject || subject
    if (!subjectToUse.trim() || !selectedCharm) return
    setLoading(true)
    setImages([])
    setError(null)
    setSelectedImage(null)
    setFullPrompt(null)
    setPromptExpanded(false)
    setLoadingStep(0)
    setProgress(0)

    try {
      // Step 1 — upload reference image
      setLoadingStep(0)
      const referenceImageUrl = await getCharmImageUrl(selectedCharm)

      // Step 2 — start generation run
      setLoadingStep(1)
      const colourConfig = COLOUR_OPTIONS.find(c => c.id === selectedColour)
      const startRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subjectToUse,
          colourOption: colourConfig.option || colourConfig.id,
          colourDetail: colourConfig.detail,
          referenceImageUrl,
        }),
      })

      const startData = await startRes.json()
      if (!startRes.ok) throw new Error(startData.error || 'Failed to start generation')
      if (startData.prompt) setFullPrompt(startData.prompt)

      const { runId } = startData
      setLoadingStep(2)

      // Step 3 — poll from browser until complete
      let attempts = 0
      const maxAttempts = 80 // 80 x 3s = 4 minutes
      while (attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 3000))
        const pollRes = await fetch(`/api/poll?runId=${runId}`)
        const pollData = await pollRes.json()

        if (pollData.progress) setProgress(pollData.progress)

        if (pollData.status === 'completed') {
          setImages(pollData.images)
          setLoadingStep(3)
          return
        }

        if (pollData.status === 'failed') {
          throw new Error(pollData.error || 'Generation failed')
        }

        attempts++
      }
      throw new Error('Generation timed out — please try again')
    } catch (err) {
      setError(err.message)
    } finally {
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

  const subjectToUse = enhancedSubject || subject
  const canGenerate = subjectToUse.trim() && selectedCharm && !loading

  return (
    <>
      <Head>
        <title>Xero Charm Generator</title>
        <meta name="description" content="Generate on-brand Xero charm icons with AI" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {lightboxImage && (
        <div className={styles.lightbox} onClick={() => setLightboxImage(null)}>
          <button className={styles.lightboxClose} onClick={() => setLightboxImage(null)}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M2 2l16 16M18 2L2 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <img src={lightboxImage} alt="Charm enlarged" className={styles.lightboxImg} onClick={e => e.stopPropagation()} />
          <button className={styles.lightboxDownload} onClick={e => { e.stopPropagation(); handleDownload(lightboxImage) }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v8M5 7l3 3 3-3M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Download
          </button>
        </div>
      )}

      <div className={styles.page}>
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
            <h1 className={styles.heroTitle}>Create a new<br /><em>charm</em></h1>
            <p className={styles.heroSub}>Describe your object, pick a reference charm, and we'll generate four on-brand options.</p>
          </div>

          <div className={styles.formCard}>

            {/* Subject */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>What should the charm represent?</label>
              <div className={styles.subjectRow}>
                <input
                  className={styles.subjectInput}
                  placeholder="e.g. piggy bank, alarm clock, trophy…"
                  value={subject}
                  onChange={e => {
                    setSubject(e.target.value)
                    setEnhancedSubject('')
                    setRecommendedColour(null)
                    setSuggestedCharm(null)
                    setEnhancePrompt(null)
                  }}
                  onKeyDown={e => { if (e.key === 'Enter') handleEnhance() }}
                />
                <button
                  className={styles.enhanceBtn}
                  onClick={handleEnhance}
                  disabled={!subject.trim() || enhancing}
                  title="Let AI expand your description, suggest a colour and pick the closest reference charm"
                >
                  {enhancing ? <span className={styles.spinnerSmall} /> : (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1l1.2 3.8L12 6l-3.8 1.2L7 11l-1.2-3.8L2 6l3.8-1.2L7 1z" fill="currentColor"/>
                    </svg>
                  )}
                  {enhancing ? 'Enhancing…' : 'Enhance'}
                </button>
              </div>

              {enhancedSubject && (
                <div className={styles.enhancedResult}>
                  <div className={styles.enhancedLabel}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 1l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" fill="#3ECCFF"/>
                    </svg>
                    Enhanced description
                  </div>
                  <p className={styles.enhancedText}>{enhancedSubject}</p>
                  <button className={styles.enhancedEdit} onClick={() => { setSubject(enhancedSubject); setEnhancedSubject('') }}>Edit</button>
                </div>
              )}

              {enhancePrompt && (
                <div className={styles.promptSection}>
                  <button className={styles.promptToggle} onClick={() => setEnhancePromptExpanded(p => !p)}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: enhancePromptExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                      <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {enhancePromptExpanded ? 'Hide' : 'View'} prompt sent to Flora
                  </button>
                  {enhancePromptExpanded && <pre className={styles.promptBox}>{enhancePrompt}</pre>}
                </div>
              )}

              <div className={styles.examples}>
                <span className={styles.examplesLabel}>Try:</span>
                {EXAMPLE_SUBJECTS.map(ex => (
                  <button key={ex} className={styles.exampleChip} onClick={() => { setSubject(ex); setEnhancedSubject(''); setRecommendedColour(null); setSuggestedCharm(null) }}>
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            {/* Reference charm gallery */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                Reference charm
                <span className={styles.fieldHint}>
                  {suggestedCharm ? 'AI suggested — click any charm to change' : 'Select the charm most similar in shape to your object'}
                </span>
              </label>

              <input
                className={styles.charmSearch}
                placeholder="Search charms…"
                value={charmSearch}
                onChange={e => setCharmSearch(e.target.value)}
              />

              <div className={styles.charmGalleryWrap}>
                <div className={styles.charmGallery}>
                {filteredCharms.map(charm => (
                  <button
                    key={charm.slug}
                    className={`${styles.charmItem} ${selectedCharm === charm.slug ? styles.charmItemSelected : ''} ${suggestedCharm === charm.slug && selectedCharm === charm.slug ? styles.charmItemSuggested : ''}`}
                    onClick={() => setSelectedCharm(charm.slug)}
                    onMouseEnter={() => setPreviewCharm(charm)}
                    onMouseLeave={() => setPreviewCharm(null)}
                    title={charm.label}
                  >
                    <div className={styles.charmImgWrap}>
                      <img
                        src={`/charms/${charm.slug}.png`}
                        alt={charm.label}
                        className={styles.charmImg}
                      />
                      {suggestedCharm === charm.slug && (
                        <span className={styles.charmSuggestedBadge}>AI pick</span>
                      )}
                    </div>
                    <span className={styles.charmLabel}>{charm.label}</span>
                  </button>
                ))}
                {filteredCharms.length === 0 && (
                  <p className={styles.charmNoResults}>No charms match "{charmSearch}"</p>
                )}
                </div>

              {previewCharm && (
                <div className={styles.charmPreview} onMouseEnter={() => setPreviewCharm(previewCharm)} onMouseLeave={() => setPreviewCharm(null)}>
                  <img
                    src={`/charms/${previewCharm.slug}.png`}
                    alt={previewCharm.label}
                    className={styles.charmPreviewImg}
                  />
                  <p className={styles.charmPreviewName}>{previewCharm.label}</p>
                  {suggestedCharm === previewCharm.slug && (
                    <p className={styles.charmPreviewMeta}>✦ AI suggested match</p>
                  )}
                  {selectedCharm === previewCharm.slug ? (
                    <div className={styles.charmPreviewSelected}>✓ Selected</div>
                  ) : (
                    <button
                      className={styles.charmPreviewSelect}
                      onClick={() => { setSelectedCharm(previewCharm.slug); setPreviewCharm(null) }}
                    >
                      Use this charm
                    </button>
                  )}
                </div>
              )}
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
                      {recommendedColour === opt.id && <span className={styles.recommendedBadge}>Suggested</span>}
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
                <><span className={styles.spinner} />{LOADING_MESSAGES[loadingStep]}</>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5L8 1z" fill="currentColor"/>
                  </svg>
                  Generate charms
                  {!selectedCharm && <span className={styles.btnHint}> — select a reference charm first</span>}
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

            {fullPrompt && (
              <div className={styles.promptSection}>
                <button className={styles.promptToggle} onClick={() => setPromptExpanded(p => !p)}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: promptExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                    <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {promptExpanded ? 'Hide' : 'View'} full prompt sent to Flora
                </button>
                {promptExpanded && <pre className={styles.promptBox}>{fullPrompt}</pre>}
              </div>
            )}
          </div>

          {loading && (
            <div className={styles.loadingSection}>
              <div className={styles.loadingGrid}>
                {[0,1,2,3].map(i => (
                  <div key={i} className={styles.loadingCard}>
                    <div className={styles.loadingPulse} style={{ animationDelay: `${i * 0.15}s` }} />
                  </div>
                ))}
              </div>
              {progress > 0 && (
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                </div>
              )}
              <p className={styles.loadingNote}>
                {progress > 0 ? `${progress}% complete` : 'This usually takes 30–90 seconds'}
              </p>
            </div>
          )}

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
                      <button className={styles.selectBtn} onClick={e => { e.stopPropagation(); setSelectedImage(i) }}>
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
