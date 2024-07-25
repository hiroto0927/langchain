from langchain_aws.chat_models import ChatBedrock
from langchain_core.messages import SystemMessage
from langchain.memory import ConversationBufferWindowMemory
from langchain_community.chat_message_histories import DynamoDBChatMessageHistory
from langchain_core.prompts.chat import MessagesPlaceholder, HumanMessagePromptTemplate
from langchain_core.prompts import ChatPromptTemplate
from langchain.agents import create_openai_tools_agent, AgentExecutor, create_tool_calling_agent
import json
from app.request_model import RequestModel
from app.tools import tools

from langchain.globals import set_debug

set_debug(True)


llm = ChatBedrock(
    model_id="anthropic.claude-v2:1",
    model_kwargs={
        "max_tokens": 2000,
        "temperature": 0.8,
    },
    region_name="ap-northeast-1"
)


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

    prompt = ChatPromptTemplate.from_messages([
        SystemMessage(
            content="あなたは、優秀なアシスタントです。正確な情報を提供し、わからなければツールを適宜活用または、「わからない」と回答してください。"),
        *memory.chat_memory.messages,
        HumanMessagePromptTemplate.from_template(
            input_variables=["input"], template="{input}"
        ),
        MessagesPlaceholder(variable_name='agent_scratchpad')
    ])

    agent = create_tool_calling_agent(llm=llm, tools=tools, prompt=prompt)

    agent_exec = AgentExecutor(
        agent=agent, tools=tools, verbose=True, memory=memory)
    result = agent_exec.invoke(input={"input": input_text})

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
