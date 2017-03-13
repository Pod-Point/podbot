import * as AWS from 'aws-sdk';
import * as Config from 'config';
import FileStamp from '../modules/file-stamp';
import Log from '../modules/log';

const log = new Log();

export default class S3 {

    private env: string;
    private stagingBucket: string;
    private liveBucket: string;
    private endpoints: { [key: string]: AWS.S3 };

    /**
     * Perform api functions on AWS S3
     *
     * @return {void}
     */
    constructor() {
        this.env = (process.env.ENV === 'production') ? 'production' : 'testing';
        this.stagingBucket = Config.get<string>('website.s3.' + this.env + '.staging');
        this.liveBucket = Config.get<string>('website.s3.' + this.env + '.live');

        AWS.config.update({
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        });

        AWS.config.region = 'eu-west-1';

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
     * For testing only
     *
     */
    public test() {
        return new Promise<any> ((resolve, reject) => {

            const util = require('util');
            // let message: string = "default";
            // let params: any = {
            //     Bucket: 'podpoint-website-dev'
            // };

            // this.endpoints['eu-west-1'].getBucketLocation(params, (err, data) => {
            //     if (err) {
            //         console.log('ERROR: ' + util.inspect(err, {showHidden: false, depth: null}));
            //         reject(err.message);
            //     } else if (data.LocationConstraint) {
            //         console.log('DATA: ' + util.inspect(data, {showHidden: false, depth: null}));
            //         resolve(data.LocationConstraint);
            //     }
            // });

            // const params = {
            //     Bucket: 'podpoint-podbot-logs-test',
            //     Key: 'abc123',
            //     Body: 'My test log'
            // }
            // this.endpoints['eu-west-1'].putObject(params, (err, data) => {
            //     if (err) console.log(err, err.stack); // an error occurred
            //     else console.log(data);           // successful response
            // });

            // const testFolder = '../';
            // const fs = require('fs');
            // fs.readdir(testFolder, (err, files) => {
            //     files.forEach(file => {
            //         console.log(file);
            //     });
            // })

            // const fs = require('fs');
            // const logsDir: string = __dirname + process.env.WEBSITE_DEPLOY_LOGS_DIR ? process.env.WEBSITE_DEPLOY_LOGS_DIR : Config.get<string>('website.logging.' + this.env + '.directory');
            // console.log(logsDir);
            // if (!fs.existsSync(logsDir)){
            //     fs.mkdirSync(logsDir);
            // }
            // fs.writeFile(logsDir + '/' + 'testlog.log', "Hey there!", function(err) {
            //     if(err) {
            //         return console.log(err);
            //     }

            //     console.log("The file was saved!");
            // });

            // const deployWebsite = this.deployWebsite();
            // deployWebsite.then((val) => {
            //     resolve(val);
            // })
            // .catch((err) => {
            //     reject(err);
            // });
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
    public copyBucket(fromBucket: string, toBucket: string, toPrefix: string) {
        return new Promise<any> ((resolve, reject) => {
            let logContents: string = log.formatLogMsg('COPYING FROM ' + fromBucket + ' to ' + toBucket + '/' + toPrefix);
            const s3 = this;
            const async = require('async');
            const util = require('util');
            const listParams = {
                Bucket: encodeURIComponent(fromBucket)
            };

            s3.endpoints['eu-west-1'].listObjectsV2(listParams, (err, data) => {
                if (err) {
                    console.log('ERROR: ' + util.inspect(err, {showHidden: false, depth: null}));
                    logContents += 'Error: trying to list files in bucket ' + fromBucket + ' ' + log.formatLogMsg(err);
                    reject(logContents);
                } else if (data.Contents) {
                    console.log('DATA: ' + util.inspect(data, {showHidden: false, depth: null}));
                    async.each(data.Contents, (file: any, callback: any) => {
                        console.log('FILE: ' + file.Key);
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
                    }, (err) => {
                        if (err) {
                            // return next(err);
                            console.log(err);
                            logContents += 'Error: copying files from ' + fromBucket + ' to ' + toBucket + ' ' + log.formatLogMsg(err);
                            reject(logContents);
                        } else {
                            console.log('success');
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
                    // console.log("HERE: " + val);
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
        return new Promise<any> ((resolve, reject) => {
            const s3 = this;
            const async = require('async');
            const util = require('util');
            const listParams = {
                Bucket: encodeURIComponent(bucket)
            };

            s3.endpoints['eu-west-1'].listObjectsV2(listParams, (err, data) => {
                if (err) {
                    // console.log('ERROR: ' + util.inspect(err, {showHidden: false, depth: null}));
                    reject('Error: Trying to delete oldest backup in ' +  bucket + ' encountered problem getting directory list: ' + log.formatLogMsg(err));
                } else if (data.Contents) {
                    // console.log('DATA: ' + util.inspect(data, {showHidden: false, depth: null}));

                    let backupFolders: string[] = [];
                    let oldestBackupFolder: string;
                    let compareBackupFolder: string;
                    for (const file of data.Contents) {
                        if (file.Key.indexOf('backup__') !== -1) {
                            compareBackupFolder = file.Key.substr(0, file.Key.indexOf('/'));
                            oldestBackupFolder = (compareBackupFolder < oldestBackupFolder || !oldestBackupFolder) ? compareBackupFolder : oldestBackupFolder;
                            if (backupFolders.indexOf(compareBackupFolder) === -1) {
                                backupFolders.push(compareBackupFolder);
                            }
                        }
                    }
                    console.log("BACKUP FOLDERS: " + backupFolders.toString());
                    console.log("OLDEST BACKUP FOLDER: " + oldestBackupFolder);

                    if (backupFolders.length >= 5) {
                        const deleteParams = {
                            Bucket: encodeURIComponent(bucket),
                            Delete: {
                                Objects: []
                            }
                        };

                        for (const file of data.Contents) {
                            if (file.Key.indexOf(oldestBackupFolder) !== -1) {
                                deleteParams.Delete.Objects.push({ Key: file.Key });
                            }
                        }

                        console.log('FILES TO DELETE: ' + util.inspect(deleteParams, {showHidden: false, depth: null}));

                        s3.endpoints['eu-west-1'].deleteObjects(deleteParams, (error, response) => {
                            if (error) {
                                reject('Error: Trying to delete oldest backup in ' +  bucket + ' encountered errors trying to delete: ' + log.formatLogMsg(error));
                            } else {
                                resolve(log.formatLogMsg(bucket + ': ' + backupFolders.length + ' backup folders found. Deleted folder ' + oldestBackupFolder));
                            }
                        });
                    } else {
                        resolve(log.formatLogMsg(bucket + ': ' + backupFolders.length + ' backup folders so not deleting any (will only delete if 5 or more)'));
                    }

                }
            });

        });

    }

    /**
     * Deploy content from staging bucket to live
     *
     * @return {Promise}
     */
    public deployWebsite() {
        return new Promise<any> ((resolve, reject) => {
            let logContents: string = log.formatLogMsg('COPYING S3 CONTENT FROM ' + this.stagingBucket + ' to ' + this.liveBucket);
            const logFileName: string = 's3' + '__' + this.stagingBucket + '__' + this.liveBucket;

            const backupBucket = this.backupBucket(this.liveBucket);
            backupBucket.then((val) => {
                logContents += val;
                const copyBucket = this.copyBucket(this.stagingBucket, this.liveBucket, '');
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
