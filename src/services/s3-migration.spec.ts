import { expect } from 'chai';
import S3Migration from './s3-migration';
// tslint:disable:no-require-imports
// tslint:disable:no-var-requires
// tslint:disable-next-line:mocha-no-side-effect-code
const AWS = require('aws-sdk-mock');

describe('S3 migration', () => {

    it('gets the contents of a bucket', () => {

        const mockFileList: any = { 'Contents': [] };
        for (let count = 0; count < 1000; count = count + 1) {
            mockFileList.Contents.push({ 'Key': 'dummy-file-name-' + count });
        }
        AWS.mock('S3', 'listObjectsV2', mockFileList);

        const s3Migration: S3Migration = new S3Migration();
        const bucket: string = 'dummy-bucket-name';

        return s3Migration.getBucketContents(bucket, '').then((response) => {
            expect(response.length).to.equal(1000);
            expect(response[0].Key).to.equal('dummy-file-name-0');
            AWS.restore('S3', 'listObjectsV2');
        });

    });

    it('copies the contents of one bucket into another bucket', () => {

        AWS.mock('S3', 'listObjectsV2', {
            'Contents': [
                {
                    'Key': 'a-dummy-file-name'
                },
                {
                    'Key': 'another-dummy-file-name'
                }
            ]
        });
        AWS.mock('S3', 'copyObject', 'success');

        const s3Migration: S3Migration = new S3Migration();
        const fromBucket: string = 'dummy-bucket-from-name';
        const toBucket: string = 'dummy-bucket-to-name';

        return s3Migration.copyBucket(fromBucket, toBucket, '').then((response) => {
            expect(response).to.contain('Succeeded copying files from ' + fromBucket + ' to ' + toBucket);
            AWS.restore('S3', 'listObjectsV2');
            AWS.restore('S3', 'copyObject');
        });

    });

    it('backs up the contents of one bucket into a sub-folder', () => {

        AWS.mock('S3', 'listObjectsV2', {
            'Contents': [
                {
                    'Key': 'a-dummy-file-name'
                },
                {
                    'Key': 'another-dummy-file-name'
                }
            ]
        });
        AWS.mock('S3', 'copyObject', 'success');

        const s3Migration: S3Migration = new S3Migration();
        const bucket: string = 'dummy-bucket-name';

        return s3Migration.backupBucket(bucket).then((response) => {
            expect(response).to.contain('BACKING UP ' + bucket);
            AWS.restore('S3', 'listObjectsV2');
            AWS.restore('S3', 'copyObject');
        });

    });

    it('deletes the oldest backup folder in a bucket', () => {

        AWS.mock('S3', 'listObjectsV2', {
            'Contents': [
                {
                    'Key': 'backup__2017-01-01--01-01-01/dummy-file'
                },
                {
                    'Key': 'backup__2017-01-01--01-01-02/dummy-file'
                },
                {
                    'Key': 'backup__2017-01-01--01-01-03/dummy-file'
                },
                {
                    'Key': 'backup__2017-01-01--01-01-04/dummy-file'
                },
                {
                    'Key': 'backup__2017-01-01--01-01-05/dummy-file'
                }
            ]
        });
        AWS.mock('S3', 'deleteObjects', 'success');

        const s3Migration: S3Migration = new S3Migration();
        const bucket: string = 'dummy-bucket-name';

        return s3Migration.deleteOldestBackup(bucket).then((response) => {
            expect(response).to.contain('backup folders found. Deleted folder');
            AWS.restore('S3', 'listObjectsV2');
            AWS.restore('S3', 'deleteObjects');
        });

    });

    it('doesn\'t delete if fewer than 5 backup folders', () => {

        AWS.mock('S3', 'listObjectsV2', {
            'Contents': [
                {
                    'Key': 'backup__2017-01-01--01-01-01/dummy-file'
                },
                {
                    'Key': 'backup__2017-01-01--01-01-02/dummy-file'
                },
                {
                    'Key': 'backup__2017-01-01--01-01-03/dummy-file'
                },
                {
                    'Key': 'backup__2017-01-01--01-01-04/dummy-file'
                }
            ]
        });

        const s3Migration: S3Migration = new S3Migration();
        const bucket: string = 'dummy-bucket-name';

        return s3Migration.deleteOldestBackup(bucket).then((response) => {
            expect(response).to.contain('4 backup folders so not deleting any');
            AWS.restore('S3', 'listObjectsV2');
        });

    });

    it('migrates content from one bucket to another, dealing with backups', () => {

        AWS.mock('S3', 'listObjectsV2', {
            'Contents': [
                {
                    'Key': 'backup__2017-01-01--01-01-01/dummy-file'
                },
                {
                    'Key': 'backup__2017-01-01--01-01-02/dummy-file'
                },
                {
                    'Key': 'backup__2017-01-01--01-01-03/dummy-file'
                },
                {
                    'Key': 'backup__2017-01-01--01-01-04/dummy-file'
                },
                {
                    'Key': 'backup__2017-01-01--01-01-05/dummy-file'
                }
            ]
        });
        AWS.mock('S3', 'copyObject', 'success');
        AWS.mock('S3', 'deleteObjects', 'success');

        const s3Migration: S3Migration = new S3Migration();
        const fromBucket: string = 'dummy-bucket-from-name';
        const toBucket: string = 'dummy-bucket-to-name';

        return s3Migration.migrateBucket(fromBucket, toBucket).then((response) => {
            expect(response).to.contain('MIGRATING S3 CONTENT FROM ' + fromBucket + ' TO ' + toBucket);
            AWS.restore('S3', 'listObjectsV2');
            AWS.restore('S3', 'copyObject');
            AWS.restore('S3', 'deleteObjects');
        });

    });

});
