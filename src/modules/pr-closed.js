import Base from './base';
import Opsworks from '../services/opsworks';
import Apps from '../../data/apps';

class PrClosed extends Base {

    /**
     * Register any webhooks to be listened for
     *
     * @param  {[type]} webserver
     * @return {void}
     */
    webhooks(bot, webserver) {
        webserver.post('/pr_closed', (req, res) => {

            let hook = req.body;
            let pr = hook.pull_request;
            let repo = hook.repository;

            if (hook.action == 'closed' && pr.merged === true) {

                let message = {

                    channel: '#software-dev',
                    unfurl_links: false,
                    attachments: [
                        {
                            title: `<${pr.html_url}|#${hook.number} ${pr.title}> by <${pr.user.html_url}|${pr.user.login}>`,
                            text: 'Do you want to deploy this PR?',
                            callback_id: 'deploy-pr',
                            attachment_type: 'default',
                            actions: [
                                {
                                    name: 'yes',
                                    text: ':shipit:',
                                    value: JSON.stringify({
                                        repo: repo.id,
                                        pr: hook.number,
                                        title: pr.title
                                    }),
                                    style: 'primary',
                                    type: 'button'
                                },
                                {
                                    name: 'no',
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

    /**
     * Register any message callbacks to be listened for
     *
     * @param  {[type]} message
     * @return {void}
     */
    callbacks(bot, message) {

        if (message.callback_id == 'deploy-pr') {

            let action = message.actions[0];

            if (action.name == 'yes') {

                let data = JSON.parse(action.value);
                let app = Apps.find((app) => {
                    return app.repo == data.repo;
                });

                if (app) {

                    let opsworks = new Opsworks(bot.replyInteractive, message);
                    opsworks.deploy(app, `${data.pr} ${data.title}`);

                } else {

                    bot.replyInteractive(message, {
                        attachments: [
                            {
                                color: 'warning',
                                title: `Sorry I dont know how to deploy ${data.repo} :disappointed:`
                            }
                        ]
                    });

                }

            } else {

                bot.replyInteractive(message, {
                    attachments: [{}]
                });

            }
        }
    }
}

export default PrClosed;
