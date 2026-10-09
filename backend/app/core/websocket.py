from typing import Dict, List
import logging
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # Maps user_id (str) to a list of active WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        """Accepts a WebSocket connection and registers it for the given user_id."""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        logger.info(f"WebSocket connection established for user: {user_id}")

    def disconnect(self, user_id: str, websocket: WebSocket):
        """Removes a WebSocket connection from the registered user_id."""
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"WebSocket connection closed for user: {user_id}")

    async def send_personal_message(self, message: dict, user_id: str):
        """Sends a JSON message to all active WebSocket connections for a user_id."""
        if user_id in self.active_connections:
            for connection in list(self.active_connections[user_id]):
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.warning(f"Failed to send websocket message to user {user_id}: {e}")
                    self.disconnect(user_id, connection)


manager = ConnectionManager()
