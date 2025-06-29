# llm_parser.py

import os
import json
import re
import logging
from typing import Dict, Any, Optional, List, Union
from dataclasses import dataclass, asdict
from enum import Enum
from datetime import datetime, date
import time
import random
from pathlib import Path

# External dependencies
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class AccountType(Enum):
    """Enumeration of valid account types"""
    CREDIT_CARD = "credit_card"
    LOAN = "loan"
    MORTGAGE = "mortgage"
    AUTO_LOAN = "auto_loan"
    STUDENT_LOAN = "student_loan"
    COLLECTION = "collection"
    INSTALLMENT = "installment"
    REVOLVING = "revolving"
    OTHER = "other"

class AccountStatus(Enum):
    """Enumeration of valid account statuses"""
    OPEN = "open"
    CLOSED = "closed"
    IN_COLLECTION = "in_collection"
    CHARGED_OFF = "charged_off"
    DISPUTED = "disputed"
    PAID = "paid"
    CURRENT = "current"
    DELINQUENT = "delinquent"

class CreditBureau(Enum):
    """Enumeration of valid credit bureaus"""
    EQUIFAX = "equifax"
    TRANSUNION = "transunion"
    EXPERIAN = "experian"
    NULL = ""

@dataclass
class ParsedTradeline:
    """Structured representation of a parsed tradeline"""
    creditor_name: str = ""
    account_number: str = ""
    account_balance: str = "$0"
    created_at: str = ""
    credit_limit: str = "$0"
    monthly_payment: str = "$0"
    date_opened: str = "Unknown"
    is_negative: bool = False
    account_type: str = AccountType.CREDIT_CARD.value
    account_status: str = AccountStatus.OPEN.value
    credit_bureau: str = CreditBureau.NULL.value
    user_id: str = "" # Added user_id with a blank default
    
    # def __post_init__(self):
    #     if self.parse_warnings is None:
    #         self.parse_warnings = []
    #     if not self.created_at:
    #         self.created_at = datetime.now().isoformat()

@dataclass
class ParserConfig:
    """Configuration for the LLM parser"""
    api_key: Optional[str] = None  # Can be set via environment variable
    model_name: str = "gemini-2.5-flash"
    temperature: float = 0.2
    top_p: float = 0.8
    max_output_tokens: int = 2048
    max_retries: int = 3
    base_delay: float = 2.0
    timeout: int = 300
    validate_output: bool = True
    fallback_enabled: bool = True
    debug_mode: bool = False

class LLMParserError(Exception):
    """Custom exception for LLM parser errors"""
    pass

class TradelineParser:
    """Enhanced tradeline parser with multiple LLM support"""
    
    def __init__(self, config: Optional[ParserConfig] = None):
        self.config = config or ParserConfig()
        self._setup_api()
        self._setup_model()
        
    def _setup_api(self):
        """Setup API configuration"""
        api_key = self.config.api_key or os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise LLMParserError("GEMINI_API_KEY not found. Please check your .env file.")
        
        self.api_key = api_key
        
        try:
            genai.configure(api_key=api_key)
            logger.info("Gemini API configured successfully")
        except Exception as e:
            raise LLMParserError(f"Failed to configure Gemini API: {e}")
    
    def _setup_model(self):
        """Setup the generative model"""
        try:
            self.model = genai.GenerativeModel(model_name=self.config.model_name)
            logger.info(f"Model '{self.config.model_name}' initialized successfully")
        except Exception as e:
            raise LLMParserError(f"Failed to initialize model: {e}")
    
    def _get_generation_config(self) -> genai.GenerationConfig:
        """Get generation configuration"""
        return genai.GenerationConfig(
            temperature=self.config.temperature,
            top_p=self.config.top_p,
            max_output_tokens=self.config.max_output_tokens,
        )
    
    def _get_safety_settings(self) -> List[Dict[str, str]]:
        """Get safety settings for content generation"""
        return [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
        ]
    
    def _create_enhanced_prompt(self, text: str) -> str:
        """Create an enhanced prompt for better extraction"""
        account_types = [e.value for e in AccountType]
        account_statuses = [e.value for e in AccountStatus]
        credit_bureaus = [e.value for e in CreditBureau]
        
        prompt = f"""You are a data extraction agent. Parse the following credit report text and return one JSON object containing these fields:

            - creditor_name (string)
            - account_number (string)
            - account_balance (string with $)
            - credit_limit (string with $)
            - monthly_payment (string with $)
            - account_status (string: open, closed, etc.)
            - account_type (string)
            - date_opened (MM/DD/YYYY or "Unknown")
            - credit_bureau (equifax, experian, transunion, or "")
            - is_negative (boolean)

            EXTRACTION RULES:
            0. If a field is not found, return an empty string ("") or false where appropriate. Return **only JSON**. Do not include explanations.
            1. Use empty strings for missing text fields
            2. Infer account_type from context (e.g., "Chase Credit Card" → "credit_card")
            3. Determine is_negative from keywords like: collection, charge-off, delinquent, past due
            4. Use the first valid date found for date_opened, format as MM/DD/YYYY
            5. Return ONLY the JSON object - no additional text

TRADELINE TEXT:
{text}"""
        
        return prompt
    
    def _clean_json_response(self, response_text: str) -> Dict[str, Any]:
        """Parse and clean JSON response from LLM"""
        if not response_text or not response_text.strip():
            raise ValueError("Empty response text")
        
        # Remove markdown code blocks
        json_content = response_text.strip()
        if json_content.startswith('```'):
            json_match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', json_content, re.DOTALL)
            if json_match:
                json_content = json_match.group(1).strip()
            else:
                lines = json_content.split('\n')
                if lines[0].startswith('```') and lines[-1].strip() == '```':
                    json_content = '\n'.join(lines[1:-1])
        
        # Remove any trailing text after JSON
        json_end = json_content.rfind('}')
        if json_end != -1:
            json_content = json_content[:json_end + 1]
        
        try:
            parsed_data = json.loads(json_content)
            return self._validate_and_sanitize(parsed_data)
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e}")
            logger.debug(f"Problematic content: {json_content[:500]}...")
            raise
    
    def _validate_and_sanitize(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and sanitize parsed data"""
        warnings = []
        
        # Ensure all required fields exist
        tradeline = ParsedTradeline()
        default_dict = asdict(tradeline)
        
        for field, default_value in default_dict.items():
            if field not in data:
                data[field] = default_value
                warnings.append(f"Missing field '{field}', using default: {default_value}")
        
        # Validate enums
        valid_account_types = [e.value for e in AccountType]
        if data.get('account_type') not in valid_account_types:
            warnings.append(f"Invalid account_type: {data.get('account_type')}")
            data['account_type'] = AccountType.CREDIT_CARD.value
        
        valid_account_statuses = [e.value for e in AccountStatus]
        if data.get('account_status') not in valid_account_statuses:
            warnings.append(f"Invalid account_status: {data.get('account_status')}")
            data['account_status'] = AccountStatus.OPEN.value
        
        valid_credit_bureaus = [e.value for e in CreditBureau]
        if data.get('credit_bureau') not in valid_credit_bureaus:
            warnings.append(f"Invalid credit_bureau: {data.get('credit_bureau')}")
            data['credit_bureau'] = CreditBureau.NULL.value

        # Validate monetary formats
        for field in ['account_balance', 'credit_limit', 'monthly_payment']:
            value = data.get(field, '$0')
            if not isinstance(value, str) or not re.match(r'^\$[\d,]*\.?\d*$', value.replace(' ', '')):
                warnings.append(f"Invalid monetary format for {field}: {value}")
                data[field] = '$0'
        
        # Validate boolean fields
        if not isinstance(data.get('is_negative'), bool):
            data['is_negative'] = False
            warnings.append("Invalid is_negative value, defaulting to False")
        
        # Remove any unwanted fields that might cause issues
        unwanted_fields = ['raw_text', 'original_text', 'source_text', 'confidence_score']
        for field in unwanted_fields:
            if field in data:
                del data[field]
                warnings.append(f"Removed unwanted field: {field}")
        
        # Add warnings to the data
        if warnings and self.config.validate_output:
            data['parse_warnings'] = warnings
        
        return data
    
    def _generate_fallback_data(self, error_msg: str = "") -> Dict[str, Any]:
        """Generate fallback data when parsing fails"""
        logger.warning("Generating fallback data due to parsing failure")
        
        fallback = asdict(ParsedTradeline())
        if error_msg:
            fallback['parse_error'] = error_msg
        
        return fallback
    
    def parse_tradeline(self, text: str) -> Dict[str, Any]:
        """Parse tradeline text using LLM with enhanced error handling"""
        if not text or not text.strip():
            raise LLMParserError("Empty input text provided")
        
        logger.info(f"Processing tradeline text: {len(text)} characters")
        
        prompt = self._create_enhanced_prompt(text)
        generation_config = self._get_generation_config()
        safety_settings = self._get_safety_settings()
        
        for attempt in range(self.config.max_retries):
            try:
                logger.info(f"Generation attempt {attempt + 1}/{self.config.max_retries}")
                
                response_text = ""
                response = self.model.generate_content(
                    contents=prompt,
                    generation_config=generation_config,
                    safety_settings=safety_settings,
                    stream=True
                )
                
                for chunk in response:
                    if chunk.text:
                        response_text += chunk.text
                
                logger.info(f"Generated {len(response_text)} characters")
                if self.config.debug_mode:
                    logger.debug(f"Raw response: {response_text[:200]}...")
                
                if not response_text.strip():
                    raise LLMParserError("Empty response from model")
                
                # Parse and validate the response
                parsed_data = self._clean_json_response(response_text)
                logger.info("Successfully parsed tradeline")
                
                return parsed_data
                
            except json.JSONDecodeError as e:
                logger.error(f"JSON parsing failed on attempt {attempt + 1}: {e}")
                
                if attempt < self.config.max_retries - 1:
                    delay = self._calculate_backoff_delay(attempt)
                    logger.info(f"Retrying in {delay:.1f} seconds...")
                    time.sleep(delay)
                else:
                    if self.config.fallback_enabled:
                        return self._generate_fallback_data(f"JSON parsing failed: {str(e)}")
                    else:
                        raise LLMParserError(f"JSON parsing failed after {self.config.max_retries} attempts: {e}")
            
            except Exception as e:
                error_msg = str(e)
                logger.error(f"Error on attempt {attempt + 1}: {error_msg}")
                
                # Handle rate limiting
                if any(keyword in error_msg.lower() for keyword in ["429", "quota", "rate limit"]):
                    if attempt < self.config.max_retries - 1:
                        delay = self._calculate_backoff_delay(attempt, rate_limited=True)
                        logger.warning(f"Rate limit hit. Retrying in {delay:.1f} seconds...")
                        time.sleep(delay)
                        continue
                    else:
                        raise LLMParserError("Rate limit exceeded after multiple retries")
                else:
                    # Non-recoverable error
                    if self.config.fallback_enabled:
                        return self._generate_fallback_data(f"Generation error: {error_msg}")
                    else:
                        raise LLMParserError(f"Content generation failed: {error_msg}")
        
        raise LLMParserError("Maximum retry attempts exceeded")
    
    def _calculate_backoff_delay(self, attempt: int, rate_limited: bool = False) -> float:
        """Calculate exponential backoff delay"""
        base = self.config.base_delay * 2 if rate_limited else self.config.base_delay
        delay = base * (2 ** attempt) + random.uniform(0, 1)
        return min(delay, 60)  # Cap at 60 seconds
    
    def parse_multiple_tradelines(self, texts: List[str]) -> List[Dict[str, Any]]:
        """Parse multiple tradelines with batch processing"""
        results = []
        
        for i, text in enumerate(texts):
            logger.info(f"Processing tradeline {i + 1}/{len(texts)}")
            try:
                result = self.parse_tradeline(text)
                results.append(result)
            except Exception as e:
                logger.error(f"Failed to parse tradeline {i + 1}: {e}")
                if self.config.fallback_enabled:
                    results.append(self._generate_fallback_data(str(e)))
                else:
                    results.append(None)
        
        return results

# Convenience functions for backward compatibility
def create_parser(config: Optional[ParserConfig] = None) -> TradelineParser:
    """Create a new parser instance"""
    return TradelineParser(config)

def parse_tradeline(text: str, config: Optional[ParserConfig] = None) -> Dict[str, Any]:
    """Parse a single tradeline"""
    parser = create_parser(config)
    return parser.parse_tradeline(text)

def generate(text: str) -> Dict[str, Any]:
    """Legacy function for backward compatibility"""
    try:
        return parse_tradeline(text)
    except Exception as e:
        logger.error(f"Parse error: {e}")
        parser = TradelineParser()
        return parser._generate_fallback_data(str(e))

# Example usage and testing
# Example usage and testing code has been moved to a separate test file (e.g., test_llm_parser.py) for better maintainability.