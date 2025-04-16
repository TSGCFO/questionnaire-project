"""
Production settings for questionnaire_backend project.

This file imports all settings from the base settings.py file and overrides
specific settings for the production environment.
"""
from .settings import *
import os
import dj_database_url

# SECURITY WARNING: keep the secret key used in production secret!
# For Heroku, we'll use an environment variable
SECRET_KEY = os.environ.get('SECRET_KEY', 'cB1!1sHTr-X8j3kP0xT94$abRz@M7^LyEwQlk2d5G6pZ&qWn')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

# Allow your business domains and Heroku domains
ALLOWED_HOSTS = [
    'www.tsgfulfillment.ca', 
    'tsgfulfillment.ca',
    '.herokuapp.com'  # Allow all Heroku subdomains
]

# Security settings for production
SECURE_SSL_REDIRECT = True  # Redirect all HTTP requests to HTTPS
SESSION_COOKIE_SECURE = True  # Only send cookies over HTTPS
CSRF_COOKIE_SECURE = True  # Only send CSRF cookies over HTTPS
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Static files configuration for Heroku
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Add whitenoise middleware for static files
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Add whitenoise for static files
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# For serving the React PWA from Django
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'staticfiles')],  # Serve React app from here
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# CORS settings - restrict to your domains in production
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    'https://www.tsgfulfillment.ca',
    'https://tsgfulfillment.ca',
    'https://tsg-questionnaire.herokuapp.com',  # Add your Heroku app URL
]

# Database configuration for Heroku
# This will use the DATABASE_URL environment variable on Heroku
db_from_env = dj_database_url.config(conn_max_age=600)
DATABASES['default'].update(db_from_env)

# For Heroku, console logging is better than file logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
        'submissions': {  # Your app's logger
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}

# Email configuration (same as in settings.py)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.office365.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'info@tsgfulfillment.com'
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_PASSWORD', 'Hassan8488$@')  # Use env var in prod
DEFAULT_FROM_EMAIL = 'info@tsgfulfillment.com'

# Media files (uploads) - for Heroku's ephemeral filesystem
# In production, you should use a service like AWS S3 for media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Heroku specific settings
import django_heroku
django_heroku.settings(locals())