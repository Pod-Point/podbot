import * as AWS from 'aws-sdk';
import Stack from '../interfaces/stack';

export default class CodeBuild {

    private codebuild: any;

    /**
     * Perform api functions on AWS CodeBuild
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

        this.codebuild = new AWS.CodeBuild();
    }

    /**
     * Start a CodeBuild build for an app
     *
     * @param  {Stack} stack
     * @return {Object}
     */
    public startBuild(stack: Stack): Promise<any> {

        return new Promise((resolve, reject) => {

            const params = {
                projectName: stack.project
            };

            this.codebuild.startBuild(params, (err: any, data: any) => {

                console.log(data);
                console.log(err);

                if (err) {

                    reject(err.message);

                } else if (data.build) {

                    resolve();

                }
            });
        });
    }
}
