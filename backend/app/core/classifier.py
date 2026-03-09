try:
    import torch
    from transformers import pipeline
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CyberbullyingClassifier:
    def __init__(self):
        self.model_name = "unitary/toxic-bert"
        self.classifier = None
        
        if not TORCH_AVAILABLE:
            logger.warning("Torch or Transformers not found. Using Mock Classifier.")
            return

        try:
            self.device = 0 if torch.cuda.is_available() else -1
            logger.info(f"Loading model {self.model_name} on {'GPU' if self.device == 0 else 'CPU'}...")
            
            # top_k=None returns all scores, which is better than return_all_scores=True in newer versions
            self.classifier = pipeline(
                "text-classification", 
                model=self.model_name, 
                device=self.device, 
                top_k=None
            )
            logger.info("Model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            # Don't raise, just fall back to mock

    def predict(self, text: str):
        if not text.strip():
            return {"is_toxic": False, "score": 0.0, "categories": []}
        
        # Robust bad-words list for real-time protection (Tamil, Thanglish, English)
        # 🛡️ GLOBAL INTEGRITY DICTIONARY
        forbidden_tamil = [
            "மசுறு", "ஊம்பு", "புண்ட", "ஒக்காளி", "சுண்ணி", "குஞ்சு", 
            "தேவடியா", "நாயே", "பேய்", "பைத்தியம்", "மூதேவி", "சாவ்", 
            "எரும", "பொறுக்கி", "லூசு", "கருமம்", "சனியன்"
        ]
        
        forbidden_thanglish = [
            "mairu", "oombu", "punda", "okkaly", "sunny", "kunju", 
            "thevadia", "naye", "pei", "paithiyam", "moothadevi", "saavu", 
            "eruma", "porukki", "loose", "karumam", "saniyan", "baadu",
            "potta", "kenai", "thunda", "kandravi"
        ]
        
        forbidden_english = [
            "fuck", "shit", "bitch", "bastard", "idiot", "stupid",
            "asshole", "kill", "die", "whore", "slut", "dick", "pussy"
        ]
        
        combined_forbidden = forbidden_tamil + forbidden_thanglish + forbidden_english
        triggered_words = [word for word in combined_forbidden if word.lower() in text.lower()]
        
        if not self.classifier:
            is_toxic = len(triggered_words) > 0
            return {
                "is_toxic": is_toxic,
                "score": 0.98 if is_toxic else 0.02,
                "categories": ["toxic", "insult"] if is_toxic else [],
                "raw_scores": {"toxic": 0.98 if is_toxic else 0.02},
                "triggered_words": triggered_words
            }

        results = self.classifier(text)[0]
        flagged_categories = [res['label'] for res in results if res['score'] > 0.5]
        
        # Overlay our manual lists for Thanglish/Tamil support
        manual_toxic = len(triggered_words) > 0
        is_toxic = len(flagged_categories) > 0 or manual_toxic
        
        max_score = max(res['score'] for res in results)
        if manual_toxic and max_score < 0.9: max_score = 0.98

        return {
            "is_toxic": is_toxic,
            "score": float(max_score),
            "categories": flagged_categories if flagged_categories else (["insult"] if manual_toxic else []),
            "raw_scores": {res['label']: float(res['score']) for res in results},
            "triggered_words": triggered_words
        }

# Singleton instance
classifier_service = CyberbullyingClassifier()
