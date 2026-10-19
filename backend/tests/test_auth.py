import json
import pytest
from app.models import User
from app.extensions import db


def test_login_success(client, app):
    with app.app_context():
        user = User(name='Test Admin', email='admin@test.com', role='admin')
        user.set_password('secret123')
        db.session.add(user)
        db.session.commit()

    res = client.post('/api/auth/login', json={
        'email': 'admin@test.com',
        'password': 'secret123'
    })
    assert res.status_code == 200
    data = res.get_json()
    assert 'token' in data
    assert data['user']['email'] == 'admin@test.com'
    assert data['user']['role'] == 'admin'


def test_login_invalid_password(client, app):
    res = client.post('/api/auth/login', json={
        'email': 'admin@test.com',
        'password': 'wrongpassword'
    })
    assert res.status_code == 401
    data = res.get_json()
    assert 'error' in data


def test_login_missing_fields(client):
    res = client.post('/api/auth/login', json={'email': 'admin@test.com'})
    assert res.status_code == 400


def test_get_me_with_valid_token(client, app):
    with app.app_context():
        user = User(name='Admin Me', email='admin-me@test.com', role='admin')
        user.set_password('secret123')
        db.session.add(user)
        db.session.commit()

    # Login to get token
    login_res = client.post('/api/auth/login', json={
        'email': 'admin-me@test.com',
        'password': 'secret123'
    })
    token = login_res.get_json()['token']

    # Test /api/auth/me
    res = client.get('/api/auth/me', headers={'Authorization': f'Bearer {token}'})
    assert res.status_code == 200
    assert res.get_json()['user']['email'] == 'admin-me@test.com'


def test_get_me_with_invalid_token(client):
    res = client.get('/api/auth/me', headers={'Authorization': 'Bearer invalid.token.value'})
    assert res.status_code == 401
