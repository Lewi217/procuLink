FROM python:3.12-slim

# Install uv from official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Store virtualenv outside of /app so volume mount doesn't shadow it
ENV UV_PROJECT_ENVIRONMENT=/opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app

COPY pyproject.toml uv.lock* ./
RUN uv sync --frozen --no-cache

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8030", "--reload"]
