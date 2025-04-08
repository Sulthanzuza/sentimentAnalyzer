from fastapi import FastAPI
from textblob import TextBlob
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://sentiment-analyzer-bpkq.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "AI Engine Running"}

@app.post("/analyze-sentiment/")
def analyze_sentiment(text: str):
    blob = TextBlob(text)
    sentiment = blob.sentiment.polarity
    return {"sentiment": sentiment}
