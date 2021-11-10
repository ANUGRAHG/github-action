#!/usr/bin/env groovy
@Library(['piper-lib', 'piper-lib-os']) _

/**
* Build discarder:
* daysToKeepStr: history is only kept up to this days.
* numToKeepStr: only this number of build logs are kept.
* artifactDaysToKeepStr: artifacts are only kept up to this days.
* artifactNumToKeepStr: only this number of builds have their artifacts kept.
*/
properties([
  buildDiscarder(
    logRotator(artifactDaysToKeepStr: '5', artifactNumToKeepStr: '10', daysToKeepStr: '15', numToKeepStr: '20')
  )
])

node{

	dockerExecuteOnKubernetes(script: this, dockerEnvVars: ['pusername':pusername, 'puserpwd':puserpwd], dockerImage: 'docker.wdf.sap.corp:51010/sfext:v3' ) {

	try {
		stage ('Prepare') {
			/**
			* Install lastest cds-dk
			* npm dependencies 
			**/
			deleteDir()
      		checkout scm	 
	 		sh '''
			    npm config set unsafe-perm true
			    npm rm -g @sap/cds
			    npm i -g @sap/cds-dk
				npm install
			'''
		}
		stage ('Unit Tests') {
			/**
			* Local Tests
			**/
			echo ">> Runnning the local unit tests"
			sh "npm run-script test:unit"
		}

		stage ('Build') { 	 
			/**
			* Cds build the Mock app
			* Switch the destination of RM app in package.json to mock
			* MBT build the RM app
			**/
	 		sh '''
				cd tests/mocks
			    cds build --production
				mv manifest.yml gen/srv/manifest.yml
			    cd ../..
			'''
			packageJson = readJSON file: 'package.json'
			packageJson.cds.requires.API_BUSINESS_PARTNER["[production]"].credentials.destination = "cap-api098-mock"
			writeJSON file: 'package.json', json: packageJson
			sh "mbt build -p=cf"
		 
	  	}

	  	stage('Deploy Mock'){
			/**
			* Set the environment variables from Config.yml
			* Deploy RM app
			* Deploy Mock app
			**/
			setupCommonPipelineEnvironment script:this
			cloudFoundryDeploy script:this, deployTool:'mtaDeployPlugin'
			cloudFoundryDeploy script:this, deployTool:'cf_native', cloudFoundry: [manifest: 'tests/mocks/gen/srv/manifest.yml']  	
        }

		stage('Integration Tests') {
			/**
			* Catch the error incase of failure and proceed to next stage
			* Use the CF cli and download the VCAP env to tests/appEnv.json
			* Include the Technical user details in file
			* Install Test dependencies
			* Run the Integration Test scripts
			**/
			catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
				// With Mock S/4 destination
				withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId:'pusercf', usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD']]) {
					sh "cf login -a ${commonPipelineEnvironment.configuration.steps.cloudFoundryDeploy.cloudFoundry.apiEndpoint} -u $USERNAME -p $PASSWORD -o ${commonPipelineEnvironment.configuration.steps.cloudFoundryDeploy.cloudFoundry.org} -s ${commonPipelineEnvironment.configuration.steps.cloudFoundryDeploy.cloudFoundry.space}"
				
					sh '''
						appId=`cf app cpapp-srv --guid`
						`cf curl /v2/apps/$appId/env > tests/appEnv.json`
						chmod 777 tests/appEnv.json
					'''
			
					appEnv = readJSON file: 'tests/appEnv.json'
					appEnv.pusername = pusername;
					appEnv.puserpwd = puserpwd;
					writeJSON file: 'tests/appEnv.json', json: appEnv
				}
				
				sh "npm install --only=dev"
				sh "npm run-script test:integration"
			}

		}

		stage('Redeploy'){
			/**
			* Cleanup Dir and Fresh checkout
			* Deploy RM app
			**/
		   	sh "rm -rf *"
      		checkout scm
		   	sh '''
			    mbt build -p=cf
			'''
			cloudFoundryDeploy script:this, deployTool:'mtaDeployPlugin'
			sh "rm -rf *"  
	    } 

		stage('UI Test'){
		   /**
			* Trigger UI Test cases Job
			**/
			build job: 'RiskManagement_RTChecks'
		
		}

		stage('Undeploy'){
			/**
			* Undeploy RM app using CF Cli
			* Delete the HDI container
			* Delete the mock app
			**/
			setupCommonPipelineEnvironment script:this
			withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId:'pusercf', usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD']]) {
				sh "cf login -a ${commonPipelineEnvironment.configuration.steps.cloudFoundryDeploy.cloudFoundry.apiEndpoint} -u $USERNAME -p $PASSWORD -o ${commonPipelineEnvironment.configuration.steps.cloudFoundryDeploy.cloudFoundry.org} -s ${commonPipelineEnvironment.configuration.steps.cloudFoundryDeploy.cloudFoundry.space}"
			}
			sh'''
		   		echo 'y' | cf undeploy cpapp
				echo 'y' | cf delete-service cpapp-db
				echo 'y' | cf delete cpapp-srv-mocks
		   	'''
		 
	    }

	}
	catch(e){
		echo e.toString()
		echo 'This will run only if failed'
		currentBuild.result = "FAILURE"
	}
	finally {

		 emailext body: '$DEFAULT_CONTENT', subject: '$DEFAULT_SUBJECT', to: 'DL_5731D8E45F99B75FC100004A@global.corp.sap,DL_58CB9B1A5F99B78BCC00001A@global.corp.sap'

	}
}
} 
