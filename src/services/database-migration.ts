import * as AWS from 'aws-sdk';
import Log from '../modules/log';

const log = new Log();

export default class DatabaseMigration {

    private endpoints: { [key: string]: AWS.DMS };

    /**
     * Perform api functions on AWS Database Migration Service (DMS)
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
            const params = {
                ReplicationTaskArn: replicationTask,
                StartReplicationTaskType: 'resume-processing'
            };

            this.endpoints['eu-west-1'].startReplicationTask(params, (err, data) => {
                if (err) {
                    logContents += 'Error: trying to start database replication ' + log.formatLogMsg(err);
                    logContents += log.formatLogMsg('See DMS logs for more details');
                    log.createLogFile(logFileName, logContents);
                    reject('Error starting database replication. ' +
                        '<https://eu-west-1.console.aws.amazon.com/dms/home?region=eu-west-1#tasks:|See here> and log files for details.');
                } else if (data) {
                    logContents += 'Successfully started database replication ' + log.formatLogMsg(data);
                    log.createLogFile(logFileName, logContents);
                    resolve('In progress...');
                }
            });
        });
    }

    /**
     * Get replication task status
     *
     * @param  {string} replicationTask
     * @return {Promise}
     */
    public getReplicationTaskStatus(replicationTask: string) {
        return new Promise<any> ((resolve, reject) => {

            const params = {
                Filters: [
                    {
                        Name: 'replication-task-arn',
                        Values: [
                            replicationTask
                        ]
                    }
                ]
            };

            let response: string = '';
            this.endpoints['eu-west-1'].describeReplicationTasks(params, (err, data) => {
                if (err) {
                    reject('error');
                } else if (data) {
                    response = data.ReplicationTasks[0].Status;
                    if (response === 'stopped' && data.ReplicationTasks[0].StopReason === 'Stop Reason FULL_LOAD_ONLY_FINISHED') {
                        resolve('success');
                    } else if (response === 'starting' || response === 'running') {
                        resolve(response);
                    } else {
                        reject('error');
                    }
                }
            });
        });
    }

}
