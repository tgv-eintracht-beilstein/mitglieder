# Vereinssoftware - Development Commands

# Default recipe: list available commands
default:
    @just --list

# ─── Frontend ───────────────────────────────────────────────────────────────

# Run frontend dev server
dev:
    npm run dev

# Build frontend (static export)
build:
    npm run build

# Serve the static build locally
serve:
    npx serve out

# ─── Backend ────────────────────────────────────────────────────────────────

# Build backend (SAM)
build-backend:
    cd backend && sam build

# Deploy backend to AWS
deploy-backend: build-backend
    cd backend && sam deploy || echo "Stack is up to date, nothing to deploy."

# Deploy backend without confirmation prompt
deploy-backend-yes: build-backend
    cd backend && sam deploy --no-confirm-changeset || echo "Stack is up to date, nothing to deploy."

# Start local API (SAM local)
api-local:
    cd backend && sam local start-api --port 3001 --env-vars .env

# ─── Full Stack ─────────────────────────────────────────────────────────────

# Build everything
build-all: build build-backend

# Deploy everything (frontend to S3 + backend to Lambda)
deploy: deploy-backend build
    @echo "Backend deployed. Upload 'out/' to your hosting (S3/CloudFront)."

# ─── Utilities ──────────────────────────────────────────────────────────────

# Install all dependencies
install:
    npm install
    cd backend && npm install

# Clean build artifacts
clean:
    rm -rf out .next
    rm -rf backend/.aws-sam/build

# Check TypeScript types
typecheck:
    npx tsc --noEmit

# Format code
fmt:
    npx prettier --write "src/**/*.{ts,tsx}" "backend/src/**/*.js"
