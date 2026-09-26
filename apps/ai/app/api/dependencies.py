import hmac
import os

from fastapi import Header, HTTPException, status


def require_service_token(
    x_lostlink_service_token: str | None = Header(default=None),
) -> None:
    expected = os.getenv("AI_SERVICE_TOKEN", "replace-me-internal-service-token")
    if x_lostlink_service_token is None or not hmac.compare_digest(
        x_lostlink_service_token.encode(), expected.encode()
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Service authentication required",
        )
