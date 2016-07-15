import AWS from 'aws-sdk';

class Opsworks {

    /**
     * Perform api functions on AWS Opsworks and update slack
     *
     * @param  {Function} reply
     * @param  {Object}   message
     * @return {void}
     */
    constructor(reply, message) {
        AWS.config.update({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        });

        this.api = new AWS.OpsWorks({
            region: 'us-east-1'
        });

        this.responses = [];
        this.reply = reply;
        this.message = message;
    }

    /**
     * Deploy an Opsworks app and update slack with the status
     *
     * @param  {Object} app
     * @param  {string} comment
     * @return {void}
     */
    deploy(app, comment) {

        let promises = app.stacks.map((stack) => {

            return new Promise((resolve) => {

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

                        this.responses[stack.appId] = {
                            color: 'danger',
                            title: `Sorry I wasn't able to deploy ${app.name} to ${stack.name} :disappointed:`,
                            text: err.message
                        };

                    } else if (data.DeploymentId) {

                        let uri = `https://console.aws.amazon.com/opsworks/home?#/stack/${stack.stackId}/deployments/${data.DeploymentId}`;

                        this.responses[stack.appId] = {
                            color: '#3AA3E3',
                            title: `Deploying ${app.name} to ${stack.name}...`,
                            text: `<${uri}|Check status>`
                        };

                        let params = {
                            AppId: app.appId,
                            StackId: app.stackId,
                            DeploymentIds: [
                                data.DeploymentId
                            ]
                        };

                        this.api.waitFor('deploymentSuccessful', params, (err, data) => {

                            if (err) {

                                this.responses[stack.appId] = {
                                    color: 'danger',
                                    title: `Sorry I wasn't able to deploy ${app.name} to ${stack.name} :disappointed:`,
                                    text: err.message
                                };

                            } else if (data.Deployments[0]) {

                                this.responses[stack.appId] = {
                                    color: 'good',
                                    title: `Success!`,
                                    text: `Deployed ${app.name} to ${stack.name} :blush:`
                                };

                            }

                            this.updateSlack();

                        });

                    }

                    resolve();

                });
            });
        });

        let results = Promise.all(promises);
        results.then(() => this.updateSlack());
    }

    /**
     * Update slack with Opsworks responses
     *
     * @return {void}
     */
    updateSlack() {

        let attachments = [];

        for (let key in this.responses) {
            attachments.push(this.responses[key]);
        }

        this.reply(this.message, {
            attachments: attachments
        });
    }
}

export default Opsworks;
