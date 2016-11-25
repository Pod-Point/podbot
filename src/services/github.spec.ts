import { expect } from 'chai';
import * as GithubApi from 'github';
import * as proxyquire from 'proxyquire';
import * as sinon from 'sinon';

describe('GithubService', () => {

    let stub: any;
    let githubApiStub: any;
    let github: any;

    beforeEach(() => {
        stub = sinon.createStubInstance(GithubApi);

        githubApiStub = sinon.spy(() => {
            return stub;
        });

        const proxiedGithub = proxyquire('./github', {
            'github': githubApiStub
        }).default;

        github = new proxiedGithub();
    });

    it('should create new api client', () => {
        expect(githubApiStub.called).to.equal(true, 'API client not created');
    });

    it('should get the last closed PR', () => {
        const pr = { getAll: () => false };
        sinon.stub(pr, 'getAll').returns(42);
        stub.pullRequests = pr;

        expect(github.getLastPr('test')).to.equal(42, 'Did not get the last PR');
    });

});
