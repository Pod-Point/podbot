import AWS from 'aws-sdk';

class Opsworks {

    /**
     * Perform api functions on AWS Opsworks and update slack
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
     * @return {array}
     */
    deploy(app, comment, deploy = 'all') {

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
