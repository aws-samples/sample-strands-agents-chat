#!/bin/bash

# CDK
pushd cdk

npm run lint

popd

# Web
pushd web

npm run lint
npm run build

popd

# API
pushd api

uv sync --group=lint
uv run ruff check --fix .
uv run ruff format .

popd
