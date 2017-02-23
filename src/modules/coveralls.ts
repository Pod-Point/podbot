import * as Config from 'config';

export default class Coveralls {

    /**
     * Listen for Coveralls webhooks and notify the channel if
     * the coverage has decreased
     *
     * @param  {SlackBot} bot
     * @param  {WebServer} webserver
     * @return {void}
     */
    public webhooks(bot: SlackBot, webserver: WebServer): void {
        webserver.post('/coveralls', (req, res) => {

            const data: CoverallsWebhook = req.body;

            if (data.branch === 'master') {

                const message: SlackReply = {
                    channel: Config.get<string>('channels.software.name'),
                    attachments: [
                        {
                            fallback: `Code coverage decreased by ${data.coverage_change} for ${data.branch} branch on ${data.repo_name}.`,
                            color: 'danger',
                            title: 'Code coverage has decreased',
                            title_link: data.url,
                            text: data.commit_message,
                            fields: [
                                {
                                    title: 'Project',
                                    value: data.repo_name,
                                    short: true,
                                },
                                {
                                    title: 'Change',
                                    value: `${data.coverage_change}%`,
                                    short: true,
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

interface CoverallsWebhook {
    branch: string;
    coverage_change: number;
    repo_name: string;
    commit_message: string;
    url: string;
}
