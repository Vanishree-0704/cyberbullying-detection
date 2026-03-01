import torch
from transformers import pipeline
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CyberbullyingClassifier:
    def __init__(self):
        self.model_name = "unitary/toxic-bert"
        self.device = 0 if torch.cuda.is_available() else -1
        logger.info(f"Loading model {self.model_name} on {'GPU' if self.device == 0 else 'CPU'}...")
        
        try:
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
            raise e

    def predict(self, text: str):
        if not text.strip():
            return {"is_toxic": False, "score": 0.0, "categories": []}

        results = self.classifier(text)[0]
        
        # categories in toxic-bert: toxic, severe_toxic, obscene, threat, insult, identity_hate
        flagged_categories = [res['label'] for res in results if res['score'] > 0.5]
        max_score = max(res['score'] for res in results)
        
        return {
            "is_toxic": len(flagged_categories) > 0,
            "score": float(max_score),
            "categories": flagged_categories,
            "raw_scores": {res['label']: float(res['score']) for res in results}
        }

# Singleton instance
classifier_service = CyberbullyingClassifier()
