FROM public.ecr.aws/lambda/python:3.13

WORKDIR /var/task

RUN mkdir -p /opt/extensions

COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 /lambda-adapter /opt/extensions/lambda-adapter

ENV UV_NO_CACHE=1
ENV UV_NO_MANAGED_PYTHON=1
ENV UV_PYTHON=/var/lang/bin/python
ENV UV_INSTALL_DIR=/usr/local/bin
ENV UV_PROJECT_ENVIRONMENT=/var/task/.venv
ENV MPLCONFIGDIR=/var/task/.config/matplotlib

RUN dnf update -y && dnf install graphviz tar gzip -y
RUN curl -LsSf https://astral.sh/uv/install.sh | sh

COPY run.sh ./
COPY pyproject.toml .python-version uv.lock ./

RUN uv sync

COPY . .

ENTRYPOINT ["./run.sh"]
