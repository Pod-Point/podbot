import AWS from 'aws-sdk';

class Deployer {

    constructor() {
        AWS.config.update({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        });

        this.api = new AWS.OpsWorks({
            region: 'us-east-1'
        });
    }

    deploy(app, comment, callback) {

        let params = {
            AppId: app.appId,
            StackId: app.stackId,
            Comment: comment,
            Command: {
                Name: 'deploy'
            }
        };

        return this.api.createDeployment(params, callback);
    }
}

export default Deployer;
