/// <reference path="../typings/github.d.ts" />
import * as GithubApi from 'github';

class Github {

    private github: GithubApi;

    /**
     * Perform api functions on Github
     *
     * @return {void}
     */
    constructor() {

        this.github = new GithubApi({
            debug: true,
            protocol: 'https',
            host: 'api.github.com',
            headers: {
                'user-agent': 'PodBot'
            }
        });

        this.github.authenticate({
            type: 'oauth',
            token: process.env.GITHUB_TOKEN
        });
    }

    /**
     * Returns the last closed PR from a repo
     *
     * @param  {string} repo
     * @return {Promise}
     */
    getLastPr(repo: string): Promise<Array<any>> {

        return this.github.pullRequests.getAll({
            user: 'Pod-Point',
            repo: repo,
            state: 'closed',
            per_page: 1
        });

    }
}

export default Github;
