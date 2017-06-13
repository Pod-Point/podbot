import * as Config from 'config';
import Module from '../interfaces/module';

export default class Travis implements Module {

    /**
     * Listen for Travis CI webhooks
     *
     * @param  {SlackBot} bot
     * @param  {WebServer} webserver
     * @return {void}
     */
    public webhooks(bot: SlackBot, webserver: WebServer): void {
        webserver.post('/travis', (req, res) => {

            const data: TravisWebhook = JSON.parse(req.body.payload);

            if (data.branch === 'master' && data.status === 1) {

                const message: SlackReply = {
                    channel: Config.get<string>('channels.software.name'),
                    attachments: [
                        {
                            fallback: `Build for ${data.branch} branch on ${data.repository.name} has failed.`,
                            color: 'danger',
                            title: 'Build failed',
                            title_link: data.build_url,
                            text: data.message,
                            fields: [
                                {
                                    title: 'Project',
                                    value: data.repository.name,
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

interface TravisWebhook {
    branch: string;
    repository: {
        name: string;
    };
    message: string;
    build_url: string;
    status: number;
}
