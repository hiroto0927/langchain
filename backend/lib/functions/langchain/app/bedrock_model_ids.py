from enum import Enum


class ModelIds(Enum):
    TITAN_EMBED_TEXT_V1 = "amazon.titan-embed-text-v1"
    TITAN_EMBED_TEXT_V1_2_8K = "amazon.titan-embed-text-v1:2:8k"
    TITAN_TEXT_EXPRESS_V1 = "amazon.titan-text-express-v1"
    TITAN_TEXT_EXPRESS_V1_0_8 = "amazon.titan-text-express-v1:0:8k"
    CLAUDE_INSTANT_V1_2_18K = "anthropic.claude-instant-v1:2:18k"
    CLAUDE_INSTANT_V1 = "anthropic.claude-instant-v1"
    CLAUDE_V2_1_18K = "anthropic.claude-v2:1:18k"
    CLAUDE_V2_1_200K = "anthropic.claude-v2:1:200k"
    CLAUDE_V2_1 = "anthropic.claude-v2:1"
    EMBED_ENGLISH_V3 = "cohere.embed-english-v3"
    EMBED_MULTILINGUAL_V3 = "cohere.embed-multilingual-v3"
