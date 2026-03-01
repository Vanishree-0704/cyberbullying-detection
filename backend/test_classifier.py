import sys
import os
# Add backend to path so we can import app
sys.path.append(os.getcwd())

try:
    from app.core.classifier import classifier_service
    print("Model loaded successfully.")
    
    text = "Hello world, this is a test."
    print(f"Predicting for: '{text}'")
    res = classifier_service.predict(text)
    print("Result:", res)
    
    text_toxic = "I hate you, you are stupid."
    print(f"Predicting for: '{text_toxic}'")
    res_toxic = classifier_service.predict(text_toxic)
    print("Result:", res_toxic)
except Exception as e:
    print("Classifier failed!")
    print("Error:", str(e))
