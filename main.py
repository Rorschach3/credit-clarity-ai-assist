# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from llm_parser import parse_tradeline
import json


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TradelineRequest(BaseModel):
    text: str

@app.post("/parse-tradeline")
async def parse_tradeline_endpoint(request: TradelineRequest):
    try:
        print(f"✅ Received request with text length: {len(request.text)}")
        print(f"✅ First 100 chars: {request.text[:100]}")

        print("🔍 Calling parse_tradeline...")
        result = parse_tradeline(request.text)
        print(f"✅ Raw result: {repr(result)}")
        print(f"📊 Response type: {type(result)}")

        if result is None:
            print("❌ LLM returned None")
            raise HTTPException(status_code=500, detail="LLM returned None")

        # Check if result is already a dictionary (which it should be)
        if isinstance(result, dict):
            print(f"✅ Got dictionary with {len(result)} fields")
            return result
        
        # If it's a string, try to parse it as JSON
        if isinstance(result, str) and result.strip():
            try:
                parsed = json.loads(result.strip())
                print(f"✅ Successfully parsed JSON string with {len(parsed)} fields")
                return parsed
            except json.JSONDecodeError as e:
                print(f"❌ JSON decode error: {e}")
                print(f"🔍 Problematic response: {repr(result)}")
                raise HTTPException(status_code=500, detail=f"Invalid JSON response from LLM: {str(e)}")
        
        # If we get here, something unexpected happened
        print(f"❌ Unexpected result type: {type(result)}")
        raise HTTPException(status_code=500, detail=f"Unexpected response type: {type(result)}")

    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing tradeline: {str(e)}")