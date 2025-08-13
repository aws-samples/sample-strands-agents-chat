import logging

import uvicorn
from fastapi import FastAPI, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import PARAMETER
from routers import chat, file, streaming

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def handler(request: Request, exc: RequestValidationError):
    logging.error(f"request: {request}")
    logging.error(f"exc: {exc}")
    return JSONResponse(content={}, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)


@app.get("/api/")
async def healthcheck_api():
    return Response(status_code=status.HTTP_200_OK)


@app.get("/api/parameter")
async def parameter():
    return {
        "models": PARAMETER["models"],
        "webSearch": PARAMETER["tavilyApiKeySecretArn"] is not None,
    }


# Include routers
app.include_router(chat.router)
app.include_router(file.router)
app.include_router(streaming.router)


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    uvicorn.run(app, host="0.0.0.0", port=8080)
