import time
import asyncio

async def mock_model_rf(input_text: str):
    await asyncio.sleep(0.3)
    return {"model": "Random Forest", "prediction": "aman", "confidence": 0.88}

async def mock_model_svm(input_text: str):
    await asyncio.sleep(0.5)
    return {"model": "Support Vector Machine", "prediction": "bahaya", "confidence": 0.92}

async def run_test():
    input_data = "uji_ancaman_sistem"
    start_time = time.time()
    
    # Pemanggilan async secara bersamaan
    results = await asyncio.gather(
        mock_model_rf(input_data),
        mock_model_svm(input_data)
    )
    
    end_time = time.time()
    duration = end_time - start_time
    
    print(f"Hasil Prediksi: {results}")
    print(f"Total Waktu Eksekusi: {duration:.4f} detik")

if __name__ == "__main__":
    asyncio.run(run_test())