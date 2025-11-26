pipeline {
  agent any

  parameters {
    string(name: 'REGISTRY', defaultValue: 'docker.io', description: 'Docker registry, e.g., docker.io or registry.example.com')
    string(name: 'IMAGE_PREFIX', defaultValue: 'youruser', description: 'Registry namespace (e.g., dockerhub username or org)')
    string(name: 'IMAGE_TAG', defaultValue: '', description: 'Image tag to use (defaults to Git commit)')
    booleanParam(name: 'DEPLOY', defaultValue: true, description: 'Deploy using docker compose on this Jenkins host')
    string(name: 'COMPOSE_FILE', defaultValue: 'deploy/docker-compose.prod.yml', description: 'Path to docker-compose file')
    string(name: 'BACKEND_PORT', defaultValue: '3001', description: 'Backend container port')
    string(name: 'FRONTEND_PORT', defaultValue: '80', description: 'Host port to expose frontend')
  }

  environment {
    REGISTRY_CREDENTIALS = credentials('REGISTRY_CREDS')
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        script {
          env.SHORT_SHA = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
          if (!params.IMAGE_TAG?.trim()) {
            env.RESOLVED_TAG = env.SHORT_SHA
          } else {
            env.RESOLVED_TAG = params.IMAGE_TAG.trim()
          }
          echo "Using tag: ${env.RESOLVED_TAG}"
        }
      }
    }

    stage('Build backend image') {
      steps {
        sh '''
          echo "+ Building backend image"
          docker login -u ${REGISTRY_CREDENTIALS_USR} -p ${REGISTRY_CREDENTIALS_PSW} ${REGISTRY}
          docker build -t ${REGISTRY}/${IMAGE_PREFIX}/shop-backend:${RESOLVED_TAG} -f Dockerfile .
          docker tag ${REGISTRY}/${IMAGE_PREFIX}/shop-backend:${RESOLVED_TAG} ${REGISTRY}/${IMAGE_PREFIX}/shop-backend:latest
          docker push ${REGISTRY}/${IMAGE_PREFIX}/shop-backend:${RESOLVED_TAG}
          docker push ${REGISTRY}/${IMAGE_PREFIX}/shop-backend:latest
        '''
      }
    }

    stage('Build frontend image') {
      steps {
        dir('frontend') {
          sh '''
            echo "+ Building frontend image"
            docker login -u ${REGISTRY_CREDENTIALS_USR} -p ${REGISTRY_CREDENTIALS_PSW} ${REGISTRY}
            docker build -t ${REGISTRY}/${IMAGE_PREFIX}/shop-frontend:${RESOLVED_TAG} .
            docker tag ${REGISTRY}/${IMAGE_PREFIX}/shop-frontend:${RESOLVED_TAG} ${REGISTRY}/${IMAGE_PREFIX}/shop-frontend:latest
            docker push ${REGISTRY}/${IMAGE_PREFIX}/shop-frontend:${RESOLVED_TAG}
            docker push ${REGISTRY}/${IMAGE_PREFIX}/shop-frontend:latest
          '''
        }
      }
    }

    stage('Pre-Deploy Snapshot') {
      when { expression { return params.DEPLOY } }
      steps {
        sh '''
          set -e
          # Capture current running images (if any) to allow rollback
          docker ps --filter name=shop-backend --format '{{.Image}}' > .prev_backend_image || true
          docker ps --filter name=shop-frontend --format '{{.Image}}' > .prev_frontend_image || true
          echo "Previous backend: $(cat .prev_backend_image || true)"
          echo "Previous frontend: $(cat .prev_frontend_image || true)"
        '''
      }
    }

    stage('Deploy (docker compose)') {
      when { expression { return params.DEPLOY } }
      steps {
        sh '''
          set -e
          # Prefer docker compose v2; fallback to docker-compose
          COMPOSE="docker compose"
          if ! docker compose version >/dev/null 2>&1; then
            COMPOSE="docker-compose"
          fi

          export IMAGE_PREFIX=${IMAGE_PREFIX}
          export IMAGE_TAG=${RESOLVED_TAG}
          export BACKEND_PORT=${BACKEND_PORT}
          export FRONTEND_PORT=${FRONTEND_PORT}
          export DATABASE_URL=${DATABASE_URL}
          export JWT_SECRET=${JWT_SECRET}
          export PAYPAL_CLIENT_ID=${PAYPAL_CLIENT_ID}
          export PAYPAL_MODE=${PAYPAL_MODE}

          ${COMPOSE} -f ${COMPOSE_FILE} pull
          ${COMPOSE} -f ${COMPOSE_FILE} up -d
          ${COMPOSE} -f ${COMPOSE_FILE} ps
        '''
      }
    }

    stage('Healthcheck') {
      when { expression { return params.DEPLOY } }
      steps {
        script {
          // Try frontend and backend (via proxy) a few times
          sh '''
              set -e
              attempts=0
              until curl -fsS http://localhost:${FRONTEND_PORT}/ >/dev/null; do
                attempts=$((attempts+1))
                if [ "$attempts" -ge 12 ]; then
                  echo "Frontend healthcheck failed" >&2
                  exit 1
                fi
                sleep 5
              done
              attempts=0
              until curl -fsS http://localhost:${FRONTEND_PORT}/api/products >/dev/null; do
                attempts=$((attempts+1))
                if [ "$attempts" -ge 12 ]; then
                  echo "Backend healthcheck failed" >&2
                  exit 1
                fi
                sleep 5
              done
              echo "Healthchecks passed"
            '''
        }
      }
    }
  }

  post {
    failure {
      script {
        if (params.DEPLOY) {
          echo 'Attempting rollback to previous images...'
          // Run rollback steps on an agent (provides hudson.FilePath)
          node {
            sh '''
            set -e
            COMPOSE="docker compose"
            if ! docker compose version >/dev/null 2>&1; then
              COMPOSE="docker-compose"
            fi

            PREV_BACKEND=$(cat .prev_backend_image 2>/dev/null || true)
            PREV_FRONTEND=$(cat .prev_frontend_image 2>/dev/null || true)

            if [ -n "$PREV_BACKEND" ] && [ -n "$PREV_FRONTEND" ]; then
              echo "Rolling back to: $PREV_BACKEND and $PREV_FRONTEND"
              # Extract previous tag if images follow repo:tag format
              export IMAGE_PREFIX=${IMAGE_PREFIX}
              export BACKEND_PORT=${BACKEND_PORT}
              export FRONTEND_PORT=${FRONTEND_PORT}

              # If prev images are same repo with different tags, try to reuse tag
              PREV_TAG_BACKEND=${PREV_BACKEND##*:}
              PREV_TAG_FRONTEND=${PREV_FRONTEND##*:}

              if [ -n "$PREV_TAG_BACKEND" ] && [ -n "$PREV_TAG_FRONTEND" ]; then
                export IMAGE_TAG=$PREV_TAG_BACKEND
                ${COMPOSE} -f ${COMPOSE_FILE} up -d
              else
                # Fallback: explicitly set images to previous ones
                ${COMPOSE} -f ${COMPOSE_FILE} down
                docker run -d --name shop-backend --network node_ejs_postgres_full_project_appnet "$PREV_BACKEND" || true
                docker run -d -p ${FRONTEND_PORT}:80 --name shop-frontend --network node_ejs_postgres_full_project_appnet "$PREV_FRONTEND" || true
              fi
            else
              echo "No previous images captured; skipping rollback"
            fi
            '''
          }
        }
      }
    }
  }
}
