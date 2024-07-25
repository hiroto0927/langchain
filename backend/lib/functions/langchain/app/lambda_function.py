from langchain_aws.chat_models import ChatBedrock
from langchain.memory import ConversationBufferWindowMemory
from langchain_community.chat_message_histories import DynamoDBChatMessageHistory
from langchain.agents import AgentExecutor,  create_react_agent
from langchain_community.agent_toolkits.load_tools import load_tools
import json
from app.request_model import RequestModel
from langchain import hub

from langchain.globals import set_debug

set_debug(True)
model = ChatBedrock(
    model_id="anthropic.claude-instant-v1",
    model_kwargs={
        "max_tokens": 2000,
        "temperature": 0.0001,
    },
    region_name="ap-northeast-1"
)
tools = load_tools(["ddg-search"])
prompt = hub.pull("hwchase17/react")


def chat_conversation(session_id: str, input_text: str) -> str:

    history = DynamoDBChatMessageHistory(
        table_name="ChatMessageHistory",
        session_id=session_id,
        primary_key_name="SessionId",
        ttl=604800,  # 1週間
        ttl_key_name="TTL",
    )

    memory = ConversationBufferWindowMemory(
        chat_memory=history,
        return_messages=True,
        k=3
    )

    agent = create_react_agent(model, tools, prompt)

    agent_chain = AgentExecutor(
        agent=agent, tools=tools, verbose=True, handle_parsing_errors=True, memory=memory)
    result = agent_chain.invoke(
        {"input": input_text})

    return result.get("output")


def lambda_handler(event, context):

    body = json.loads(event["body"])

    request = RequestModel.model_validate(body)

    try:
        output_text = chat_conversation(request.session_id, request.prompt)

        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": output_text,
                "session_id": request.session_id,
            }, ensure_ascii=False),
        }
    except Exception as e:
        print(e)
        return {
            "statusCode": 500,
            "body": json.dumps({
                "message": "Internal Server Error",
            }),
        }
