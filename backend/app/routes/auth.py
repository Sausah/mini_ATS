from flask import Blueprint, request, jsonify, current_app
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadTimeSignature
from functools import wraps

from app.extensions import db
from app.models import User

auth_bp = Blueprint('auth', __name__)

TOKEN_MAX_AGE = 86400 * 7  # 7 days


def generate_token(user):
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    return serializer.dumps({'user_id': user.id, 'role': user.role, 'email': user.email})


def verify_token(token):
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        data = serializer.loads(token, max_age=TOKEN_MAX_AGE)
        return data
    except (SignatureExpired, BadTimeSignature, Exception):
        return None


def get_current_user():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ', 1)[1].strip()
    data = verify_token(token)
    if not data:
        return None
    return db.session.get(User, data.get('user_id'))


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated


@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user with email and password."""
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email or password'}), 401

    token = generate_token(user)
    return jsonify({
        'token': token,
        'user': user.to_dict(),
        'message': 'Login successful'
    }), 200


@auth_bp.route('/me', methods=['GET'])
def me():
    """Get current authenticated user."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Invalid or expired token'}), 401
    return jsonify({'user': user.to_dict()}), 200
