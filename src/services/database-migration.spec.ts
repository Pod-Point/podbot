import { expect } from 'chai';
import DatabaseMigration from './database-migration';

describe('Database migration', () => {

    it('gets the status of a database replication task', () => {

        // tslint:disable-next-line:no-require-imports
        const AWS = require('aws-sdk-mock');
        AWS.mock('DMS', 'describeReplicationTasks', {
            'ReplicationTasks': [
                {
                    'Status': 'running'
                }
            ]
        });

        const replicationTask: string = 'dummy-ARN-value';
        const databaseMigration = new DatabaseMigration();

        return databaseMigration.getReplicationTaskStatus(replicationTask).then((response: any) => {
            expect(response).to.equal('running');
            AWS.restore('DMS', 'describeReplicationTasks');
        });

    });

    it('returns an error if it gets an unexpected status', () => {

        // tslint:disable-next-line:no-require-imports
        const AWS = require('aws-sdk-mock');
        AWS.mock('DMS', 'describeReplicationTasks', {
            'ReplicationTasks': [
                {
                    'Status': 'dummy-value'
                }
            ]
        });

        const replicationTask: string = 'dummy-ARN-value';
        const databaseMigration = new DatabaseMigration();

        return databaseMigration.getReplicationTaskStatus(replicationTask).catch((response: any) => {
            expect(response).to.equal('error');
            AWS.restore('DMS', 'describeReplicationTasks');
        });

    });

    it('starts a database replication task', () => {

        // tslint:disable-next-line:no-require-imports
        const AWS = require('aws-sdk-mock');
        AWS.mock('DMS', 'startReplicationTask', { 'some': 'data' });

        const replicationTask: string = 'dummy-ARN-value';
        const databaseMigration = new DatabaseMigration();

        return databaseMigration.migrateDatabase(replicationTask).then((response: any) => {
            expect(response).to.equal('In progress...');
            AWS.restore('DMS', 'startReplicationTask');
        });

    });

});
