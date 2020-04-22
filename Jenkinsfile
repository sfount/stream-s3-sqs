pipeline {
  agent any
	options { timestamps() }
	parameters {
    booleanParam(name: 'SKIP_NPM_AUDIT', defaultValue: false, description: 'Skip npm security audit. This should only ever be set to true if a known fix is not yet merged on a dependency.')
  }
	libraries { lib("pay-jenkins-library@master") }
	environment {
    npm_config_cache = 'npm-cache'
  }
	stages {
    stage('Build docker container') {
      steps {
        script {
          env.image = "${gitCommit()}-${env.BUILD_NUMBER}"
          buildAppWithMetrics { app = "stream-s3-sqs" }
        }
      }
      post { failure { postMetric("stream-s3-sqs.docker-build.failure", 1) } }
    }
		stage('Docker CI') {
			agent { docker { image "govukpay/stream-s3-sqs:${env.image}" } }
      stages {
        stage('Setup') {
          steps {
            sh 'node --version'
            sh 'npm --version'
            sh 'npm ci'
          }
        }
        stage('Security audit') {
          when {
						allOf {
							branch 'master'
            	not { expression { return params.SKIP_NPM_AUDIT } }
						}
          }
          steps {
            sh 'npm audit'
          }
        }
        stage('Lint') {
          steps {
            sh 'npm run lint'
          }
        }
        stage('Unit tests') {
          steps {
            sh 'npm run test'
          }
        }
      }
    }
    stage('Push and deploy') {
      stages {
        stage('Docker push') {
          steps {
            script {
              dockerTagWithMetrics { app = "stream-s3-sqs" }
            }
          }
          post { failure { postMetric("stream-s3-sqs.docker-tag.failure", 1) } }
        }
			}
	 	}
	}
}