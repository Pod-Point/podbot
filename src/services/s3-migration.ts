import * as AWS from 'aws-sdk';
import FileStamp from '../helpers/file-stamp';
import Log from '../helpers/log';
// tslint:disable:no-require-imports
// tslint:disable:no-var-requires
const async = require('async');

const log: Log = new Log();

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

        this.endpoints = {
            'eu-west-1': new AWS.S3({
                region: 'eu-west-1'
            })
        };

    }

    /**
     * Get the list of files in an S3 bucket
     * Allows for multiple calls to AWS if more than 1,000 files in the bucket
     *
     * @param  {string}   bucket
     * @param  {string}   continuationToken
     * @param  {Object[]} fileList
     * @return {Promise}
     */
    public getBucketContents(bucket: string, continuationToken: string = null, fileList: Object[] = []): Promise<any> {
        return new Promise<any> ((resolve, reject) => {
            const endpoints = this.endpoints;
            const listParams: any = {
                Bucket: encodeURIComponent(bucket),
                ContinuationToken: (continuationToken) ? continuationToken : null
            };

            endpoints['eu-west-1'].listObjectsV2(listParams, (err, data) => {
                if (err) {
                    reject('Error');
                } else {
                    if (data.IsTruncated && data.NextContinuationToken) {
                        this.getBucketContents(bucket, data.NextContinuationToken, data.Contents).then((val) => {
                            resolve(fileList.concat(val));
                        })
                        .catch((err) => {
                            reject('Error');
                        });
                    } else {
                        resolve(fileList.concat(data.Contents));
                    }
                }
            });
        });
    }

    /**
     * Copy all content except backup directories from one S3 bucket to another
     *
     * @param  {string} fromBucket
     * @param  {string} toBucket
     * @param  {string} toPrefix
     * @return {Promise}
     */
    public copyBucket(fromBucket: string, toBucket: string, toPrefix: string): Promise<any> {
        return new Promise<any> ((resolve, reject) => {
            let logContents: string = log.formatLogMsg('COPYING FROM ' + fromBucket + ' to ' + toBucket + '/' + toPrefix);
            const endpoints = this.endpoints;

            this.getBucketContents(fromBucket).then((contents) => {
                    async.each(contents, (file: any, callback: any) => {
                        const copyParams: any = {
                            CopySource: encodeURIComponent(fromBucket + '/' + file.Key),
                            Bucket: encodeURIComponent(toBucket),
                            Key: toPrefix + file.Key
                        };
                        if (file.Key.indexOf('backup__') === -1) {
                            endpoints['eu-west-1'].copyObject(copyParams, (error, response) => {
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
            })
            .catch((err: any) => {
                logContents += 'Error: trying to list files in bucket ' + fromBucket + ' ' + log.formatLogMsg(err);
                reject(logContents);
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
    public deleteOldestBackup(bucket: string): Promise<any> {
        const endpoints = this.endpoints;
        return new Promise<any> ((resolve, reject) => {
            this.getBucketContents(bucket).then((contents) => {
                const backupFolders: string[] = [];
                let oldestBackupFolder: string;
                let compareBackupFolder: string;
                for (const file of contents) {
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
                    const deleteFilesList: any = [];
                    for (const file of contents) {
                        if (file.Key.indexOf(oldestBackupFolder) !== -1) {
                            deleteFilesList.push(file);
                        }
                    }
                    const deleteCallsNeeded: number = Math.ceil(deleteFilesList.length / 1000);

                    const deleteParamsArray: any[] = [];
                    for (let count = 0; count < deleteCallsNeeded; count = count + 1) {
                        deleteParamsArray.push({
                            Bucket: encodeURIComponent(bucket),
                            Delete: {
                                Objects: []
                            }
                        });
                    }
                    for (let count = 0; count < deleteFilesList.length; count = count + 1) {
                        deleteParamsArray[Math.floor(count / 1000)].Delete.Objects.push({ Key: deleteFilesList[count].Key });
                    }

                    async.each(deleteParamsArray, (deleteParams: any, callback: any) => {
                        endpoints['eu-west-1'].deleteObjects(deleteParams, (error, response) => {
                            if (error) {
                                reject('Error: Trying to delete oldest backup in ' +  bucket +
                                ' encountered errors trying to delete: ' + log.formatLogMsg(error));
                            } else {
                                callback(null);
                            }
                        });
                    }, (error: any) => {
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
            })
            .catch((err) => {
                reject('Error: Trying to delete oldest backup in ' +  bucket +
                    ' encountered problem getting directory list: ' + log.formatLogMsg(err));
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
