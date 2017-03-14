import * as AWS from 'aws-sdk';
import * as Config from 'config';
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
        this.env = (process.env.ENV === 'production') ? 'production' : 'testing';
        this.logsDir = process.env.WEBSITE_MIGRATE_LOGS_DIR ? process.env.WEBSITE_MIGRATE_LOGS_DIR : Config.get<string>('website.logging.' + this.env + '.directory');

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
            const fs = require('fs');
            if (!fs.existsSync(this.logsDir)){
                fs.mkdirSync(this.logsDir);
            }
            const fileStamp = new FileStamp();
            console.log(this.logsDir + '/' + logFileName + '__' + fileStamp.dateTime() + '.log');
            fs.writeFile(this.logsDir + '/' + logFileName + '__' + fileStamp.dateTime() + '.log', logContent, (err: string) => {
                if (err) {
                    console.log(err);
                    reject(this.formatLogMsg(err));
                }

                console.log("Log file was saved!");
                resolve(this.formatLogMsg('Log file created'));
            });

        });
    }

    /**
     * Format a success/error message to be added to the log string
     *
     * @param  {any} message
     * @return {string}
     */
    public formatLogMsg(message: any) {
        if (typeof(message) == 'string') {
            return message + '\n';
        } else if (typeof(message) == 'array') {
            return message.toString() + '\n';
        } else if (typeof(message) == 'object') {
            return JSON.stringify(message) + '\n';
        }
    }

}
