pipeline {
  agent {
    kubernetes {
      yaml """
apiVersion: v1
kind: Pod
metadata:
  labels:
    app: jenkins-kaniko-deploy
spec:
  serviceAccountName: jenkins
  restartPolicy: Never
  containers:
  - name: kaniko
    image: gcr.io/kaniko-project/executor:latest
    command: ['cat']
    tty: true
    volumeMounts:
    - name: kaniko-docker-config
      mountPath: /kaniko/.docker
  - name: kubectl
    image: bitnami/kubectl:1.29
    command: ['cat']
    tty: true
  volumes:
  - name: kaniko-docker-config
    emptyDir: {}
"""
    }
  }

  environment {
    REGISTRY      = 'innothinh'
    IMAGE         = "${REGISTRY}/kubesphere-starter-api"
    TAG           = "${env.GIT_COMMIT ?: 'dev'}"   // uses commit SHA if present
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Build & Push (Kaniko)') {
      steps {
        container('kaniko') {
          withCredentials([usernamePassword(credentialsId: 'registry-cred', usernameVariable: 'REG_USR', passwordVariable: 'REG_PSW')]) {
            sh '''
              # Auth for Docker Hub
              mkdir -p /kaniko/.docker
              AUTH=$(printf '%s' "$REG_USR:$REG_PSW" | base64 -w0 2>/dev/null || printf '%s' "$REG_USR:$REG_PSW" | base64)
              cat > /kaniko/.docker/config.json <<EOF
              { "auths": { "https://index.docker.io/v1/": { "auth": "$AUTH" } } }
              EOF

              # Build & push directly from app/src
              /kaniko/executor \
                --context "${WORKSPACE}/app/src" \
                --dockerfile "${WORKSPACE}/app/src/Dockerfile" \
                --destination "${IMAGE}:${TAG}" \
                --destination "${IMAGE}:latest" \
                --snapshotMode=redo \
                --reproducible \
                --use-new-run
            '''
          }
        }
      }
    }

    stage('Deploy to K8s') {
      steps {
        container('kubectl') {
          withKubeConfig([credentialsId: 'kubeconfig-cred']) {
            sh '''
              kubectl apply -f k8s/namespace.yaml
              sed -e "s#innothinh/kubesphere-starter-api:latest#${IMAGE}:${TAG}#g" k8s/deployment.yaml | kubectl apply -f -
              kubectl apply -f k8s/service.yaml
              kubectl apply -f k8s/ingress.yaml
              kubectl -n starter rollout status deploy/starter-api --timeout=120s
            '''
          }
        }
      }
    }
  }
}
