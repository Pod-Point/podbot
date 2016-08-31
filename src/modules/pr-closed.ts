import Opsworks from '../services/opsworks';
import * as Config from 'config';
import App from '../interfaces/app';

class PrClosed {

    /**
     * Register any webhooks to be listened for
     *
     * @param  {slackBot} bot
     * @param  {webServer} webserver
     * @return {void}
     */
    webhooks(bot: slackBot, webserver: webServer): void {
        webserver.post('/pr_closed', (req, res) => {

            const hook: GithubPrWebhook = req.body;
            const pr = hook.pull_request;
            const repo = hook.repository;

            const app = Config.get<Array<App>>('apps').find((app) => {
                return app.repo === repo.name;
            });

            if (hook.action === 'closed' && pr.merged === true) {

                let message: slackReply = {

                    channel: Config.get<string>('channels.software.name'),
                    unfurl_links: false,
                    attachments: [
                        {
                            fallback: `${pr.title} by ${pr.user.login} has been merged.`,
                            title: `<${pr.html_url}|#${hook.number} ${pr.title}> by <${pr.user.html_url}|${pr.user.login}>`,
                            text: 'Do you want to deploy this PR?',
                            callback_id: 'deploy',
                            attachment_type: 'default',
                            actions: [
                                {
                                    name: 'all',
                                    text: ':shipit:',
                                    value: JSON.stringify({
                                        app: app.name,
                                        comment: pr.title
                                    }),
                                    style: 'primary',
                                    type: 'button'
                                },
                                {
                                    name: 'cancel',
                                    text: ':thumbsdown:',
                                    style: 'danger',
                                    type: 'button'
                                }
                            ]
                        }
                    ]
                };

                bot.say(message);

            }

            res.send('OK');
        });
    }
}

interface GithubPrWebhook {
    action: string;
    number: number;
    pull_request: {
        merged: boolean;
        title: string;
        html_url: string;
        user: {
            login: string;
            html_url: string;
        };
    };
    repository: {
        name: string;
    };
}

export default PrClosed;
