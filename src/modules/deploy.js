import Base from './base';
import Opsworks from '../services/opsworks';
import Config from 'config';

class Deploy extends Base {

    /**
     * Register any message listeners
     *
     * @param  {Object} controller
     * @return {void}
     */
    messageListeners(controller) {
        controller.hears('deploy (.*) with comment (.*)', ['direct_message', 'direct_mention', 'mention'], (bot, message) => {

            const name = message.match[1];
            const comment = message.match[2];

            const app = Config.get('apps').find((app) => {
                return app.name == name;
            });

            if (app) {

                let actions = app.stacks.map((stack) => {
                    return {
                        name: stack.name,
                        text: stack.name,
                        value: JSON.stringify({
                            app: name,
                            comment: comment
                        }),
                        type: 'button'
                    };
                });

                actions.push({
                    name: 'all',
                    text: 'All',
                    value: JSON.stringify({
                        app: name,
                        comment: comment
                    }),
                    type: 'button'
                });

                actions.push({
                    name: 'cancel',
                    text: 'Cancel',
                    style: 'danger',
                    type: 'button'
                });

                bot.reply(message, {
                    attachments: [
                        {
                            title: `Deploying ${app.name}`,
                            text: 'Which stack to deploy?',
                            callback_id: 'deploy',
                            attachment_type: 'default',
                            actions: actions
                        }
                    ]
                });

            } else {

                bot.reply(message, {
                    attachments: [
                        {
                            color: 'warning',
                            title: `Sorry I dont know how to deploy ${name} :disappointed:`
                        }
                    ]
                });

            }
        });
    }

    /**
     * Register any message callbacks to be listened for
     *
     * @param  {Object} bot
     * @param  {Object} message
     * @return {void}
     */
    callbacks(bot, message) {

        if (message.callback_id == 'deploy') {

            const action = message.actions[0];

            if (action.name !== 'cancel') {

                const data = JSON.parse(action.value);
                const app = Config.get('apps').find((app) => {
                    return app.name == data.app;
                });

                if (app) {

                    const opsworks = new Opsworks();
                    const deployments = opsworks.deploy(app, data.comment, action.name);

                    let responses = [];

                    deployments.forEach((deployment) => {

                        let uri = `https://console.aws.amazon.com/opsworks/home?#/stack/${deployment.stack.stackId}/deployments`;

                        responses[deployment.stack.appId] = {
                            color: '#3AA3E3',
                            title: `Deploying ${app.name} to ${deployment.stack.name}...`,
                            text: `<${uri}|Check status>`
                        };

                        deployment.promise.then((val) => {

                            responses[deployment.stack.appId] = {
                                color: 'good',
                                title: `Success!`,
                                text: `Deployed ${app.name} to ${deployment.stack.name} :blush:`
                            };

                            this.updateSlack(responses, bot, message);

                        })
                        .catch((err) => {

                            responses[deployment.stack.appId] = {
                                color: 'danger',
                                title: `Sorry I wasn't able to deploy ${app.name} to ${deployment.stack.name} :disappointed:`,
                                text: err
                            };

                            this.updateSlack(responses, bot, message);

                        });

                    });

                    this.updateSlack(responses, bot, message);

                } else {

                    bot.replyInteractive(message, {
                        attachments: [
                            {
                                color: 'warning',
                                title: `Sorry I dont know how to deploy ${data.app} :disappointed:`
                            }
                        ]
                    });

                }

            } else {

                bot.api.chat.delete({
                    token: bot.config.token,
                    ts: message.message_ts,
                    channel: message.channel
                });

            }
        }
    }

    /**
     * Update slack with Opsworks responses
     *
     * @param  {array}  responses
     * @param  {Object} bot
     * @param  {Object} message
     * @return {void}
     */
    updateSlack(responses, bot, message) {

        let attachments = [];

        for (let key in responses) {
            attachments.push(responses[key]);
        }

        bot.replyInteractive(message, {
            attachments: attachments
        });
    }
}

export default Deploy;
