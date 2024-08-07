from langchain_community.document_loaders import WebBaseLoader
from langchain_community.tools import DuckDuckGoSearchRun, Tool


def web_page_reader(url: str) -> str:
    loader = WebBaseLoader(url)
    content = loader.load()[0].page_content
    return content


search = DuckDuckGoSearchRun()

tools = [
    Tool(
        name="duckduckgo-search",
        func=search.run,
        description="このツールはWeb上の最新情報を検索します。引数で検索キーワードを受け取ります。最新情報が必要な場合のみ利用してください。",
    ),
    Tool(
        name="WebBaseLoader",
        func=web_page_reader,
        description="このツールは引数でURLを渡された場合に内容をテキストで返却します。引数にはURLの文字列のみを受け付けます。URLを渡された場合のみ利用してください。"
    ),
]
