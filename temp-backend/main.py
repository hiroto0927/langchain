import requests
import json

requests.post(
    "https://pkhda454s7dfmazjnren5ux7n40khzom.lambda-url.ap-northeast-1.on.aws",
    data=json.dumps({"message": "Hello, World!"}),
    headers={"Content-Type": "application/json"}
)
