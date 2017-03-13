import * as AWS from 'aws-sdk';
import * as Config from 'config';
import FileStamp from '../modules/file-stamp';
import Log from '../modules/log';

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
            const s3 = this;
            const async = require('async');
            const util = require('util');
            const listParams = {
                Bucket: encodeURIComponent(fromBucket)
            };
            let errors: string[] = [];
            let successes: string[] = [];

            s3.endpoints['eu-west-1'].listObjectsV2(listParams, (err, data) => {
                if (err) {
                    console.log('ERROR: ' + util.inspect(err, {showHidden: false, depth: null}));
                    reject(err.message);
                } else if (data.Contents) {
                    console.log('DATA: ' + util.inspect(data, {showHidden: false, depth: null}));
                    async.each(data.Contents, (file, callback) => {
                        console.log('FILE: ' + file.Key);
                        const copyParams = {
                            CopySource: encodeURIComponent(fromBucket + '/' + file.Key),
                            Bucket: encodeURIComponent(toBucket),
                            Key: toPrefix + file.Key
                        };
                        if (file.Key.indexOf('backup__') === -1) {
                            s3.endpoints['eu-west-1'].copyObject(copyParams, (error, response) => {
                                if (error) {
                                    errors.push('Error: ' + file.Key + ' ' + error.toString());
                                } else {
                                    successes.push('Success: ' + file.Key);
                                }
                                callback(null);
                            });
                        } else {
                            callback(null);
                        }
                    }, (err: string) => {
                        if (err) {
                            // errors.push(err);
                            return next(err);
                            console.log(err);
                        } else {
                            console.log('success'); 
                        }

                        const log: Log = new Log();
                        const logFileName: string = 's3' + '__' + fromBucket + '__' + toBucket;
                        const createLogFile: any = log.createLogFile(logFileName, successes.join('\n') + errors.join('\n'));
                        createLogFile.then((val: any) => {
                            console.log(val);
                            console.log('FINISHED. ERRORS: ' + errors.toString() + ' SUCCESSES: ' + successes.toString());
                            resolve('Success! Pushed ' + successes.length + ' files on S3, ' + errors.length + ' errors');
                        })
                        .catch((err: any) => {
                            console.log(err);
                            console.log('FINISHED. ERRORS: ' + errors.toString() + ' SUCCESSES: ' + successes.toString());
                            reject('Pushed ' + successes.length + ' files on S3, ' + errors.length + ' errors\nLogging failed');
                        });
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
            const fileStamp = new FileStamp();
            const copyBucket = this.copyBucket(bucket, bucket, 'backup__' + fileStamp.dateTime() + '/');
            copyBucket.then((val: string) => {
                resolve(val);
            })
            .catch((err) => {
                reject(val);
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
            let deleteErrors: string[] = [];
            let deleteSuccess: string[] = [];

            s3.endpoints['eu-west-1'].listObjectsV2(listParams, (err, data) => {
                if (err) {
                    // console.log('ERROR: ' + util.inspect(err, {showHidden: false, depth: null}));
                    reject(err.message);
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
                                reject(error.toString());
                            } else {
                                resolve(countBackupFolders + ' backup folders found. Deleted folder ' + oldestBackupFolder);
                            }
                        });
                    } else {
                        reject(backupFolders.length + ' backup folders so not deleting any (will only delete if 5 or more)');
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
    public deployWebsiteS3() {
        return new Promise<any> ((resolve, reject) => {
            const copyBucket = this.copyBucket(this.stagingBucket, this.liveBucket, '');
            copyBucket.then((val) => {
                resolve(val);
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

}
