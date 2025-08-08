pipeline {
  agent any

  environment {
    REGISTRY = 'innothinh'
    IMAGE = "${REGISTRY}/kubesphere-starter-api"
    TAG = "${env.GIT_COMMIT ?: 'dev'}"
    KUBECONFIG = credentials('kubeconfig-cred') // create this credential in KubeSphere
    REGISTRY_CRED = credentials('registry-cred') // docker hub or ghcr credentials
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Build Image') {
      steps {
        sh """
          cd app
          docker build -t ${IMAGE}:${TAG} .
          docker tag ${IMAGE}:${TAG} ${IMAGE}:latest
        """
      }
    }

    stage('Push Image') {
      steps {
        sh """
          echo "${REGISTRY_CRED_PSW}" | docker login -u "${REGISTRY_CRED_USR}" --password-stdin
          docker push ${IMAGE}:${TAG}
          docker push ${IMAGE}:latest
        """
      }
    }

    stage('Deploy to K8s') {
      steps {
        sh '''
          mkdir -p $WORKSPACE/.kube
          echo "$KUBECONFIG" > $WORKSPACE/.kube/config
          export KUBECONFIG=$WORKSPACE/.kube/config

          kubectl apply -f k8s/namespace.yaml
          # Patch the image line with the exact tag for traceability
          sed -e "s#innothinh/kubesphere-starter-api:latest#${IMAGE}:${TAG}#g" k8s/deployment.yaml | kubectl apply -f -
          kubectl apply -f k8s/service.yaml
          kubectl apply -f k8s/ingress.yaml

          kubectl -n starter rollout status deploy/starter-api --timeout=120s
        '''
      }
    }
  }

  post {
    always {
      sh 'docker logout || true'
    }
  }
}
