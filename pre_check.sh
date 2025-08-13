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

uv run ruff check .
uv run ruff format .

popd
