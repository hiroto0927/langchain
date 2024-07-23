from pydantic import BaseModel, Field
import uuid


class RequestModel(BaseModel):
    prompt: str
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
