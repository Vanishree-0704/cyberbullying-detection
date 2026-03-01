# CyberGuard: Cyberbullying Detection & Emotional Protection System

This is a real-time system designed to detect harmful content on social media and provide emotional protection to users.

## 🚀 Features
- **Real-time Toxicity Detection**: Uses BERT (Transformer) to analyze text as you type.
- **Instagram Simulation**: A mock social feed showing how comments are masked.
- **Auto-Masking**: Toxic content is blurred out with a "Protected" badge.
- **Behavioral Intervention**: Tells users why their post might be harmful before they send it.
- **Multi-Category Classification**: Detects Insult, Identity Hate, Threats, Obscenity, and severe toxicity.

## 🛠️ Tech Stack
- **Backend**: Python, FastAPI, HuggingFace Transformers (Toxic-BERT), PyTorch.
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Lucide Icons.

## 📥 Installation

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
python main.py
```
*Note: The ML model (~500MB) will download automatically on the first run.*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🧠 How it Works
1. When a user types in the simulation, a debounced signal is sent to the FastAPI backend.
2. The `unitary/toxic-bert` model processes the text and returns a probability score for different toxicity labels.
3. The frontend immediately updates the "CyberGuard Engine" card to show the analysis.
4. If a user "Simulates a Post" that is toxic, it appears in the feed but is automatically blurred by the Emotional Protection layer.
