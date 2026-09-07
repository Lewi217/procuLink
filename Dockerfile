FROM python:3.11-slim

WORKDIR /app

COPY pyproject.toml uv.lock* ./
RUN pip install uv && uv sync --frozen --no-cache

COPY . .

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8030", "--reload"]
