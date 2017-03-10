import * as AWS from 'aws-sdk';

export default class Log {

    private endpoints: { [key: string]: AWS.S3 };

    /**
     * Perform api functions on AWS S3
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
            'us-east-1': new AWS.S3({
                region: 'us-east-1'
            }),
            'eu-west-1': new AWS.S3({
                region: 'eu-west-1'
            })
        };
    }

    /**
     * Create a log file for current operation
     *
     * @param  {string} logFileName
     * @param  {string} logContent
     * @return {Promise}
     * 
     */
    public createLogFile(logFileName: string, logContent: string) {
        return new Promise<any> ((resolve, reject) => {
            const util = require('util');
            AWS.config.region = 'eu-west-1';
            const currentDate = new Date(); 
            const dateTimeStamp: string = 
                currentDate.getFullYear() + '-' +
                ('0' + (currentDate.getMonth()+1)).slice(-2) + '-' +
                currentDate.getDate() + '--' +
                currentDate.getHours() + '-' +
                ('0' + currentDate.getMinutes()).slice(-2) + '-' +
                ('0' + currentDate.getSeconds()).slice(-2);
            const params = {
                Bucket: 'podpoint-podbot-logs-test',
                Key: logFileName + '__' + dateTimeStamp + '.txt',
                Body: logContent
            };
            console.log('LOGGING PARAMS: ' + util.inspect(params, {showHidden: false, depth: null}));
            this.endpoints['eu-west-1'].putObject(params, (err, data) => {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    console.log(data);
                    resolve();
                }
            });

        });
    }

}
