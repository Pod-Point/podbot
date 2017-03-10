import * as AWS from 'aws-sdk';
import Log from '../services/log';

export default class S3 {

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
     * For testing only
     *
     */
    public test() {
        return new Promise<any> ((resolve, reject) => {

            const util = require('util');
            AWS.config.region = 'eu-west-1';
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

            const params {
                Bucket: 'podpoint-podbot-logs-test',
                Key: 'abc123',
                Body: 'My test log'
            }
            this.endpoints['eu-west-1'].putObject(params, (err, data) => {
                if (err) console.log(err, err.stack); // an error occurred
                else console.log(data);           // successful response
            });

        });
    }

    /**
     * Copy new/changed content from one S3 bucket to another
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
            AWS.config.region = 'eu-west-1';
            const listParams = {
                Bucket: encodeURIComponent(fromBucket)
            };
            let copyErrors: string[] = [];
            let copySuccess: string[] = [];

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
                        s3.endpoints['eu-west-1'].copyObject(copyParams, (error, response) => {
                            if (error) {
                                copyErrors.push('Error: ' + file.Key + ' ' + error.toString());
                            } else {
                                copySuccess.push('Success: ' + file.Key);
                            }
                            callback(null);
                        });
                    }, (err) => {
                        if (err) {
                            // copyErrors.push(err);
                            return next(err);
                            console.log(err);
                        } else {
                            console.log('success'); 
                        }

                        const log: Log = new Log();
                        const logFileName: string = 's3' + '__' + fromBucket + '__' + toBucket;
                        const createLogFile: any = log.createLogFile(logFileName, copySuccess.join('\n') + copyErrors.join('\n'));
                        createLogFile.then((val: any) => {
                            console.log(val);
                            console.log('FINISHED. ERRORS: ' + copyErrors.toString() + ' SUCCESSES: ' + copySuccess.toString());
                            resolve('Success! Pushed ' + copySuccess.length + ' files on S3, ' + copyErrors.length + ' errors');
                        })
                        .catch((err: any) => {
                            console.log(err);
                            console.log('FINISHED. ERRORS: ' + copyErrors.toString() + ' SUCCESSES: ' + copySuccess.toString());
                            reject('Pushed ' + copySuccess.length + ' files on S3, ' + copyErrors.length + ' errors\nLogging failed');
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
            const currentDate = new Date();
            const dateTimeStamp: string =
                currentDate.getFullYear() + '-' +
                ('0' + (currentDate.getMonth() + 1)).slice(-2) + '-' +
                currentDate.getDate() + '--' +
                currentDate.getHours() + '-' +
                ('0' + currentDate.getMinutes()).slice(-2) + '-' +
                ('0' + currentDate.getSeconds()).slice(-2);
            const copyBucket = this.copyBucket(bucket, bucket, 'backup__' + dateTimeStamp + '/');
            copyBucket.then((val: string) => {
                resolve(val);
            })
            .catch((err) => {
                reject(val);
            });
        });

    }

}
