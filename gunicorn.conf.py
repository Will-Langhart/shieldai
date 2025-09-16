"""
Gunicorn configuration for Shield AI FastAPI application
"""

import multiprocessing
import os

# Server socket
bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"
backlog = 2048

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
timeout = 30
keepalive = 2

# Restart workers after this many requests, to help prevent memory leaks
max_requests = 1000
max_requests_jitter = 50

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = "shieldai"

# Server mechanics
daemon = False
pidfile = "/tmp/shieldai.pid"
user = None
group = None
tmp_upload_dir = None

# SSL (uncomment and configure if using HTTPS)
# keyfile = "/path/to/keyfile"
# certfile = "/path/to/certfile"

# Preload app for better performance
preload_app = True

# Environment variables
raw_env = [
    "PYTHONPATH=/Users/holotrout/shieldai/shieldai",
]

# Worker timeout for graceful shutdown
graceful_timeout = 30

# Enable worker recycling
max_worker_memory = 200  # MB

# Security
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190




