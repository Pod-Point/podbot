import { expect } from 'chai';
import * as Trello from 'node-trello';
import * as proxyquire from 'proxyquire';
import * as sinon from 'sinon';

describe('Sentry', () => {

    let stub: any;
    let trelloStub: any;
    let sentry: any;

    beforeEach(() => {
        stub = sinon.createStubInstance(Trello);

        trelloStub = sinon.spy(() => {
            return stub;
        });

        const proxiedSentry = proxyquire('./sentry', {
            'node-trello': trelloStub
        }).default;

        sentry = new proxiedSentry();
    });

    it('should relay an exception to Trello', () => {
        const webserver = { post: () => false };
        const req = {
            body: {
                project_name: 'installs',
                url: '',
                message: '',
                event: {
                    metadata: {
                        type: '',
                        value: ''
                    }
                }
            }
        };
        const res = { send: sinon.spy() };

        sinon.stub(webserver, 'post').callsArgWith(1, req, res);
        stub.post = sinon.spy();

        sentry.webhooks(sinon.spy(), webserver);

        expect(trelloStub.called).to.equal(true, 'Trello client not created');

        const params = stub.post.getCall(0).args[1];

        expect(params.idLabels).to.equal('5825f18f84e677fd3647c415', 'Trello card not created');
    });

});
