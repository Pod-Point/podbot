import * as AWS from 'aws-sdk';
import FileStamp from '../modules/file-stamp';
import Log from '../modules/log';

const log = new Log();

export default class S3Migration {

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

        AWS.config.region = 'eu-west-1';

    }

    /**
     * Copy all content except backup directories from one S3 bucket to another
     *
     * @param  {string} fromBucket
     * @param  {string} toBucket
     * @param  {string} toPrefix
     * @return {Promise}
     */
    public copyBucket(fromBucket: string, toBucket: string, toPrefix: string) {
        return new Promise<any> ((resolve, reject) => {
            let logContents: string = log.formatLogMsg('COPYING FROM ' + fromBucket + ' to ' + toBucket + '/' + toPrefix);
            const async = require('async');
            const s3 = {
                'endpoints': {
                    'eu-west-1': new AWS.S3({
                        region: 'eu-west-1'
                    })
                }
            };
            const listParams = {
                Bucket: encodeURIComponent(fromBucket)
            };

            s3.endpoints['eu-west-1'].listObjectsV2(listParams, (err, data) => {
                if (err) {
                    logContents += 'Error: trying to list files in bucket ' + fromBucket + ' ' + log.formatLogMsg(err);
                    reject(logContents);
                } else if (data.Contents) {
                    async.each(data.Contents, (file: any, callback: any) => {
                        const copyParams = {
                            CopySource: encodeURIComponent(fromBucket + '/' + file.Key),
                            Bucket: encodeURIComponent(toBucket),
                            Key: toPrefix + file.Key
                        };
                        if (file.Key.indexOf('backup__') === -1) {
                            s3.endpoints['eu-west-1'].copyObject(copyParams, (error, response) => {
                                if (error) {
                                    logContents += 'Error: copying file ' + file.Key + ' ' + log.formatLogMsg(error);
                                } else {
                                    logContents += log.formatLogMsg('Copied file: ' + file.Key);
                                }
                                callback(null);
                            });
                        } else {
                            callback(null);
                        }
                    }, (err: any) => {
                        if (err) {
                            logContents += 'Error: copying files from ' + fromBucket + ' to ' + toBucket + ' ' + log.formatLogMsg(err);
                            reject(logContents);
                        } else {
                            logContents += log.formatLogMsg('Succeeded copying files from ' + fromBucket + ' to ' + toBucket);
                            resolve(logContents);
                        }
                    });
                }
            });

        });

    }

    /**
     * Back up an S3 bucket by copying all its contents into a temporary backup directory
     *
     * @param  {string} bucket
     * @return {Promise}
     */
    public backupBucket(bucket: string) {
        return new Promise<any> ((resolve, reject) => {
            let logContents: string = log.formatLogMsg('BACKING UP ' + bucket);
            const deleteOldestBackup = this.deleteOldestBackup(bucket);

            deleteOldestBackup.then((val: string) => {
                logContents += val;
                const fileStamp = new FileStamp();
                const copyBucket = this.copyBucket(bucket, bucket, 'backup__' + fileStamp.dateTime() + '/');
                copyBucket.then((val: string) => {
                    logContents += val;
                    resolve(logContents);
                })
                .catch((err) => {
                    logContents += err.toString();
                    reject(logContents);
                });
            })
            .catch((err) => {
                logContents += err.toString();
                reject(logContents);
            });
        });
    }

    /**
     * Delete oldest backup folder in S3 bucket
     *
     * @param  {string} bucket
     * @return {Promise}
     */
    public deleteOldestBackup(bucket: string) {
        // tslint:disable-next-line:promise-must-complete
        return new Promise<any> ((resolve, reject) => {
            const s3 = {
                'endpoints': {
                    'eu-west-1': new AWS.S3({
                        region: 'eu-west-1'
                    })
                }
            };
            const listParams = {
                Bucket: encodeURIComponent(bucket)
            };

            s3.endpoints['eu-west-1'].listObjectsV2(listParams, (err, data) => {
                if (err) {
                    reject('Error: Trying to delete oldest backup in ' +  bucket +
                        ' encountered problem getting directory list: ' + log.formatLogMsg(err));
                } else if (data.Contents) {

                    const backupFolders: string[] = [];
                    let oldestBackupFolder: string;
                    let compareBackupFolder: string;
                    for (const file of data.Contents) {
                        if (file.Key.indexOf('backup__') !== -1) {
                            compareBackupFolder = file.Key.substr(0, file.Key.indexOf('/'));
                            oldestBackupFolder = (compareBackupFolder < oldestBackupFolder || !oldestBackupFolder)
                                ? compareBackupFolder : oldestBackupFolder;
                            if (backupFolders.indexOf(compareBackupFolder) === -1) {
                                backupFolders.push(compareBackupFolder);
                            }
                        }
                    }

                    if (backupFolders.length >= 5) {
                        const deleteParams = {
                            Bucket: encodeURIComponent(bucket),
                            Delete: {
                                Objects: [{ Key: '' }]
                            }
                        };

                        deleteParams.Delete.Objects = [];
                        for (const file of data.Contents) {
                            if (file.Key.indexOf(oldestBackupFolder) !== -1) {
                                deleteParams.Delete.Objects.push({ Key: file.Key });
                            }
                        }

                        s3.endpoints['eu-west-1'].deleteObjects(deleteParams, (error, response) => {
                            if (error) {
                                reject('Error: Trying to delete oldest backup in ' +  bucket +
                                    ' encountered errors trying to delete: ' + log.formatLogMsg(error));
                            } else {
                                resolve(log.formatLogMsg(bucket + ': ' + backupFolders.length +
                                    ' backup folders found. Deleted folder ' + oldestBackupFolder));
                            }
                        });
                    } else {
                        resolve(log.formatLogMsg(bucket + ': ' + backupFolders.length +
                            ' backup folders so not deleting any (will only delete if 5 or more)'));
                    }
                }
            });

        });

    }

    /**
     * Migrate content from staging bucket to live
     *
     * @return {Promise}
     */
    public migrateBucket(fromBucket: string, toBucket: string) {
        return new Promise<any> ((resolve, reject) => {
            let logContents: string = log.formatLogMsg('MIGRATING S3 CONTENT FROM ' + fromBucket + ' TO ' + toBucket);
            const logFileName: string = 's3' + '__' + fromBucket + '__' + toBucket;

            const backupBucket = this.backupBucket(toBucket);
            backupBucket.then((val) => {
                logContents += val;
                const copyBucket = this.copyBucket(fromBucket, toBucket, '');
                copyBucket.then((val) => {
                    logContents += val;
                    log.createLogFile(logFileName, logContents);
                    resolve(logContents);
                })
                .catch((err) => {
                    logContents += err;
                    log.createLogFile(logFileName, logContents);
                    reject(logContents);
                });
            })
            .catch((err) => {
                logContents += err;
                log.createLogFile(logFileName, logContents);
                reject(logContents);
            });
        });
    }

}
