.PHONY: help install run test lint format clean docker-build docker-run deploy

help:
	@echo "Available commands:"
	@echo "  install    - Install dependencies"
	@echo "  run        - Run the development server"
	@echo "  test       - Run tests"
	@echo "  lint       - Run linting"
	@echo "  format     - Format code"
	@echo "  clean      - Clean cache files"
	@echo "  docker-build - Build Docker image"
	@echo "  docker-run   - Run Docker container"
	@echo "  deploy     - Deploy to production"

install:
	pip install -r requirements.txt
	pip install -e ".[dev]"

run:
	uvicorn main:app --reload --host 0.0.0.0 --port 8000

test:
	pytest tests/ -v

test-watch:
	pytest tests/ -v --watch=.

lint:
	flake8 main.py tests/
	black --check main.py tests/
	isort --check-only main.py tests/

format:
	black main.py tests/
	isort main.py tests/

clean:
	find . -type d -name "__pycache__" -delete
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	rm -rf .pytest_cache
	rm -rf .mypy_cache

docker-build:
	docker build -t crop-diagnosis-service:latest .

docker-run:
	docker run -p 8000:8000 --rm crop-diagnosis-service:latest

docker-dev:
	docker build -t crop-diagnosis-service:dev .
	docker run -p 8000:8000 --rm -v $(PWD):/app crop-diagnosis-service:dev

deploy-gcp:
	gcloud builds submit --tag gcr.io/$(PROJECT_ID)/crop-diagnosis-service
	gcloud run deploy crop-diagnosis-service \
		--image gcr.io/$(PROJECT_ID)/crop-diagnosis-service \
		--platform managed \
		--region us-central1 \
		--allow-unauthenticated

deploy-vercel:
	vercel --prod

all: install lint test run
