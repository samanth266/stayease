from __future__ import annotations

from typing import Dict, Generator
from urllib.parse import quote_plus

import pyodbc
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from keyvault import settings


def _parse_adonet_connection_string(connection_string: str) -> Dict[str, str]:
    """Parse a semicolon-delimited ADO.NET connection string into key/value pairs."""
    parsed: Dict[str, str] = {}
    for part in connection_string.split(";"):
        item = part.strip()
        if not item or "=" not in item:
            continue
        key, value = item.split("=", 1)
        parsed[key.strip()] = value.strip()
    return parsed


def _normalize_for_odbc(adonet_values: Dict[str, str]) -> Dict[str, str]:
    """Map common ADO.NET key aliases to ODBC-friendly names."""
    key_mapping = {
        "initial catalog": "Database",
        "database": "Database",
        "user id": "UID",
        "uid": "UID",
        "password": "PWD",
        "pwd": "PWD",
        "connection timeout": "Connection Timeout",
        "connect timeout": "Connection Timeout",
    }

    normalized: Dict[str, str] = {}
    for key, value in adonet_values.items():
        mapped_key = key_mapping.get(key.lower().strip(), key)
        normalized[mapped_key] = value

    has_driver = any(existing_key.lower() == "driver" for existing_key in normalized)
    if not has_driver:
        normalized["Driver"] = _select_sql_server_odbc_driver()

    # ODBC is most reliable with yes/no for security toggles.
    bool_like_keys = {"encrypt", "trustservercertificate"}
    for key in list(normalized.keys()):
        if key.replace(" ", "").lower() in bool_like_keys:
            value = normalized[key].strip().lower()
            if value in {"true", "yes", "1", "mandatory", "strict"}:
                normalized[key] = "yes"
            elif value in {"false", "no", "0", "optional"}:
                normalized[key] = "no"

    return normalized


def _select_sql_server_odbc_driver() -> str:
    """Choose the best available SQL Server ODBC driver for this machine."""
    available_drivers = set(pyodbc.drivers())

    for preferred in (
        "ODBC Driver 18 for SQL Server",
        "ODBC Driver 17 for SQL Server",
        "SQL Server",
    ):
        if preferred in available_drivers:
            return "{" + preferred + "}"

    raise RuntimeError(
        "No SQL Server ODBC driver found. Install 'ODBC Driver 18 for SQL Server'."
    )


def _adonet_to_sqlalchemy_url(connection_string: str) -> str:
    adonet_values = _parse_adonet_connection_string(connection_string)
    if not adonet_values:
        raise ValueError("SQL connection string is empty or invalid.")

    odbc_values = _normalize_for_odbc(adonet_values)
    odbc_connection_string = ";".join(
        f"{key}={value}" for key, value in odbc_values.items()
    )

    return f"mssql+pyodbc:///?odbc_connect={quote_plus(odbc_connection_string)}"


def _create_engine_with_validation() -> Engine:
    raw_connection_string = settings.sql_connection_string
    if not raw_connection_string:
        raise RuntimeError("Missing SQL connection string in settings.sql_connection_string.")

    try:
        engine = create_engine(
            _adonet_to_sqlalchemy_url(raw_connection_string),
            pool_pre_ping=True,
            future=True,
        )

        # Validate connectivity early so startup fails with a clear error.
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return engine
    except (SQLAlchemyError, ValueError, RuntimeError) as exc:
        message = str(exc)
        if "IM002" in message:
            installed = ", ".join(pyodbc.drivers()) or "none"
            message = (
                "ODBC driver configuration issue (IM002). "
                f"Installed drivers: {installed}. "
                "Install 'ODBC Driver 18 for SQL Server' and retry. "
                "Download: https://learn.microsoft.com/sql/connect/odbc/download-odbc-driver-for-sql-server"
            )
        raise RuntimeError(f"Failed to connect to Azure SQL Database: {message}") from exc


engine = _create_engine_with_validation()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that provides a SQLAlchemy session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()