import * as AWS from 'aws-sdk';
import FileStamp from '../modules/file-stamp';

export default class Log {

    private env: string;
    private logsDir: string;
    private endpoints: { [key: string]: AWS.S3 };

    /**
     * Perform api functions on AWS S3
     *
     * @return {void}
     */
    constructor() {
        this.logsDir = __dirname + (process.env.WEBSITE_DEPLOY_LOGS_DIR ? process.env.WEBSITE_DEPLOY_LOGS_DIR : Config.get<string>('website.logging.' + this.env + '.directory'));

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
            console.log('LOGGING PARAMS: ' + util.inspect(params, {showHidden: false, depth: null}));
            const fs = require('fs');
            if (!fs.existsSync(logsDir)){
                fs.mkdirSync(logsDir);
            }
            const fileStamp = new FileStamp();
            fs.writeFile(logsDir + '/' + logFileName + fileStamp.dateTime() + '.log', logContent, (err: string) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }

                console.log("The file was saved!");
                resolve();
            });

        });
    }

}
