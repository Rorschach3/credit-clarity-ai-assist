# llm_parser.py
import os
from dotenv import load_dotenv
import time
import random

load_dotenv()

import google.generativeai as genai

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

def parse_tradeline(text: str) -> str:
    """Parse tradeline text using Google's Gemini API and return JSON string"""
    
    # Check API key first
    if not GEMINI_API_KEY:
        raise Exception("GEMINI_API_KEY not found. Please check your .env file.")
    
    print(f"🔑 API Key loaded: {len(GEMINI_API_KEY)} characters")
    
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        print("✅ Gemini configured")
        
        model_instance = genai.GenerativeModel(model_name="gemini-2.0-flash-lite")
        print("✅ Model instance created")

        prompt = f"""Extract the following fields from this credit report tradeline section. Return the results as a JSON object with exactly these property names and types:
            - creditor_name: string
            - account_number: string
            - account_balance: string
            - created_at: string (ISO date, use today's date if not present)
            - credit_limit: string
            - monthly_payment: string
            - date_opened: string
            - is_negative: boolean (true if this account is negative, otherwise false)
            - account_type: string (must match one of: "credit_card", "loan", "mortgage", "auto_loan", "student_loan", "collection")
            - account_status: string (must match one of: "open", "closed", "in_collection", "charged_off", "disputed")
            - credit_bureau: string (must match one of: "equifax", "transunion", "experian")
            - raw_text: string (the full input text)
            Here is the tradeline text:
            ```
            {text}
            ```
            Return only a JSON object, nothing else."""

        generation_config = genai.GenerationConfig(
            temperature=0.4,
            top_p=0.8,
            max_output_tokens=1000,
        )
        
        safety_settings = [
            {
                "category": "HARM_CATEGORY_HARASSMENT",
                "threshold": "BLOCK_NONE"
            },
            {
                "category": "HARM_CATEGORY_HATE_SPEECH", 
                "threshold": "BLOCK_NONE"
            },
            {
                "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "threshold": "BLOCK_NONE"
            },
            {
                "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                "threshold": "BLOCK_NONE"
            },
        ]

        # Retry logic with exponential backoff
        max_retries = 3
        base_delay = 2
        
        for attempt in range(max_retries):
            try:
                print(f"🤖 Attempting to generate content (attempt {attempt + 1})")
                
                response_text = ""
                response = model_instance.generate_content(
                    contents=prompt,
                    generation_config=generation_config,
                    safety_settings=safety_settings,
                    stream=True
                )
                
                for chunk in response:
                    if chunk.text:
                        response_text += chunk.text
                
                print(f"✅ Generated {len(response_text)} characters")
                
                if not response_text.strip():
                    raise Exception("Empty response from Gemini API")
                
                return response_text.strip()
                
            except Exception as e:
                error_msg = str(e)
                print(f"❌ Error on attempt {attempt + 1}: {error_msg}")
                
                # Check if it's a rate limit error
                if "429" in error_msg or "quota" in error_msg.lower() or "rate" in error_msg.lower():
                    if attempt < max_retries - 1:
                        delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                        print(f"⏳ Rate limit hit. Retrying in {delay:.1f} seconds...")
                        time.sleep(delay)
                        continue
                    else:
                        raise Exception("Rate limit exceeded after multiple retries.")
                else:
                    # Non-rate-limit error, don't retry
                    raise Exception(f"Error generating content: {error_msg}")
        
        raise Exception("Max retries exceeded")
        
    except Exception as e:
        print(f"❌ Configuration error: {e}")
        raise

# Rest of your file stays the same...

def generate(text: str):
    """Standalone function for testing purposes"""
    try:
        result = parse_tradeline(text)
        print(result)
    except Exception as e:
        print(f"Error: {e}")

# Example usage:
if __name__ == "__main__":
    raw_text = """YOUR RAW OCR TEXT HERE"""
    generate(raw_text)