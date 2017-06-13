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

                if (err) {

                    reject(err.message);

                } else if (data.build) {

                    const params = {
                        ids: [
                            data.build.id
                        ]
                    };

                    const state = 'buildSuccessful';

                    this.codebuild.api.waiters[state] = {
                        'delay': 15,
                        'operation': 'batchGetBuilds',
                        'maxAttempts': 120,
                        'description': 'Wait until a build has completed successfully',
                        'acceptors': [
                            {
                                'expected': 'SUCCEEDED',
                                'matcher': 'pathAll',
                                'state': 'success',
                                'argument': 'builds[].buildStatus'
                            },
                            {
                                'expected': 'FAILED',
                                'matcher': 'pathAny',
                                'state': 'failure',
                                'argument': 'builds[].buildStatus'
                            },
                            {
                                'expected': 'FAULT',
                                'matcher': 'pathAny',
                                'state': 'failure',
                                'argument': 'builds[].buildStatus'
                            },
                            {
                                'expected': 'TIMED_OUT',
                                'matcher': 'pathAny',
                                'state': 'failure',
                                'argument': 'builds[].buildStatus'
                            },
                            {
                                'expected': 'STOPPED',
                                'matcher': 'pathAny',
                                'state': 'failure',
                                'argument': 'builds[].buildStatus'
                            }
                        ]
                    };

                    this.codebuild.waitFor('buildSuccessful', params, (err: any, data: any) => {

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
