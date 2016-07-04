import Deployer from '../helpers/deployer';
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

            if (hook.action == 'closed' && pr.merged === true) {

                let message = {
                    text: `#${hook.number} ${pr.title} was just merged into ${hook.repository.name}`,
                    channel: '#bottesting',
                    attachments: [
                        {
                            title: 'Do you want to deploy this PR?',
                            callback_id: 'deploy-pr',
                            attachment_type: 'default',
                            actions: [
                                {
                                    name: 'yes',
                                    text: ':shipit:',
                                    value: JSON.stringify({
                                        repo: hook.repository.id,
                                        pr: hook.number
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

        let action = message.actions[0];

        if (message.callback_id == 'deploy-pr') {

            let reply = {};
            let value = JSON.parse(action.value);

            if (action.name == 'yes' && Apps.hasOwnProperty(value.repo)) {

                let deployer = new Deployer();

                reply = {
                    text: `Deploying PR #${value.pr} from repo ${value.repo}`,
                    attachments: []
                };

                this.bot.replyInteractive(message, reply);

                deployer.deploy(Apps[value.repo], `PR #${value.pr}`, (err, data) => {

                    if (err) {

                        reply = {
                            text: `Sorry I wasn't able to deploy ${value.pr}`,
                            attachments: []
                        };

                    } else {

                        if (data.DeploymentId) {

                            reply = {
                                text: `Deployed ${value.pr}`,
                                attachments: []
                            };
                        }
                    }

                    this.bot.replyInteractive(message, reply);

                });

            } else {

                reply = {
                    text: 'Ok then :disappointed:',
                    attachments: []
                };

                this.bot.replyInteractive(message, reply);

            }
        }
    }
}

export default PrClosed;
