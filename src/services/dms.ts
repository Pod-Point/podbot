import * as AWS from 'aws-sdk';
import * as Config from 'config';
import Log from '../modules/log';

const log = new Log();

export default class DMS {

    private endpoints: { [key: string]: AWS.DMS };

    /**
     * Perform api functions on AWS RDS
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

        AWS.config.region = 'eu-west-1';

        this.endpoints = {
            'us-east-1': new AWS.DMS({
                region: 'us-east-1'
            }),
            'eu-west-1': new AWS.DMS({
                region: 'eu-west-1'
            })
        };
    }

    /**
     * Start database migration
     *
     * @param  {string} replicationTask
     * @return {Promise}
     */
    public migrateDatabase(replicationTask: string) {
        return new Promise<any> ((resolve, reject) => {
            let logContents: string = log.formatLogMsg('MIGRATING DATABASE ON AWS DMS USING REPLICATION TASK ' + replicationTask);
            const logFileName: string = 'dms' + '__' + replicationTask;
            const util = require('util');
            const params = {
                ReplicationTaskArn: replicationTask,
                StartReplicationTaskType: 'start-replication'
            };

            this.endpoints['eu-west-1'].startReplicationTask(params, (err, data) => {
                if (err) {
                    console.log('ERROR: ' + util.inspect(err, {showHidden: false, depth: null}));
                    logContents += 'Error: trying to replicate database ' + log.formatLogMsg(err);
                    logContents += log.formatLogMsg('See DMS logs for more details');
                    log.createLogFile(logFileName, logContents);
                    reject(logContents);
                } else if (data) {
                    console.log('DATA: ' + util.inspect(data, {showHidden: false, depth: null}));
                    logContents += 'Replicated database ' + log.formatLogMsg(data);
                    log.createLogFile(logFileName, logContents);
                    resolve(logContents);
                }
            });
        });
    }

}
