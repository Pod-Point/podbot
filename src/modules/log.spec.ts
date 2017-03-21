import { expect } from 'chai';
import Log from '../modules/log';
import * as sinon from 'sinon';

describe('Log', () => {

    describe('Create log file', () => {

        it('saves a log file', () => {

            const logFileName: string = 'test';
            const logContent: string = 'Dummy log contents\nand some more more';
            const log: Log = new Log();

            return log.createLogFile(logFileName, logContent).then((response) => {
                expect(response).to.equal(log.formatLogMsg('Log file created'));
            });

        });

    });

    describe('Format a log message', () => {

        it('formats a log message into a one-line string with line break', () => {

            const logMessage = {
                'Some': {
                    'dummy': {
                        'content': { }
                    }
                }
            };
            const log: Log = new Log();
            const response = log.formatLogMsg(logMessage);
            expect(response).to.equal('{"Some":{"dummy":{"content":{}}}}\n');

        });

    });

});
