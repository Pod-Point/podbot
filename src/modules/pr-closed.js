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
            let repo = hook.repository;

            if (hook.action == 'closed' && pr.merged === true) {

                let message = {
                    text: `#${hook.number} ${pr.title} was just merged into ${repo.name}`,
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
                                        repo: repo.id,
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

        if (message.callback_id == 'deploy-pr') {

            let attachments = [];
            let action = message.actions[0];

            if (action.name == 'yes') {

                let value = JSON.parse(action.value);
                let repo = value.repo;
                let pr = value.pr;

                let app = Apps.find((app) => {
                    return app.repo = repo;
                });

                if (app) {

                    let deployer = new Deployer();

                    app.stacks.forEach((stack) => {

                        deployer.deploy(stack, `PR #${pr}`, (err, data) => {

                            if (err) {
                                attachments.push({
                                    color: 'danger',
                                    title: `Sorry I wasn't able to deploy ${app.name} to ${stack.name}`
                                });
                            } else {
                                if (data.DeploymentId) {
                                    let uri = `https://console.aws.amazon.com/opsworks/home?#/stack/${stack.stackId}/deployments/${data.DeploymentId}`;

                                    attachments.push({
                                        color: 'good',
                                        title: `Deploying ${app.name} to ${stack.name}... | <${uri}| Check status>`
                                    });
                                }
                            }
                        });
                    });

                } else {
                    attachments = [
                        {
                            color: 'warning',
                            title: `Sorry I dont know how to deploy ${value.repo} :disappointed:`
                        }
                    ];
                }

            }

            let payload = JSON.parse(message.payload);

            this.bot.replyInteractive(message, {
                text: payload.original_message.text,
                attachments: attachments
            });
        }
    }
}

export default PrClosed;
