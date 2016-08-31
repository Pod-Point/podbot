import * as Config from 'config';

class Codeship {

    /**
     * Register any webhooks to be listened for
     *
     * @param  {slackBot} bot
     * @param  {webServer} webserver
     * @return {void}
     */
    webhooks(bot: slackBot, webserver: webServer): void {
        webserver.post('/codeship', (req, res) => {

            let data: CodeshipWebhook = req.body.build;

            if (data.status === 'error' && data.branch === 'master') {

                let message: slackMessage = {
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

export default Codeship;
