from fastapi import FastAPI
from pydantic import BaseModel
from pydantic import BaseModel, Field
import uuid
from langchain_aws import BedrockLLM
import time

llm = BedrockLLM(
    model_id="anthropic.claude-instant-v1",
    model_kwargs={
        "max_tokens_to_sample": 2000,
        "temperature": 0.8,
    },
    region_name="ap-northeast-1"
)


class Request(BaseModel):
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    prompt: str


class Response(BaseModel):
    session_id: str
    message: str


app = FastAPI()


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    print(f"Process time: {process_time}")
    return response


@app.get("/api/health-check")
def health_check():
    return {"status": "ok!!"}


@app.post("/api/chat")
def chat(request: Request):

    result = llm.invoke(input=request.prompt)
    # response = Response(session_id=request.session_id, message=result.get("response"))

    return result
