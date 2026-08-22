from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    mongo_uri: str
    db_name: str = "agent_gateway"

    default_tokens: int = 1000
    default_expiry_days: int = 30

    proxy_timeout_seconds: int = 30

    app_name: str = "AI Agent Marketplace Gateway"
    app_version: str = "0.1.0"

    # Optional manual override for the keep-alive pinger. On Render,
    # RENDER_EXTERNAL_URL is set automatically, so you normally don't
    # need to set this yourself.
    self_url: str | None = None

    # Groq API (OpenAI-compatible /chat/completions) — powers the two
    # ai_agents endpoints: the agent recommender and the project chatbot.
    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-20b"
    groq_base_url: str = "https://api.groq.com/openai/v1"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()