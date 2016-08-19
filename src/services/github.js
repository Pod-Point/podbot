import Github from 'github';

class Github {

    /**
     * Perform api functions on Github
     *
     * @return {void}
     */
    constructor() {

        this.github = new Github({
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
     * Returns a deploy comment for the last closed PR from a repo
     *
     * @param  {string} repo
     * @return {string|false}
     */
    getLastPrComment(repo) {

        let pulls = this.github.pullRequests.getAll({
            user: 'Pod-Point',
            user: repo,
            state: 'closed',
            per_page: 1
        });

        return pulls.length ? `${pulls[0].number} ${pulls[0].title}` : false;
    }
}

export default Opsworks;
