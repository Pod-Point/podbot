import Github from './github';
import { expect } from 'chai';
import * as GithubApi from 'github';
import * as proxyquire from 'proxyquire';
import * as sinon from 'sinon';

describe('GithubService', () => {

    let stub: any;
    let GithubApiStub: any;
    let Github: any;

    beforeEach(() => {

        stub = sinon.createStubInstance(GithubApi);

        GithubApiStub = sinon.spy(() => {
            return stub;
        });

        const ProxiedGithub = proxyquire('./github', {
            'github': GithubApiStub
        }).default;

        Github = new ProxiedGithub();
    });

    it('should create new api client', () => {
        expect(GithubApiStub.called).to.be.true;
    });

    it('should get the last closed PR', () => {
        let pr = { getAll: () => {} };
        let prStub = sinon.stub(pr, 'getAll').returns(42);
        stub.pullRequests = pr;

        expect(Github.getLastPr('test')).to.equal(42);
    });

});
