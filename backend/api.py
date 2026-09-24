from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from test_pipeline import run_pipeline


app = FastAPI()

# The Vite development server is a different origin from this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "https://blutrace-frontend.onrender.com",
    ],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/api/dashboard")
def get_dashboard():
    """Run and expose the established investigation pipeline unchanged."""
    return run_pipeline("data/sample_sar.png")
