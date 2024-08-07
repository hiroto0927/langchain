from langchain_community.tools import DuckDuckGoSearchRun, Tool
from langchain_community.document_loaders import WebBaseLoader
from langchain.agents.agent import AgentExecutor
from langchain.memory import ConversationBufferWindowMemory
from fastapi import FastAPI
from pydantic import BaseModel, Field
from langchain_aws.chat_models import ChatBedrock
import uuid
from langchain_community.chat_message_histories import DynamoDBChatMessageHistory
import time
from langchain.agents.structured_chat.base import create_structured_chat_agent
from app.prompt import prompt as template_prompt


def web_page_reader(url: str) -> str:
    loader = WebBaseLoader(url)
    content = loader.load()[0].page_content
    return content


search = DuckDuckGoSearchRun()

tools = [
    Tool(
        name="duckduckgo-search",
        func=search.run,
        description="useful for when you need to search for latest information in web",
    ),
    Tool(
        name="WebBaseLoader",
        func=web_page_reader,
        description="このツールは引数でURLを渡された場合に内容をテキストで返却します。引数にはURLの文字列のみを受け付けます。URLを渡された場合のみ利用してください。"
    ),
]


llm = ChatBedrock(
    model_id="anthropic.claude-3-haiku-20240307-v1:0",
    model_kwargs={
        "max_tokens": 2000,
        "temperature": 0.001,
    },
    region_name="ap-northeast-1",
    # streaming=True
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

    output_text = chat_conversation(request.session_id, request.prompt)

    return Response(session_id=request.session_id, message=output_text)


def chat_conversation(session_id: str, input_text: str) -> str:

    history = DynamoDBChatMessageHistory(
        table_name="ChatMessageHistory",
        session_id=session_id,
        primary_key_name="SessionId",
        ttl=604800,  # 1週間
        ttl_key_name="TTL",
    )

    memory = ConversationBufferWindowMemory(
        memory_key="chat_history",
        chat_memory=history,
        return_messages=True,
        k=5
    )

    prompt = template_prompt

    if memory.chat_memory.messages:
        prompt = prompt.partial(chat_history=memory.chat_memory.messages)

    agent = create_structured_chat_agent(llm, tools, prompt)

    agent_exec = AgentExecutor(
        agent=agent, tools=tools, return_intermediate_steps=True, memory=memory, handle_parsing_errors=True)

    result = agent_exec.invoke(
        {"input": input_text, "chat_history": memory.chat_memory.messages})

    return result.get("output")
