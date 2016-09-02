import * as Config from 'config';

class Coveralls {

    /**
     * Register any webhooks to be listened for
     *
     * @param  {SlackBot} bot
     * @param  {WebServer} webserver
     * @return {void}
     */
    webhooks(bot: SlackBot, webserver: WebServer): void {
        webserver.post('/coveralls', (req, res) => {

            let data: CoverallsWebhook = req.body;

            if (data.branch === 'master') {

                let message: SlackReply = {
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
                                    short: true
                                },
                                {
                                    title: 'Change',
                                    value: `${data.coverage_change}%`,
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

interface CoverallsWebhook {
    branch: string;
    coverage_change: number;
    repo_name: string;
    commit_message: string;
    url: string;
}

export default Coveralls;
