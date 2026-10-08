import time
import asyncio
from fastapi import FastAPI, Query

app = FastAPI()

async def model_rf(input_text: str):
    """Model A: Random Forest (delay 0.3 detik)"""
    await asyncio.sleep(0.3)
    # Simulasi logika prediksi sederhana berdasarkan panjang teks
    is_danger = len(input_text) % 2 == 0
    return {
        "model": "Random Forest",
        "prediction": "bahaya" if is_danger else "aman",
        "confidence": 0.88
    }

async def model_svm(input_text: str):
    """Model B: Support Vector Machine (delay 0.5 detik)"""
    await asyncio.sleep(0.5)
    is_danger = len(input_text) > 5
    return {
        "model": "Support Vector Machine",
        "prediction": "bahaya" if is_danger else "aman",
        "confidence": 0.92
    }

@app.get("/api/proses_ai")
async def proses_ai(input: str = Query(..., description="Data teks ancaman")):
    start_time = time.time()
    
    # Menjalankan kedua model secara bersamaan (konkuren)
    results = await asyncio.gather(
        model_rf(input),
        model_svm(input)
    )
    
    end_time = time.time()
    duration = round(end_time - start_time, 4)
    
    return {
        "status": "success",
        "duration_seconds": duration,
        "result": list(results)
    }