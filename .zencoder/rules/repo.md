---
description: Repository Information Overview
alwaysApply: true
---

# Repository Information Overview

## Repository Summary
Adham AgriTech is a comprehensive smart agriculture platform designed for Egyptian farmers, combining AI, satellite technology, and sensor intelligence. The platform provides crop monitoring, disease diagnosis, irrigation management, weather forecasting, and agricultural marketplace features.

## Repository Structure
The repository follows a multi-project architecture with a main Next.js web application and several supporting services:

### Main Repository Components
- **Main Application**: Next.js-based web platform with comprehensive agriculture features
- **Eleventy Blog**: Static site generator for documentation and blog content
- **Python Microservices**: AI-powered services for crop disease diagnosis, recommendations, and weather data
- **Supabase Functions**: Serverless backend functions for AI processing
- **Database Scripts**: SQL migrations and setup scripts for PostgreSQL database

## Projects

### Main Application (Next.js)
**Configuration File**: package.json

#### Language & Runtime
**Language**: TypeScript/JavaScript
**Version**: Node.js 18.18.0
**Build System**: Next.js 14.2.15
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- @ai-sdk/google, @ai-sdk/groq, @ai-sdk/openai: AI SDK integrations
- @supabase/supabase-js, @supabase/ssr: Database and authentication
- @radix-ui/*: UI component library
- next: React framework
- tailwindcss: CSS framework
- mapbox-gl, leaflet: Mapping libraries
- recharts: Data visualization

**Development Dependencies**:
- eslint, prettier: Code quality tools
- typescript: Type checking
- @types/*: TypeScript definitions

#### Build & Installation
```bash
npm install
npm run build
npm run start
```

#### Docker
**Dockerfile**: ./Dockerfile
**Image**: node:lts-alpine
**Configuration**: Production-optimized Node.js container exposing port 3000

#### Testing
**Framework**: Custom test scripts
**Test Location**: __tests__/api/, tests/
**Naming Convention**: *.test.ts
**Configuration**: package.json scripts
**Run Command**:
```bash
npm run test
npm run test:sensors
```

### Eleventy Blog Site
**Configuration File**: eleventy/package.json

#### Language & Runtime
**Language**: JavaScript (Nunjucks templates)
**Version**: Node.js (inherited)
**Build System**: Eleventy 1.x
**Package Manager**: npm/yarn

#### Dependencies
**Main Dependencies**:
- @11ty/eleventy: Static site generator
- @11ty/eleventy-navigation: Navigation plugin
- @11ty/eleventy-plugin-rss: RSS feed generation
- luxon: Date/time handling
- markdown-it: Markdown processing

#### Build & Installation
```bash
cd eleventy
npm install
npm run build
npm run serve
```

### Crop Disease Diagnosis Service
**Configuration File**: services/crop-disease-diagnosis/pyproject.toml

#### Language & Runtime
**Language**: Python
**Version**: Python 3.8+
**Build System**: setuptools
**Package Manager**: pip

#### Dependencies
**Main Dependencies**:
- fastapi: Web framework
- uvicorn: ASGI server
- python-multipart: File upload handling
- pillow: Image processing
- pydantic: Data validation

**Development Dependencies**:
- pytest: Testing framework
- pytest-asyncio: Async testing
- httpx: HTTP client for testing

#### Build & Installation
```bash
cd services/crop-disease-diagnosis
pip install -r requirements.txt
uvicorn main:app --reload
```

#### Docker
**Dockerfile**: services/crop-disease-diagnosis/Dockerfile
**Image**: python:3.11-slim
**Configuration**: FastAPI service container exposing port 8000

#### Testing
**Framework**: pytest
**Test Location**: services/crop-disease-diagnosis/tests/
**Naming Convention**: test_*.py
**Configuration**: pytest configuration in pyproject.toml
**Run Command**:
```bash
cd services/crop-disease-diagnosis
pytest
```

### Recommendation Service
**Configuration File**: recommendation_service/requirements.txt

#### Language & Runtime
**Language**: Python
**Version**: Python 3.9+
**Build System**: pip
**Package Manager**: pip

#### Dependencies
**Main Dependencies**:
- fastapi: Web framework
- uvicorn: ASGI server
- python-multipart: File upload handling
- pydantic: Data validation

#### Build & Installation
```bash
cd recommendation_service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8080
```

#### Docker
**Dockerfile**: recommendation_service/Dockerfile
**Image**: python:3.9-slim
**Configuration**: FastAPI service container exposing port 8080

### Weather Service
**Configuration File**: weather/pyproject.toml

#### Language & Runtime
**Language**: Python
**Version**: Python 3.10+
**Build System**: setuptools
**Package Manager**: uv

#### Dependencies
**Main Dependencies**:
- httpx: HTTP client
- mcp: Model Context Protocol

#### Build & Installation
```bash
cd weather
pip install -r pyproject.toml
python main.py
```

### Supabase Functions
**Configuration File**: supabase/functions/

#### Language & Runtime
**Language**: TypeScript
**Version**: Node.js (Supabase runtime)
**Build System**: Supabase CLI
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- Supabase Edge Functions runtime
- AI SDK integrations

#### Build & Installation
```bash
supabase functions deploy ai-grok
```

## Docker Configuration
**Docker Compose**: compose.yaml
**Services**: Main application containerization
**Configuration**: Production deployment with Node.js environment

## Testing
**Framework**: Mixed (Jest-style for JS, pytest for Python)
**Test Location**: __tests__/, tests/, services/*/tests/
**Configuration**: package.json scripts, pytest.ini
**Run Command**:
```bash
# Main app tests
npm test

# Python service tests
cd services/crop-disease-diagnosis && pytest
```