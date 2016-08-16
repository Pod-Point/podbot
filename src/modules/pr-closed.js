import Base from './base';
import Opsworks from '../services/opsworks';
import Config from 'config';

class PrClosed extends Base {

    /**
     * Register any webhooks to be listened for
     *
     * @param  {[type]} webserver
     * @return {void}
     */
    webhooks(bot, webserver) {
        webserver.post('/pr_closed', (req, res) => {

            const hook = req.body;
            const pr = hook.pull_request;
            const repo = hook.repository;

            const app = Config.get('apps').find((app) => {
                return app.repo == repo.name;
            });

            if (hook.action == 'closed' && pr.merged === true) {

                let message = {

                    channel: Config.get('channels.software.name'),
                    unfurl_links: false,
                    attachments: [
                        {
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

export default PrClosed;
