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
        let payload = JSON.parse(message.payload);

        if (message.callback_id == 'deploy-pr') {

            let reply = {};

            if (action.name == 'yes') {

                let value = JSON.parse(action.value);

                if (Apps.hasOwnProperty(value.repo)) {

                    let deployer = new Deployer();

                    deployer.deploy(Apps[value.repo], `PR #${value.pr}`, (err, data) => {

                        if (err) {

                            reply = {
                                text: payload.original_message.text,
                                attachments: [
                                    {
                                        color: 'danger',
                                        text: `Sorry I wasn't able to deploy ${value.pr}`
                                    }
                                ]
                            };

                        } else {

                            if (data.DeploymentId) {

                                reply = {
                                    text: payload.original_message.text,
                                    attachments: [
                                        {
                                            color: 'good',
                                            text: `Deploying PR #${value.pr} from repo ${value.repo}...`
                                        }
                                    ]
                                };
                            }
                        }
                    });

                } else {

                    reply = {
                        text: payload.original_message.text,
                        attachments: [
                            {
                                color: 'warning',
                                text: `Sorry I dont know how to deploy ${value.repo} :disappointed:`
                            }
                        ]
                    };

                }

            } else {

                reply = {
                    text: payload.original_message.text,
                    attachments: []
                };

            }

            this.bot.replyInteractive(message, reply);
        }
    }
}

export default PrClosed;
