pipeline {
  // agent {
  //   kubernetes {
  //     yaml """
  //       apiVersion: v1
  //       kind: Pod
  //       spec:
  //         containers:
  //         - name: docker
  //           image: docker:24.0.5-cli
  //           tty: true
  //           volumeMounts:
  //           - name: dockersock
  //             mountPath: /var/run/docker.sock
  //         volumes:
  //         - name: dockersock
  //           hostPath:
  //             path: /var/run/docker.sock
  //       """
  //     defaultContainer 'docker'
  //   }
  // }
  agent any

  environment {
    REGISTRY = 'innothinh'
    IMAGE = "${REGISTRY}/kubesphere-starter-api"
    TAG = "${env.GIT_COMMIT ?: 'dev'}"
    REGISTRY_CRED = credentials('registry-cred')
  }

  stages {
    stage('Checkout') { steps { checkout scm } }

    stage('Build Image') {
      steps {
        sh '''
          cd app/src
          docker build -t ${IMAGE}:${TAG} .
          docker tag ${IMAGE}:${TAG} ${IMAGE}:latest
        '''
      }
    }

    stage('Push Image') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'registry-cred', usernameVariable: 'REG_USR', passwordVariable: 'REG_PSW')]) {
          sh '''
            echo "$REG_PSW" | docker login -u "$REG_USR" --password-stdin
            docker push ${IMAGE}:${TAG}
            docker push ${IMAGE}:latest
          '''
        }
      }
      post {
        always {
          sh 'docker logout || true'
        }
      }
    }

    stage('Deploy to K8s') {
      steps {
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
