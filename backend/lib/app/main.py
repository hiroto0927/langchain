from fastapi import FastAPI

app = FastAPI()


@app.get("/api/health-check")
def health_check():
    return {"status": "ok"}


@app.get("/api/hello")
def hello():
    return {"message": "Hello World"}
