import Opsworks from '../api/opsworks';
import Apps from '../../data/apps';

class PrClosed {

    constructor(bot) {
        this.bot = bot;
    }

    /**
     * Register any webhooks to be listened for
     *
     * @param  {[type]} webserver
     * @return {void}
     */
    registerWebhooks(webserver) {
        webserver.post('/pr_closed', (req, res) => {

            let hook = req.body;
            let pr = hook.pull_request;
            let repo = hook.repository;

            if (hook.action == 'closed' && pr.merged === true) {

                let message = {

                    channel: '#bottesting',
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

                this.bot.say(message);

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
    registerCallbacks(message) {

        if (message.callback_id == 'deploy-pr') {

            let action = message.actions[0];

            if (action.name == 'yes') {

                let data = JSON.parse(action.value);
                let app = Apps.find((app) => {
                    return app.repo = data.repo;
                });

                if (app) {

                    let opsworks = new Opsworks(this.bot, message);
                    opsworks.deploy(app, `${data.pr} ${data.title}`);

                } else {

                    this.bot.replyInteractive(message, {
                        attachments: [
                            {
                                color: 'warning',
                                title: `Sorry I dont know how to deploy ${data.repo} :disappointed:`
                            }
                        ]
                    });

                }

            } else {

                this.bot.replyInteractive(message, {
                    attachments: [{}]
                });

            }
        }
    }
}

export default PrClosed;
