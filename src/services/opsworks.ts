/// <reference path="../typings/opsworks.d.ts" />
import * as AWS from 'aws-sdk';
import Stack from '../interfaces/stack';
import App from '../interfaces/app';

class Opsworks {

    private endpoints: { [key: string]: AWS.OpsWorks };

    /**
     * Perform api functions on AWS Opsworks
     *
     * @return {void}
     */
    constructor() {
        AWS.config.update({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        });

        this.endpoints = {
            'us-east-1': new AWS.OpsWorks({
                region: 'us-east-1'
            }),
            'eu-west-1': new AWS.OpsWorks({
                region: 'eu-west-1'
            })
        };
    }

    /**
     * Deploy an Opsworks app
     *
     * @param  {App} app
     * @param  {string} comment
     * @param  {string} deploy
     * @return {Array}
     */
    deploy(app: App, comment: string, deploy: string = 'all'): Array<{stack: Stack, promise: Promise<any>}> {

        return app.stacks.filter((stack) => {

            if (deploy !== 'all' && stack.name !== deploy) {
                return false;
            }

            return true;

        }).map((stack) => {

            let promise: Promise<any> = new Promise((resolve, reject) => {

                let params = {
                    AppId: stack.appId,
                    StackId: stack.stackId,
                    Comment: comment,
                    Command: {
                        Name: 'deploy'
                    }
                };

                this.endpoints[stack.region].createDeployment(params, (err, data) => {

                    if (err) {

                        reject(err.message);

                    } else if (data.DeploymentId) {

                        let params = {
                            DeploymentIds: [
                                data.DeploymentId
                            ]
                        };

                        this.endpoints[stack.region].waitFor('deploymentSuccessful', params, (err, data) => {

                            if (err) {

                                reject(err.message);

                            } else if (data.Deployments[0]) {

                                resolve();

                            }
                        });
                    }
                });
            });

            return {
                stack: stack,
                promise: promise
            };

        });
    }
}

export default Opsworks;
