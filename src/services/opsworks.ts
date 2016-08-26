/// <reference path="../typings/opsworks.d.ts" />
import * as AWS from 'aws-sdk';

class Opsworks {

    private api: AWS.OpsWorks;

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

        this.api = new AWS.OpsWorks({
            region: 'us-east-1'
        });
    }

    /**
     * Deploy an Opsworks app
     *
     * @param  {Object} app
     * @param  {string} comment
     * @param  {string} deploy
     * @return {Array}
     */
    deploy(app, comment: string, deploy: string = 'all'): Array<{stack: {appId: string, stackId: string, name: string}, promise: Promise<any>}> {

        let deployments = app.stacks.filter((stack) => {

            if (deploy !== 'all' && stack.name !== deploy) {
                return false;
            }

            return true;

        }).map((stack) => {

            let promise = new Promise((resolve, reject) => {

                let params = {
                    AppId: stack.appId,
                    StackId: stack.stackId,
                    Comment: comment,
                    Command: {
                        Name: 'deploy'
                    }
                };

                this.api.createDeployment(params, (err, data) => {

                    if (err) {

                        reject(err.message);

                    } else if (data.DeploymentId) {

                        let params = {
                            AppId: app.appId,
                            StackId: app.stackId,
                            DeploymentIds: [
                                data.DeploymentId
                            ]
                        };

                        this.api.waitFor('deploymentSuccessful', params, (err, data) => {

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

        return deployments;
    }
}

export default Opsworks;
