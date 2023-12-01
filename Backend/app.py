import asyncio
import sys
import json
import uvicorn
from fastapi import Depends, FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import os
from meili_class import Meilisearch


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
KEYFRAME_PATH = os.path.join(BASE_DIR, '..', 'Frontend', 'Frames')
FRONTEND_FOLDER = os.path.join(BASE_DIR, '..', 'Frontend')

json_path = os.path.join(BASE_DIR, '..', 'JSON', 'asr.json')

# Update index cho Meilisearch
print('Connecting to asr meili...')
asr_search_engine = Meilisearch('ASR', 8888)
print(f'Health status: {asr_search_engine.check_health_status()}')
print('Adding index...')
asr_search_engine.insert(json_path)
print('Finished adding!')

app = FastAPI(
    title="ASR_app",
    description="This is the API we are using for demonstration of ASR video searching project",
)

app.mount("/Frontend", StaticFiles(directory=FRONTEND_FOLDER), name="Frontend")

origins = [
    "http://localhost.tiangolo.com",
    "https://localhost.tiangolo.com",
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
   return {"message": "This is ASR API"}


@app.post("/asr_search")
async def asr_search(query: str = Form(...), topk: int = Form(...)):
    asr_results = asr_search_engine.search(query, topk)
    formatted_results = []
    for result in asr_results:
        frame_start = int(result["frame_start"])
        frame_end = int(result["frame_end"])
        batch, video_name = result['video'].split('_')

        
        frame_format = str(frame_start).zfill(6)
        # frame_res: C:/Users/Admin/Documents/ASR_app/Frontend/Videos/L01/L01_V001/000000.jpg
        frame_res = f"{KEYFRAME_PATH}/{batch}/{batch}_{video_name}/{frame_format}.jpg"
        if os.path.exists(frame_res):
            formatted_results.append({
                "video": f"{batch}_{video_name}",
                "frame_start": frame_start
            })
    return formatted_results


@app.get("/json_data/{file_name}")
async def json_data(file_name: str):
    json_path = os.path.join(FRONTEND_FOLDER, "Metadata", file_name)
    
    if not os.path.exists(json_path):
        raise HTTPException(status_code=404, detail="Tệp không tồn tại")
    
    with open(json_path, encoding="utf-8") as json_file:
        json_content = json.load(json_file)
    
    return json_content

from fastapi.responses import FileResponse
@app.get("/image_data/{batch}/{video}/{name}")
async def image_data(batch: str, video: str, name: str):
    
    image_path = f"{KEYFRAME_PATH}/{batch}/{video}/{name}"
    
    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail="Image file not found")
    
    return FileResponse(image_path, media_type="image/jpeg")  



if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=4433, reload=False)
