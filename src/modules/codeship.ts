import * as Config from 'config';

class Codeship {

    /**
     * Register any webhooks to be listened for
     *
     * @param  {[type]} bot
     * @param  {[type]} webserver
     * @return {void}
     */
    webhooks(bot, webserver) {
        webserver.post('/codeship', (req, res) => {

            let data = req.body.build;

            if (data.status == 'error' && data.branch == 'master') {

                let message = {
                    channel: Config.get('channels.software.name'),
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

export default Codeship;
