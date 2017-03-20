import { expect } from 'chai';
const sinon = require('sinon');
const proxyquire = require('proxyquire');
import * as Config from 'config';
import * as dotenv from 'dotenv';
// const DatabaseMigration = require('./database-migration');
// import DatabaseMigration from './database-migration';
// import * as proxyquire from 'proxyquire';
// import * as sinon from 'sinon';

describe('Database migration', () => {

    // tslint:disable-next-line:mocha-avoid-only
    describe.only('Get replication task status', () => {

        it('gets the status of a database replication task', () => {
            dotenv.config();
            const replicationTask: string = Config.get<string>('website.dms.testing.replication-task-arn');

            console.log('Before Proxyquire');
            const databaseMigration = proxyquire('./database-migration', {
                'aws-sdk': {
                    'DMS': sinon.stub().returns({
                        describeReplicationTasks: () => {
                            console.log('I am the stubbed version');
                            // return { 'data': { 'status': 'running' } };
                        }
                    })
                }
            });
            console.log('After Proxyquire');

            // const databaseMigration = new DatabaseMigration();

            console.log(databaseMigration);

            return databaseMigration.getReplicationTaskStatus(replicationTask).then((response: any) => {
                console.log('RESPONSE: ' + JSON.stringify(response));
                expect(response).to.equal('running');
            });

            // const testValue = databaseMigration.test();
            // expect(testValue).to.equal('hello');

        });

        // it('gets the status of a database replication task', () => {

        //     const dmsStub: any = {};

        //     proxyquire('./database-migration', {
        //         'aws-sdk':
        //             {
        //                 'DMS': dmsStub
        //             }
        //     });

        //     dmsStub.describeReplicationTasks = sinon.stub().returns({
        //         'data': {
        //             'status': 'running'
        //         }
        //     });

        //     dotenv.config();
        //     const dbMigration: DatabaseMigration = new DatabaseMigration();
        //     const replicationTask: string = Config.get<string>('website.dms.testing.replication-task-arn');

        //     return dbMigration.getReplicationTaskStatus(replicationTask).then((response) => {
        //         console.log('RESPONSE: ' + JSON.stringify(response));
        //         expect(response).to.equal('running');
        //     });

        // });

        // it('throws an error if an invalid replication task', () => {

        //     const dmsStub: any = {};

        //     proxyquire('./database-migration', {
        //         '../../node_modules/aws-sdk':
        //             {
        //                 'DMS': sinon.stub().returns(dmsStub)
        //             }
        //     });

        //     dotenv.config();
        //     const dbMigration: DatabaseMigration = new DatabaseMigration();
        //     const replicationTask: string = 'an-invalid-ARN-reference';

        //     return dbMigration.getReplicationTaskStatus(replicationTask).catch((err) => {
        //         // console.log('ERROR: ' + err);
        //         expect(err).to.equal('error');
        //     });

        // });

    });

    // describe('Start replication task', () => {

    //     it('starts a database replication task', () => {

    //         dotenv.config();
    //         const dbMigration: DatabaseMigration = new DatabaseMigration();
    //         const replicationTask: string = Config.get<string>('website.dms.testing.replication-task-arn');

    //         return dbMigration.migrateDatabase(replicationTask).then((response) => {
    //             // console.log('RESPONSE: ' + response);
    //             expect(response).to.equal('Started database replication...');
    //         })
    //         .catch((err) => {
    //             // console.log('ERROR: ' + err);
    //             expect(err).to.equal('Error starting database replication. <https://eu-west-1.console.aws.amazon.com/dms/home?region=eu-west-1#tasks:|See here> and log files for details.');
    //         });

    //     });

    //     it('throws an error if an invalid replication task', () => {

    //         dotenv.config();
    //         const dbMigration: DatabaseMigration = new DatabaseMigration();
    //         const replicationTask: string = 'an-invalid-ARN-reference';

    //         return dbMigration.migrateDatabase(replicationTask).catch((err) => {
    //             // console.log('ERROR: ' + err);
    //             expect(err).to.equal('Error starting database replication. <https://eu-west-1.console.aws.amazon.com/dms/home?region=eu-west-1#tasks:|See here> and log files for details.');
    //         });

    //     });

    // });

});
