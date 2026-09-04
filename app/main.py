from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from database import get_db
from cache import get_redis_client
from exceptions import BaseAppException, ValidationError, create_success_response

app = FastAPI(title="ProcuLink API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

# Exception Handlers
@app.exception_handler(BaseAppException)
async def app_exception_handler(request: Request, exc: BaseAppException):
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.to_response_dict()
    )

@app.exception_handler(IntegrityError)
async def sqlalchemy_integrity_error_handler(request: Request, exc: IntegrityError):
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={
            "success": False,
            "data": None,
            "meta": None,
            "error": {
                "code": "CONFLICT",
                "message": "A record with these unique constraints already exists."
            }
        }
    )

@app.get("/")
def read_root():
    return create_success_response(message="Welcome to ProcuLink")

@app.get("/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    # Test DB and Redis
    redis_client = get_redis_client()
    redis_client.ping()
    return create_success_response(message="healthy", data={"project": "ProcuLink API"})

@app.websocket("/ws/notifications")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Message text was: {data}")
    except WebSocketDisconnect:
        print("Client disconnected")

@app.get("/error-test")
def trigger_error():
    raise ValidationError(message="This is a standardized error response", fields={"test_field": "invalid value"})
