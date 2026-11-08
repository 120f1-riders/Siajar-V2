import httpx
from fastapi import FastAPI, Request
from fastapi.responses import Response

app = FastAPI()
client = httpx.AsyncClient(base_url="http://127.0.0.1:3000", timeout=180)
HOP = {"host", "content-length", "connection", "transfer-encoding", "content-encoding"}


@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy(path: str, request: Request):
    headers = {k: v for k, v in request.headers.items() if k.lower() not in HOP}
    headers["host"] = request.headers.get("host", "")
    res = await client.request(
        request.method,
        f"/api/{path}",
        params=request.query_params,
        content=await request.body(),
        headers=headers,
    )
    out = Response(content=res.content, status_code=res.status_code)
    for k, v in res.headers.multi_items():
        if k.lower() not in HOP:
            out.headers.append(k, v)
    return out
