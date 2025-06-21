# main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from llm_parser import parse_tradeline
import json

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or set your frontend URL here
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TradelineRequest(BaseModel):
    text: str

@app.post("/parse-tradeline")
def parse_tradeline_endpoint(req: TradelineRequest):
        print(f"✅ Received request with text length: {len(req.text)}")
        print(f"✅ First 100 chars: {req.text[:100]}")
        
        try:
            print("🔍 calling parse_tradeline...")
            result_json_str = parse_tradeline(req.text)
            print(f"✅ LLM returned: {repr(result_json_str)}")
            print(f"📊 Response type: {type(result_json_str)}")
        
            if result_json_str is None:
                print("❌ LLM returned None")
                raise HTTPException(status_code=500, detail="LLM returned None")
            
            if not result_json_str.strip():
                print("❌ LLM returned empty string")
                raise HTTPException(status_code=500, detail="LLM returned empty response")
            
            # Try to parse JSON
            result = json.loads(result_json_str.strip())
            print("✅ Successfully parsed JSON")
            return result
            
        except json.JSONDecodeError as e:
            print(f"❌ JSON decode error: {e}")
            print(f"🔍 Problematic response: {repr(result_json_str)}")
            raise HTTPException(status_code=500, detail=f"Invalid JSON response from LLM: {str(e)}")
        except Exception as e:
            print(f"❌ Error in parse_tradeline: {e}")
            print(f"🔍 Full traceback:")
            traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))