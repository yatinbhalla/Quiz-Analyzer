# Quiz Analyzer

Upload a quiz file, answer questions with active recall, then get a detailed AI-powered performance analysis — powered by Google Gemini.

The difference from a regular quiz app: instead of just scoring you, this tells you *why* you got things wrong, *which concepts* you're weak on, and *what to study next*.

We use the following tech stack:
- Google Gemini for performance analysis and recommendations
- TypeScript + React for the interface
- Tailwind CSS for styling

## 🚀 Features

* **File Upload:** Upload any Q&A formatted quiz file — text, CSV, or structured format
* **Active Recall Mode:** Answer from memory before seeing answer options, which strengthens retention far more than passive review
* **Detailed Analysis:** AI-generated breakdown covering overall score, strong areas, weak areas, concept gaps, and what to study next
* **Session History:** Track performance across multiple sessions to measure improvement over time
* **Clean Interface:** Distraction-free quiz experience designed for focused practice

## Setup

```bash
git clone https://github.com/yatinbhalla/Quiz-Analyzer.git
cd Quiz-Analyzer
npm install
echo "GEMINI_API_KEY=your_key_here" > .env.local
npm run dev
```

## Author

Yatin Bhalla
<br>
🛍️ PM & AI builder | Managing retail businesses | PG Product Management @ BITS School of Management
<br>
🔗 [linkedin.com/in/yatin-bhalla-834632238](https://linkedin.com/in/yatin-bhalla-834632238)
