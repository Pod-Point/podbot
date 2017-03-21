import { expect } from 'chai';
import DatabaseMigration from './database-migration';
const AWS = require('aws-sdk-mock');

describe('Database migration', () => {

    describe('Get replication task status', () => {

        it('gets the status of a database replication task', () => {

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
                AWS.restore('DMS');
            });

        });

        it('returns an error if it gets an unexpected status', () => {

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
                AWS.restore('DMS');
            });

        });

    });

    describe('Start replication task', () => {

        it('starts a database replication task', () => {

            AWS.mock('DMS', 'startReplicationTask', { 'some': 'data' });

            const replicationTask: string = 'dummy-ARN-value';
            const databaseMigration = new DatabaseMigration();

            return databaseMigration.migrateDatabase(replicationTask).then((response: any) => {
                expect(response).to.equal('Started database replication...');
                AWS.restore('DMS');
            });

        });

    });

});
