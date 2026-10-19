from flask import Flask
from config import config_by_name
from app.extensions import db, migrate, cors


def create_app(config_name='default'):
    app = Flask(__name__)
    cfg = config_by_name.get(config_name, config_by_name['default'])
    app.config.from_object(cfg)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app, resources={
        r'/api/*': {
            'origins': [app.config.get('FRONTEND_URL', 'http://localhost:5173'), '*'],
            'methods': ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            'allow_headers': ['Content-Type', 'Authorization'],
        }
    })

    # Auto-initialize database tables and demo admin if not present
    with app.app_context():
        try:
            db.create_all()
            from app.models import User
            if User.query.filter_by(email='admin@miniats.com').first() is None:
                admin_user = User(
                    name='Recruiter Admin',
                    email='admin@miniats.com',
                    role='admin'
                )
                admin_user.set_password('admin123')
                db.session.add(admin_user)
                db.session.commit()
        except Exception:
            pass

    # Register blueprints
    from app.routes.candidates import candidates_bp
    from app.routes.jobs import jobs_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.pipeline import pipeline_bp
    from app.routes.auth import auth_bp
    from app.routes.interviews import interviews_bp

    app.register_blueprint(candidates_bp, url_prefix='/api/candidates')
    app.register_blueprint(jobs_bp, url_prefix='/api/jobs')
    app.register_blueprint(dashboard_bp, url_prefix='/api')
    app.register_blueprint(pipeline_bp, url_prefix='/api/pipeline')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(interviews_bp, url_prefix='/api/interviews')

    # Root & Health check
    @app.route('/')
    def index():
        return {
            'status': 'ok',
            'message': 'Mini ATS Backend API is running',
            'health': '/api/health'
        }, 200

    @app.route('/api/health')
    def health():
        return {'status': 'ok', 'message': 'Mini ATS API is running'}, 200

    # Error handlers
    @app.errorhandler(404)
    def not_found(e):
        return {'error': 'Resource not found'}, 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return {'error': 'Method not allowed'}, 405

    @app.errorhandler(500)
    def internal_error(e):
        db.session.rollback()
        return {'error': 'Internal server error'}, 500

    return app
