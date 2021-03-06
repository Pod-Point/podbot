import * as AWS from 'aws-sdk';
import Stack from '../interfaces/stack';

export default class Opsworks {

    private endpoints: { [key: string]: AWS.OpsWorks };

    /**
     * Perform api functions on AWS Opsworks
     *
     * @return {void}
     */
    constructor() {
        AWS.config.update({
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
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
     * Deploy an Opsworks stack
     *
     * @param  {Stack} stack
     * @param  {string} comment
     * @return {Promise}
     */
    public deploy(stack: Stack, comment: string): Promise<any> {

        return new Promise((resolve, reject) => {

            const params = {
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

                    const params = {
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
    }
}
