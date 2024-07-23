from langchain_core.messages import HumanMessage, SystemMessage
from langchain_aws.chat_models import ChatBedrock
from langchain.chains.conversation.base import ConversationChain
from langchain.memory import ConversationBufferMemory
from langchain_community.chat_message_histories import DynamoDBChatMessageHistory
import json
from app.request_model import RequestModel

llm = ChatBedrock(
    model_id="anthropic.claude-v2:1",
    model_kwargs={
        "max_tokens": 2000,
        "temperature": 0.8,
    },
    region_name="ap-northeast-1"
)


def chat_conversation(session_id: str, input_text: str) -> str:

    # Historyモジュール (Memoryの内容を外部記憶を使って永続化する)
    history = DynamoDBChatMessageHistory(
        table_name="ChatMessageHistory",
        session_id=session_id,
        primary_key_name="SessionId",
        ttl=604800,  # 1週間
        ttl_key_name="TTL",
    )

    # Memoryモジュール (会話履歴を記憶する)
    memory = ConversationBufferMemory(
        chat_memory=history,
        return_messages=True,
    )

    chain = ConversationChain(llm=llm, verbose=True, memory=memory)

    messages = [
        SystemMessage(
            content="""You are an excellent programmer. Please answer programming questions only. If a question is unclear, please respond with “The question is unclear. Please be specific.” and ask for more details. If there is an error in your previous response, please reexamine the content and provide an accurate response. Please generate your response in Japanese and code it in code blocks."""
        ),
        HumanMessage(
            content=input_text
        ),
    ]

    result = chain.invoke(messages)
    output_text = result.get("response")

    return output_text


def lambda_handler(event, context):

    body = json.loads(event["body"])

    print(body)

    request = RequestModel.model_validate(body)

    print(request.session_id)
    print(request.prompt)

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
