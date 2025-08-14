#!/bin/bash

cp -r /var/task/.venv /tmp/.venv
UV_PROJECT_ENVIRONMENT=/tmp/.venv \
    exec uv run main.py
