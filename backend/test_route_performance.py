import os
import sys

from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

import main


def test_routes_endpoint_does_not_reseed_demo_data(monkeypatch):
    def fail_seed(*args, **kwargs):
        raise AssertionError("ensure_demo_routes should not be called on every /routes request")

    monkeypatch.setattr(main, "ensure_demo_routes", fail_seed)

    client = TestClient(main.app)
    response = client.get("/routes/")

    assert response.status_code == 200
