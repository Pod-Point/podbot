import * as AWS from 'aws-sdk';
import * as Config from 'config';
import * as fs from 'fs';
import FileStamp from './file-stamp';

export default class Log {

    private env: string;
    private logsDir: string;

    /**
     * Create logs for tasks carried out by Podbot not logged elsewhere
     *
     * @return {void}
     */
    constructor() {
        this.env = (process.env.ENV === 'production') ? 'production' : 'testing';
        this.logsDir = process.env.MIGRATE_LOGS_DIR ? process.env.MIGRATE_LOGS_DIR :
            Config.get<string>('logging.' + this.env + '.directory');
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
            if (!fs.existsSync(this.logsDir)) {
                fs.mkdirSync(this.logsDir);
            }
            const fileStamp = new FileStamp();
            fs.writeFile(this.logsDir + '/' + logFileName + '__' + fileStamp.dateTime() + '.log', logContent, (err: string) => {
                if (err) {
                    reject(this.formatLogMsg(err));
                }
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
        if (typeof(message) === 'string') {
            return message + '\n';
        } else if (typeof(message) === 'object') {
            return JSON.stringify(message) + '\n';
        }
    }

}
