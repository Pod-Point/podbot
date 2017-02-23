import * as Config from 'config';
import App from '../interfaces/app';

export default class PrClosed {

    /**
     * Listen for PR closed Github webhooks
     *
     * @param  {SlackBot} bot
     * @param  {WebServer} webserver
     * @return {void}
     */
    public webhooks(bot: SlackBot, webserver: WebServer): void {
        webserver.post('/pr_closed', (req, res) => {

            const hook: GithubPrWebhook = req.body;
            const pr = hook.pull_request;
            const repo = hook.repository;

            const app = Config.get<App[]>('apps').find(app => {
                return app.repo === repo.name;
            });

            if (hook.action === 'closed' && pr.merged === true) {

                const message: SlackReply = {

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
                                        comment: pr.title,
                                    }),
                                    style: 'primary',
                                    type: 'button',
                                },
                                {
                                    name: 'cancel',
                                    text: ':thumbsdown:',
                                    style: 'danger',
                                    type: 'button',
                                },
                            ],
                        },
                    ],
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
