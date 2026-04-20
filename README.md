# Xero Charm Generator

Internal tool for generating on-brand Xero charm icons using Flora AI.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
```bash
cp .env.example .env.local
```
Edit `.env.local` and add your Flora API key:
```
FLORA_API_KEY=your_key_here
```

### 3. Run locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

### First deploy
```bash
npm install -g vercel
vercel
```

### Set environment variable in Vercel
```bash
vercel env add FLORA_API_KEY
```
Or go to: Vercel Dashboard → Project → Settings → Environment Variables

### Subsequent deploys
```bash
vercel --prod
```

---

## How it works

1. User enters a subject description and selects a colour
2. The app assembles the full v5 master prompt server-side
3. A POST request is sent to Flora AI's API (`will-image-generator-test` technique)
4. The app polls for completion (every 3 seconds, up to 90 seconds)
5. Four generated charm images are returned and displayed
6. User selects their preferred option and downloads it

## Architecture

```
pages/
  index.js          — Frontend UI
  api/
    generate.js     — Server-side API route (holds Flora key, builds prompt, polls)
styles/
  globals.css       — Global styles + Xero colour variables
  Home.module.css   — Page styles
```

## Flora technique
- Slug: `will-image-generator-test`
- Input: `text-prompt` (text)
- Outputs: `image`, `image-2`, `image-3`, `image-4` (4 x imageUrl)
- Cost: 450 credits per run

## Updating the prompt
The master prompt lives in `pages/api/generate.js` in the `buildPrompt()` function.
Colour logic is in `buildColourBlock()`.

## Future improvements
- [ ] Upload reference charm image as style input (requires technique update)
- [ ] Flux LoRA fine-tune for better brand consistency
- [ ] Save/history of generated charms
- [ ] Admin view to manage credit usage
