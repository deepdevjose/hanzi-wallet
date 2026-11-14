# Hanzi Wallet

Practise Mandarin characters by HSK level. Recall meanings, take a daily challenge, listen to pronunciations, and open a character in the writing studio to practise its strokes.

![Hanzi Wallet writing studio](docs/preview.jpg)

Hanzi Wallet turns the original Hanzi Studio prototype into a typed, offline-capable web application. Its Liquid Glass–inspired interface uses translucent surfaces, a floating mobile tab bar, paper, ink, porcelain-blue and muted seal-red colours, and accessible alternatives for reduced motion and transparency.

## Run locally

Requires Node.js **22.12 or newer**.

```bash
npm ci
npm run dev
```

Open the URL printed by Vite. Everything needed for recognition is bundled; you do not need API keys, a backend, a CDN, or a training step.

```bash
npm test             # model parity, vocabulary coverage, stroke evaluation, persistence and review scheduling
npm run typecheck    # strict TypeScript, including unchecked index access
npm run build        # production bundle and versioned offline service worker
npm run preview      # inspect the production build
```

The application build uses bundled learning resources and does not download an external dictionary. The former 3,500-character toolbar catalogue has been removed. Its optional reference-data generator remains available as `npm run build:dictionary`; it verifies the pinned upstream SHA256 and requires a network connection.

## HSK learning

- **First visit** prepares pronunciation recordings, handwriting resources and welcome artwork, then shows a short ink-written 你好! greeting with English supporting text. A five-language setup starts with your browser language. Choose a fresh start or a 21-question reading orientation, then your character. Completed setup is remembered; interrupted character selection resumes with its placement and chosen language.
- **Character creator** is part of the first setup and remains available in your profile. Start from distinct masculine or feminine 2D cartoon bases, then choose face shape, eyes, brows, nose, mouth, cheek details, hairstyle, hair and eye colours, skin tone, body shape and height. Identity, face, hair and body sections keep the controls manageable; the preview zooms to facial details as you edit. Personal features are free and independent from your optional gender field. A shared articulated SVG system keeps clothing and headwear connected while the character breathes, blinks and waves. Both bases start in a T-shirt with eight free colours; appearance and colour choices are saved with your existing progress. Reduced motion is supported.
- **Wardrobe and shop** include 40 collectible items across eight categories, with 2D hanfu and imperial clothing, frames, companions and achievements. The opaque profile panel preserves the established interface style. The active character direction and retained welcome-art prompts are in [ART_DIRECTION.md](docs/ART_DIRECTION.md).
- **Progression** begins at level 0 and uses an increasing curve up to 90. Practice earns one virtual coin per newly credited XP. The reading orientation gives a one-time starting-level baseline, coins and appropriate gifts; it does not complete lessons or fabricate practice XP. It is an original indicative reading activity, **not an official or validated HSK examination**, and does not assess speaking or listening. Beginners receive 80 starting coins. There are no purchases with real money.

- **Learn** is the first screen after site access. HSK 1 is the default and you can choose another level. Each level shows how many of its newly introduced recognition characters are present in the app. The 500-character handwriting catalogue and personal flashcards are available separately.
- In **Guess the meaning**, type a meaning from memory or reveal choices. Feedback includes pinyin, audio, and selected words and character components. Missed characters appear again once during the same round and are due for a later review. Adaptive rounds prioritise due cards and introduce up to four new ones.
- **Daily challenge** selects five characters from the current level, with a 20 XP bonus once per local calendar day for four first-attempt answers. XP also rewards due or new cards, and completed sessions contribute to a streak. The HSK tabs organize the syllabus; character levels combine the initial orientation baseline with subsequent practice.
- The study path uses [HSK 3.0 recognition characters](https://www.chinesetest.cn/syllabus), not the vocabulary or writing-exam lists. The checked-in mapping intersects the app catalogue with the [recognition list snapshot](https://github.com/ofou/hsk/blob/14d4612ed99766f1385bd49730aabf8a96dc145f/%E6%B1%89%E5%AD%97.csv). The source mirror's [MIT licence](public/data/HSK-MIRROR-LICENSE.txt) is included. Character groups contain up to ten items.
- Recall is based on [retrieval practice](https://pubmed.ncbi.nlm.nih.gov/16507066/) and [spaced second-language practice](https://doi.org/10.1111/lang.12479). The writing handoff follows [character learning research](https://sites.pitt.edu/~perfetti/PDF/Writing%20strengthens%20Guan%20JEP.pdf). Selected shape clues follow research on [components and retention](https://pubmed.ncbi.nlm.nih.gov/30014311/).

The hosted edition uses the existing site access policy. Learning progress and the chosen HSK level stay in browser storage. JSON backups include the wallet, guided-writing history, personal handwriting examples, character inventory, coins, placement and learning progress. Reimporting learning data preserves the maximum earned XP and the latest review schedule instead of adding XP twice.

## What you can do

- Write with a mouse, finger, or pen. Ink defaults to **2.6 CSS pixels**, uses coalesced pointer events, quadratic smoothing, a high-DPI canvas, and preserves drawings on resize.
- Recognize **500 distinct simplified Chinese characters**, with five ranked hypotheses. Select a candidate to inspect its shape, stroke order, and direction.
- Practise against a stroke guide, watch a stroke animation, undo a stroke, and adjust ink width.
- Confirm up to five handwriting examples per character. These local examples supplement geometric recognition and travel with JSON backups.
- Save a personal collection, search by hanzi, pinyin with or without tone marks, meaning, or category.
- Review due cards with a finite session. Answers are revealed before grading; forgetting schedules another review in ten minutes. Successful reviews use increasing intervals.
- Switch between **Español, English, 简体中文, Français and Português**, including interface text and all 500 character glosses. Language changes preserve the current ink.
- Use light, dark, or system appearance; reduce transparency; follow a small daily writing goal.
- Export and import wallet and handwriting data. Existing `hanzi-studio-v2` browser data is migrated where the origin is the same. Across origins/devices, use a JSON export.
- Install as a PWA and return offline **after the initial production load and offline cache installation finish**.

The first visit starts with eight saved characters and zero invented learning progress. Consolidation requires a review interval of at least seven days. The daily goal counts distinct characters that pass guided writing that day.

## Recognition: what changed

The original file trained a 20-class CNN in the browser on a small set of device-rendered font images. The replacement is ready at startup:

1. A pretrained MLP with **three hidden layers (256 → 160 → 96)** reads a normalized 24 × 24 ink representation, stroke-count features, direction histogram, and aspect ratio.
2. A geometric shortlist broadens the neural hypotheses before sequence alignment and dynamic time warping compare stroke trajectories.
3. Confirmed personal examples supplement the geometric comparison. All inference runs in a Web Worker.
4. Assessment separately checks shape, order, direction, missing strokes, and extra strokes. Recognition never treats the selected practice target as the answer.

**This is a bounded learning assistant, not a general Chinese handwriting recognizer.** The bundled model is trained on augmented canonical stroke data, not on a human handwriting corpus. Synthetic validation metrics are in [`public/model/metrics.json`](public/model/metrics.json); they do not establish accuracy on real users. Similarity scores and softmax outputs are uncalibrated. Ambiguous or out-of-vocabulary drawings can still resemble supported characters. Users should compare the candidates.

See [the model card](docs/MODEL_CARD.md), [architecture](docs/ARCHITECTURE.md), and [verification record](docs/VERIFICATION.md).

## Reproduce training

The checked-in model is usable without Python. To retrain it:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r scripts/requirements.txt
node scripts/prepare_data.mjs
OPENBLAS_NUM_THREADS=2 OMP_NUM_THREADS=2 npm run train
npm test
npm run build
```

The script regenerates the model, an independent synthetic augmentation benchmark, and Python/JavaScript numerical parity fixtures. Fixed seeds make the procedure repeatable; exact floating-point results can differ across library and BLAS versions. `.venv` is excluded from Git.

## Deploy

The output is the static `dist/` directory. Relative asset URLs support deployment at a subpath, including GitHub Pages. The repository includes a GitHub Pages workflow. In the repository's **Settings → Pages**, choose **GitHub Actions** as the build source and run the Pages workflow if it is not already configured. No secrets are needed.

`/.openai/hosting.json` is an optional deployment identity for the companion Sites preview; it is not needed for GitHub Pages. Do not copy another project's Site identity when forking.

## Privacy and limits

- Ink, personal examples, collection, learning progress, and history stay in this browser's storage. There is no analytics SDK or remote inference API.
- Normal page and asset requests still reach whichever host serves the application. A complete Mandarin MP3 archive is fetched from the application origin during initial loading, held in memory during the session, and included in the production PWA's versioned offline cache. Pressing Listen decodes and plays the requested syllable through Web Audio; a Mandarin system voice is only an optional fallback. No device-level Chinese language pack is required. If initial downloading fails, playback retries when requested.
- Local storage is not an account or cross-device sync. Private browsing, storage eviction, and device loss can erase it. Export a copy when you need to keep progress.
- If the neural model cannot load, geometric recognition remains available. Initial data loading and Web Worker failures are reported in the interface.
- The code has no production npm dependencies. Training and development dependencies are separate from the shipped application.

## Data and licences

Application code: [MIT](LICENSE). Stroke outlines and medians: [Hanzi Writer Data](https://github.com/chanind/hanzi-writer-data), derived from [Make Me a Hanzi](https://github.com/skishore/makemeahanzi) and Arphic fonts, under the included [Arphic Public License](public/data/ARPHICPL.txt). Data are repackaged and coordinates transformed; original outlines are preserved. See [NOTICE](NOTICE) for the derivative model's distribution terms and attribution.

This is an independent web application. Apple does not sponsor or endorse it.

## Pronunciation assets

All 500 characters map to 391 bundled syllable recordings. Playback uses a native `AudioContext` resumed directly in the button click; no installed Mandarin voice or external TTS endpoint is required. MP3 slices are decoded individually, so playback ends at each clip rather than relying on sprite timers. System speech is retained as an error fallback with `voiceschanged` handling.

Most recordings come from David Fifield's public-domain pinyin archive. Four neutral syllables use separately attributed Wikimedia recordings under CC BY 2.0 FR / CC BY-SA 3.0 US. The neutral `me` clip is an explicitly disclosed phonetic edit of the `men` recording, removing the final nasal; native-speaker listening validation is still needed for that edit. Exact authors, licences, modifications and source metadata are in [`public/audio/ATTRIBUTION.txt`](public/audio/ATTRIBUTION.txt) and `SOURCES.json`.

To reproduce the audio archive, download the source archive linked in the attribution file and run `scripts/prepare_audio.py` with `--archive`, `--commons-metadata public/audio/SOURCES.json`, and a temporary `--work-dir`. Requires FFmpeg and NumPy. Each clip retains its own source licence; the application code remains MIT.

The colour choice is a design interpretation of Chinese writing materials, not a claim that every East Asian user shares one preference. See [design evidence](docs/DESIGN.md).
