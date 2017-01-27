import * as Config from 'config';

export default class Codeship {

    /**
     * Listen for Codeship webhooks and notify the channel if
     * the master branch build has failed
     *
     * @param  {SlackBot} bot
     * @param  {WebServer} webserver
     * @return {void}
     */
    public webhooks(bot: SlackBot, webserver: WebServer): void {
        webserver.post('/codeship', (req, res) => {

            const data: CodeshipWebhook = req.body.build;

            if (data.status === 'error' && data.branch === 'master') {

                const message: SlackReply = {
                    channel: Config.get<string>('channels.software.name'),
                    attachments: [
                        {
                            fallback: `Build for ${data.branch} branch on ${data.project_name} has failed.`,
                            color: 'danger',
                            title: 'Build failed',
                            title_link: data.build_url,
                            text: data.message,
                            fields: [
                                {
                                    title: 'Project',
                                    value: data.project_name,
                                    short: true
                                },
                                {
                                    title: 'Branch',
                                    value: data.branch,
                                    short: true
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

interface CodeshipWebhook {
    status: string;
    branch: string;
    project_name: string;
    message: string;
    build_url: string;
}
