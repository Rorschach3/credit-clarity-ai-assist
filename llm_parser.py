# llm_parser.py
import os
import json
import re
from dotenv import load_dotenv
import time
import random
from datetime import datetime

load_dotenv()

import google.generativeai as genai

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

def clean_json_response(response_text):
    """
    Parse JSON from LLM response that may be wrapped in markdown code blocks
    """
    if not response_text or not response_text.strip():
        raise ValueError("Empty response text")
    
    # Strip markdown code blocks
    if response_text.strip().startswith('```'):
        # Find the JSON content between code blocks
        json_match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', response_text, re.DOTALL)
        if json_match:
            json_content = json_match.group(1).strip()
        else:
            # Fallback: remove first and last lines if they contain ```
            lines = response_text.strip().split('\n')
            if lines[0].startswith('```') and lines[-1].strip() == '```':
                json_content = '\n'.join(lines[1:-1])
            else:
                json_content = response_text.strip()
    else:
        json_content = response_text.strip()
    
    try:
        parsed_data = json.loads(json_content)
        
        # Validate and set default values for required fields
        required_fields = {
            'creditor_name': 'Unknown',
            'account_number': 'Unknown',
            'account_balance': '0',
            'created_at': datetime.now().isoformat(),
            'credit_limit': '0',
            'monthly_payment': '0',
            'date_opened': 'Unknown',
            'is_negative': False,
            'account_type': 'credit_card',
            'account_status': 'open',
            'credit_bureau': 'equifax'
        }
        
        # Fill in missing fields with defaults
        for field, default_value in required_fields.items():
            if field not in parsed_data:
                parsed_data[field] = default_value
        
        # Validate enum fields
        valid_account_types = ['credit_card', 'loan', 'mortgage', 'auto_loan', 'student_loan', 'collection']
        valid_account_statuses = ['open', 'closed', 'in_collection', 'charged_off', 'disputed']
        valid_credit_bureaus = ['equifax', 'transunion', 'experian']
        
        if parsed_data.get('account_type') not in valid_account_types:
            parsed_data['account_type'] = 'credit_card'
        
        if parsed_data.get('account_status') not in valid_account_statuses:
            parsed_data['account_status'] = 'open'
            
        if parsed_data.get('credit_bureau') not in valid_credit_bureaus:
            parsed_data['credit_bureau'] = 'equifax'
        
        return parsed_data
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON decode error: {e}")
        print(f"🔍 Cleaned content: {json_content[:200]}...")
        raise

def parse_tradeline(text):
    """
    Parse tradeline text using Gemini API and return strictly structured JSON, 
    removing any markdown formatting and raw text to prevent 500 errors.
    """
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
            
            CRITICAL: Return ONLY the JSON object without any markdown formatting, code blocks, explanations, or raw text content. Do not include the original text in your response.

            Here is the tradeline text:
            ```
            {text}
            ```"""

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
                print(f"✅ LLM returned: '{response_text[:100]}...'")
                
                if not response_text.strip():
                    raise Exception("Empty response from Gemini API")
                
                # Parse the JSON response
                parsed_json = clean_json_response(response_text)
                print(f"✅ Successfully parsed JSON with {len(parsed_json)} fields")
                
                # CRITICAL: Do not add raw_text to prevent 500 errors
                # Remove any raw text fields that might cause size issues
                if 'raw_text' in parsed_json:
                    del parsed_json['raw_text']
                if 'rawText' in parsed_json:
                    del parsed_json['rawText']
                if 'original_text' in parsed_json:
                    del parsed_json['original_text']
                
                return parsed_json
                
            except json.JSONDecodeError as e:
                print(f"❌ JSON parsing failed on attempt {attempt + 1}: {e}")
                print(f"🔍 Raw response: {response_text[:500]}...")
                
                if attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                    print(f"⏳ Retrying JSON parsing in {delay:.1f} seconds...")
                    time.sleep(delay)
                    continue
                else:
                    # Return fallback data instead of raising exception
                    print("❌ Returning fallback data due to JSON parsing failure")
                    return {
                        'creditor_name': 'Parse Error',
                        'account_number': 'Unknown',
                        'account_balance': '0',
                        'created_at': datetime.now().isoformat(),
                        'credit_limit': '0',
                        'monthly_payment': '0',
                        'date_opened': 'Unknown',
                        'is_negative': False,
                        'account_type': 'credit_card',
                        'account_status': 'open',
                        'credit_bureau': 'equifax',
                        'parse_error': f"JSON parsing failed: {str(e)}"
                    }
                    
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

def generate(text: str):
    """Standalone function for testing purposes"""
    try:
        result = parse_tradeline(text)
        print("✅ Final result:")
        print(json.dumps(result, indent=2))
        return result
    except Exception as e:
        print(f"❌ Error: {e}")
        # Return fallback instead of None to prevent further errors
        return {
            'creditor_name': 'Error',
            'account_number': 'Unknown',
            'account_balance': '0',
            'created_at': datetime.now().isoformat(),
            'credit_limit': '0',
            'monthly_payment': '0',
            'date_opened': 'Unknown',
            'is_negative': False,
            'account_type': 'credit_card',
            'account_status': 'open',
            'credit_bureau': 'equifax',
            'error': str(e)
        }

# Example usage:
if __name__ == "__main__":
    # Test with sample data
    raw_text = """Account Name: Chase Credit Card
    Account Number: **** **** **** 1234
    Balance: $1,250.00
    Credit Limit: $5,000.00
    Status: Open
    Date Opened: 01/2020"""
    
    generate(raw_text)