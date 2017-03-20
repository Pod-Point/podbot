import { expect } from 'chai';
import * as AWS from 'aws-sdk';
import * as Config from 'config';
import S3Migration from './s3-migration';
import * as dotenv from 'dotenv';
import * as proxyquire from 'proxyquire';
import * as sinon from 'sinon';

describe('S3 migration', () => {

    describe('Copy bucket', () => {

        it('copies the contents of one bucket into another bucket', () => {

            dotenv.config();
            const s3Migration: S3Migration = new S3Migration();
            const fromBucket: string = Config.get<string>('website.s3.testing.staging');
            const toBucket: string = Config.get<string>('website.s3.testing.live');

            return s3Migration.copyBucket(fromBucket, toBucket, '').then((response) => {
                // console.log('RESPONSE: ' + response);
                expect(response).to.contain('Succeeded copying files from ' + fromBucket + ' to ' + toBucket);
            });

        });

    });

    describe('Back up bucket', () => {

        it('backs up the contents of one bucket into a sub-folder', () => {

            dotenv.config();
            const s3Migration: S3Migration = new S3Migration();
            const bucket: string = Config.get<string>('website.s3.testing.live');

            return s3Migration.backupBucket(bucket).then((response) => {
                // console.log('RESPONSE: ' + response);
                expect(response).to.contain('BACKING UP ' + bucket);
            });

        });

    });

    describe('Delete oldest backup', () => {

        it('deletes the oldest backup folder in a bucket', () => {

            dotenv.config();
            const s3Migration: S3Migration = new S3Migration();
            const bucket: string = Config.get<string>('website.s3.testing.live');

            return s3Migration.deleteOldestBackup(bucket).then((response) => {
                // console.log('RESPONSE: ' + response);
                expect(response).to.contain('backup folders found');
            });

        });

    });

    describe('Migrate bucket', () => {

        it('migrates content from one bucket to another, dealing with backups', () => {

            dotenv.config();
            const s3Migration: S3Migration = new S3Migration();
            const fromBucket: string = Config.get<string>('website.s3.testing.staging');
            const toBucket: string = Config.get<string>('website.s3.testing.live');

            return s3Migration.migrateBucket(fromBucket, toBucket).then((response) => {
                // console.log('RESPONSE: ' + response);
                expect(response).to.contain('MIGRATING S3 CONTENT FROM ' + fromBucket + ' TO ' + toBucket);
            });

        });

    });

});
