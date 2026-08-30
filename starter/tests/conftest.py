import pytest

from app import CURRENT, app as flask_app


@pytest.fixture
def client():
    flask_app.config["TESTING"] = True
    CURRENT["puzzle"] = None
    CURRENT["solution"] = None

    with flask_app.test_client() as test_client:
        yield test_client

    CURRENT["puzzle"] = None
    CURRENT["solution"] = None
