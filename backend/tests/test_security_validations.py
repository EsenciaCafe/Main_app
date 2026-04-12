import os
from datetime import datetime, timedelta, timezone

import jwt
import pytest
import requests


BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL')
JWT_SECRET = os.environ.get('JWT_SECRET')
DEMO_CUSTOMER_EMAIL = os.environ.get('DEMO_CUSTOMER_EMAIL', 'cliente@test.com')
DEMO_CUSTOMER_PASSWORD = os.environ.get('DEMO_CUSTOMER_PASSWORD', 'test123')
DEMO_ADMIN_EMAIL = os.environ.get('DEMO_ADMIN_EMAIL', 'admin@esencia.com')
DEMO_ADMIN_PASSWORD = os.environ.get('DEMO_ADMIN_PASSWORD', 'admin123')

if not BASE_URL:
    pytest.fail('EXPO_PUBLIC_BACKEND_URL not set')

BASE_URL = BASE_URL.rstrip('/')


def login(email: str, password: str) -> dict:
    response = requests.post(
        f'{BASE_URL}/api/auth/login',
        json={'email': email, 'password': password},
        headers={'Content-Type': 'application/json'},
        timeout=10,
    )
    assert response.status_code == 200, response.text
    return response.json()


def test_auth_me_rejects_expired_token():
    if not JWT_SECRET:
        pytest.skip('JWT_SECRET not available')

    auth_data = login(DEMO_CUSTOMER_EMAIL, DEMO_CUSTOMER_PASSWORD)
    payload = jwt.decode(
        auth_data['token'],
        JWT_SECRET,
        algorithms=['HS256'],
        options={'verify_exp': False},
    )
    expired_token = jwt.encode(
        {
            'user_id': payload['user_id'],
            'role': payload['role'],
            'iat': datetime.now(timezone.utc) - timedelta(hours=2),
            'exp': datetime.now(timezone.utc) - timedelta(minutes=5),
        },
        JWT_SECRET,
        algorithm='HS256',
    )

    response = requests.get(
        f'{BASE_URL}/api/auth/me',
        headers={'Authorization': f'Bearer {expired_token}'},
        timeout=10,
    )

    assert response.status_code == 401
    assert response.json()['detail'] == 'Token expired'


def test_register_rejects_invalid_email():
    response = requests.post(
        f'{BASE_URL}/api/auth/register',
        json={
            'email': 'invalid-email',
            'password': 'test123',
            'name': 'BadEmail',
        },
        headers={'Content-Type': 'application/json'},
        timeout=10,
    )

    assert response.status_code == 422


def test_admin_points_rejects_negative_values():
    admin_auth = login(DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD)

    create_user_response = requests.post(
        f'{BASE_URL}/api/auth/register',
        json={
            'email': f"negative_points_{os.urandom(4).hex()}@test.com",
            'password': 'test123',
            'name': 'Negative Points',
        },
        headers={'Content-Type': 'application/json'},
        timeout=10,
    )
    assert create_user_response.status_code == 200, create_user_response.text
    user_id = create_user_response.json()['user']['id']

    response = requests.post(
        f'{BASE_URL}/api/admin/points',
        json={
            'user_id': user_id,
            'points': -5,
            'reason': 'invalid',
        },
        headers={
            'Content-Type': 'application/json',
            'Authorization': f"Bearer {admin_auth['token']}",
        },
        timeout=10,
    )

    assert response.status_code == 422
