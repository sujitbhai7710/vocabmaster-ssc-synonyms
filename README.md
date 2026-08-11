# 📚 VocabMaster — 600+ SSC Synonyms

A super good-looking, lucrative vocabulary website built from the **600+ Synonyms asked in Previous Years' SSC Exams** PDF.

Each word comes with:

- ✅ **English meaning** (curated from the PDF)
- ✅ **Synonym** (the SSC exam answer)
- ✅ **Bengali meaning** (বাংলা অর্থ) — Bengali translation
- ✅ **Indian-context sentence** — a natural sentence set in Indian daily life (cricket, festivals, Bollywood, Indian names, places, food, etc.)
- ✅ **Audio pronunciation** — one-tap button using the browser's Web Speech API
- ✅ **Mark as mastered** — track your progress (saved in localStorage)
- ✅ **Search** across word, meaning, synonym, Bengali meaning, and sentence
- ✅ **Alphabet filter** — jump to any letter
- ✅ **Dark mode** — auto-detects system preference, manual toggle
- ✅ **Fully responsive** — works great on mobile, tablet, desktop

## 🚀 Live Demo

Deployed via GitHub Actions to GitHub Pages:

```
https://<your-username>.github.io/<your-repo-name>/
```

## 🛠 Tech Stack

- Pure static site — **HTML + CSS + Vanilla JS** (no build step)
- Web Speech API for pronunciation
- localStorage for "mastered" tracking
- GitHub Actions for CI/CD to GitHub Pages

## 📂 Structure

```
.
├── index.html              # Main page
├── styles.css              # All styling
├── app.js                  # Logic (search, filter, pronounce, mark)
├── data.js                 # Vocabulary data (auto-generated)
├── .github/workflows/
│   └── deploy.yml          # GitHub Pages deployment workflow
└── README.md
```

## 🔧 Local Development

Just open `index.html` in your browser. No build step, no dependencies.

```bash
# Or serve locally
python3 -m http.server 8000
# Visit http://localhost:8000
```

## 📊 Data Source

- Original PDF: [PracticeMock — 600+ Synonyms asked in Previous Years' SSC Exams](https://www.practicemock.com/blog/wp-content/uploads/2021/04/600-Synonyms-asked-in-Previous-Years-SSC-Exams_compressed-1-1.pdf)
- Bengali meanings & Indian-context sentences: generated using GLM (z-ai-web-dev-sdk)

## 🎯 Built For

SSC, banking, railway, and government exam aspirants across India and Bangladesh who want a fast, beautiful way to master synonyms — with mother-tongue (Bengali) support and sentences that actually feel familiar.

---

Built with ❤️ for SSC aspirants.
