import Base from './base';
import Opsworks from '../services/opsworks';
import Config from 'config';

class Pulls extends Base {

    /**
     * Register any webhooks to be listened for
     *
     * @param  {[type]} webserver
     * @return {void}
     */
    webhooks(bot, webserver) {
        webserver.post('/pulls', (req, res) => {

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

            } else if (hook.action == 'opened') {

                let message = {

                    channel: Config.get('channels.software.name'),
                    unfurl_links: false,
                    text: `[${repo.full_name}] Pull request submitted by <${pr.user.url}|${pr.user.login}>`,
                    attachments: [
                        {
                            fallback: `Pull request submitted by ${pr.user.login}.`,
                            title: `<${pr.html_url}|#${hook.number} ${pr.title}>`,
                            color: 'good',
                            text: pr.body,
                            attachment_type: 'default'
                        }
                    ]
                };

                bot.say(message);

            }

            res.send('OK');
        });
    }
}

export default Pulls;
