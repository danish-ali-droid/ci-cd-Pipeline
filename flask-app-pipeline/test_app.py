import pytest
from app import app  # Ye aapki main app.py se 'app' object uthaye ga

@pytest.fixture
def client():
    with app.test_client() as client:
        yield client

def test_homepage(client):
    """Check if the homepage returns a 200 status code and correct text"""
    response = client.get('/')
    assert response.status_code == 200
    assert b"Flask App" in response.data
