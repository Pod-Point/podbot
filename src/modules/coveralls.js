import Base from './base';

class Coveralls extends Base {

    /**
     * Register any webhooks to be listened for
     *
     * @param  {[type]} bot
     * @param  {[type]} webserver
     * @return {void}
     */
    webhooks(bot, webserver) {
        webserver.post('/coveralls', (req, res) => {

            let data = req.body;

            if (data.branch == 'master') {

                let message = {

                    channel: '#bottesting',
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

export default Coveralls;
