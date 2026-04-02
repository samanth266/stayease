import os
import warnings
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
from azure.core.exceptions import AzureError

DEFAULT_KEY_VAULT_URL = "https://stayease-vault.vault.azure.net/"
KEY_VAULT_URL = os.environ.get("KEY_VAULT_URL", DEFAULT_KEY_VAULT_URL)

SECRET_NAMES = {
    "sql_connection_string": "SQL-CONNECTION-STRING",
    "jwt_secret_key": "JWT-SECRET-KEY",
    "blob_account_name": "BLOB-ACCOUNT-NAME",
}

ENV_VAR_NAMES = {
    "sql_connection_string": "SQL_CONNECTION_STRING",
    "jwt_secret_key": "JWT_SECRET_KEY",
    "blob_account_name": "BLOB_ACCOUNT_NAME",
}


class Settings:
    def __init__(self, sql_connection_string: str, jwt_secret_key: str, blob_account_name: str):
        self.sql_connection_string = sql_connection_string
        self.jwt_secret_key = jwt_secret_key
        self.blob_account_name = blob_account_name


def _load_from_key_vault() -> Settings:
    credential = DefaultAzureCredential()
    client = SecretClient(vault_url=KEY_VAULT_URL, credential=credential)
    values = {}
    for attr, secret_name in SECRET_NAMES.items():
        values[attr] = client.get_secret(secret_name).value
    return Settings(**values)


def _load_from_env() -> Settings:
    values = {}
    for attr, env_var in ENV_VAR_NAMES.items():
        value = os.environ.get(env_var)
        if not value:
            warnings.warn(
                f"[StayEase] Environment variable '{env_var}' is not set or empty.",
                stacklevel=2,
            )
            value = ""
        values[attr] = value
    return Settings(**values)


def load_settings() -> Settings:
    try:
        loaded_settings = _load_from_key_vault()
        print(f"[StayEase] Configuration loaded from Azure Key Vault ({KEY_VAULT_URL})")
        return loaded_settings
    except AzureError as exc:
        print(
            f"[StayEase] Azure Key Vault unreachable ({type(exc).__name__}). "
            "Falling back to local environment variables."
        )
        loaded_settings = _load_from_env()
        print("[StayEase] Configuration loaded from local environment variables.")
        return loaded_settings


settings = load_settings()
