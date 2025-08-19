FROM --platform=linux/amd64 public.ecr.aws/lambda/python:3.13

WORKDIR /var/task

RUN mkdir -p /opt/extensions

COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 /lambda-adapter /opt/extensions/lambda-adapter

ENV UV_NO_CACHE=1
ENV UV_INSTALL_DIR=/usr/local/bin
ENV MPLCONFIGDIR=/var/task/.config/matplotlib

RUN dnf update -y && dnf install graphviz tar gzip -y
RUN curl -LsSf https://astral.sh/uv/install.sh | sh

COPY pyproject.toml .python-version uv.lock ./

RUN uv export --frozen --no-emit-workspace --no-dev --no-editable -o requirements.txt
RUN python -m pip install -r requirements.txt -t .

COPY . .

ENTRYPOINT ["python", "-m", "uvicorn", "--port=8080", "main:app"]
