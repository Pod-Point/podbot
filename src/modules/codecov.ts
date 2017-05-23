import * as Config from 'config';

export default class Codecov {

    /**
     * Listen for CodeCov webhooks and notify the channel if
     * coverage has decreased
     *
     * @param  {SlackBot} bot
     * @param  {WebServer} webserver
     * @return {void}
     */
    public webhooks(bot: SlackBot, webserver: WebServer): void {
        webserver.post('/codecov', (req, res) => {

            const data: CodecovWebhook = req.body;

            if (data.branch === 'master') {

                const message: SlackReply = {
                    channel: Config.get<string>('channels.software.name'),
                    attachments: [
                        {
                            fallback: `Code coverage decreased by ${data.coverage} for ${data.branch} branch on ${data.repo}.`,
                            color: 'danger',
                            title: 'Code coverage has decreased',
                            title_link: `https://codecov.io/gh/Pod-Point/${data.repo}`,
                            text: data.commitid,
                            fields: [
                                {
                                    title: 'Project',
                                    value: data.repo,
                                    short: true,
                                },
                                {
                                    title: 'Change',
                                    value: `${data.coverage}%`,
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

interface CodecovWebhook {
    branch: string;
    coverage: number;
    repo: string;
    commitid: string;
}
