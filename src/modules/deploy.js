import Base from './base';
import Opsworks from '../services/opsworks';
import Github from '../services/github';
import Config from 'config';

class Deploy extends Base {

    /**
     * Register any message listeners
     *
     * @param  {Object} controller
     * @return {void}
     */
    messageListeners(controller) {

        controller.hears(['deploy ?([a-zA-Z]+)?( with comment )?(.*)?'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {

            let name = message.match[1];
            let comment = message.match[2];

            if (typeof name === 'undefined') {
                bot.reply(message, this.pickApp());
            } else {
                bot.reply(message, this.pickStack(name, comment));
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

        const action = message.actions[0];

        if (action.name === 'cancel') {

            return bot.api.chat.delete({
                token: bot.config.token,
                ts: message.message_ts,
                channel: message.channel
            });

        }

        if (message.callback_id == 'select-app') {

            bot.replyInteractive(message, this.pickStack(action.value));

        }

        if (message.callback_id == 'deploy') {

            const data = JSON.parse(action.value);
            const app = Config.get('apps').find((app) => {
                return app.name == data.app;
            });

            if (app) {

                this.getComment(app.repo, data.comment).then((comment) => {

                    const opsworks = new Opsworks();
                    const deployments = opsworks.deploy(app, comment, action.name);

                    let responses = [];

                    deployments.forEach((deployment) => {

                        let uri = `https://console.aws.amazon.com/opsworks/home?#/stack/${deployment.stack.stackId}/deployments`;

                        responses[deployment.stack.appId] = {
                            fallback: `Deploying ${app.name} to ${deployment.stack.name}.`,
                            color: '#3AA3E3',
                            title: `Deploying ${app.name} to ${deployment.stack.name}...`,
                            text: `<${uri}|Check status>`
                        };

                        deployment.promise.then((val) => {

                            responses[deployment.stack.appId] = {
                                fallback: `Deployed ${app.name} to ${deployment.stack.name}.`,
                                color: 'good',
                                title: `Success!`,
                                text: `Deployed ${app.name} to ${deployment.stack.name} :blush:`
                            };

                            this.updateSlack(responses, bot, message);

                        })
                        .catch((err) => {

                            responses[deployment.stack.appId] = {
                                fallback: `Sorry I wasn't able to deploy ${app.name} to ${deployment.stack.name}.`,
                                color: 'danger',
                                title: `Sorry I wasn't able to deploy ${app.name} to ${deployment.stack.name} :disappointed:`,
                                text: err
                            };

                            this.updateSlack(responses, bot, message);

                        });

                    });

                    this.updateSlack(responses, bot, message);

                }).catch(() => {

                    bot.replyInteractive(message, {
                        attachments: [
                            {
                                fallback: `Sorry I couldn't get a comment from ${app.repo}.`,
                                color: 'warning',
                                title: `Sorry I couldn't get a comment from ${app.repo}.`
                            }
                        ]
                    });

                });

            } else {

                bot.replyInteractive(message, {
                    attachments: [
                        {
                            fallback: `Sorry I dont know how to deploy ${data.app}.`,
                            color: 'warning',
                            title: `Sorry I dont know how to deploy ${data.app} :disappointed:`
                        }
                    ]
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

    /**
     * Get comment from github if not defined
     *
     * @param  {string|null} comment
     * @return {Promise}
     */
    getComment(repo, comment) {

        if (comment) {

            return new Promise((resolve) => {
                resolve(comment);
            });

        } else {

            const github = new Github();

            return new Promise((resolve, reject) => {

                github.getLastPr(repo).then((pulls) => {

                    if (pulls.length) {
                        resolve(`${pulls[0].number} ${pulls[0].title}`);
                    } else {
                        reject();
                    }

                });

            });

        }
    }

    /**
     * Pick an application to deploy
     *
     * @return {Object}
     */
    pickApp() {

        let actions = Config.get('apps').map((app) => {
            return {
                name: app.name,
                text: app.name,
                value: app.name,
                type: 'button'
            };
        });

        actions.push({
            name: 'cancel',
            text: 'Cancel',
            style: 'danger',
            type: 'button'
        });

        return {
            attachments: [
                {
                    fallback: 'Which app to deploy?',
                    title: 'Deploy',
                    text: 'Which app to deploy?',
                    callback_id: 'select-app',
                    attachment_type: 'default',
                    actions: actions
                }
            ]
        };
    }

    /**
     * Pick a stack to deploy
     *
     * @param  {string} name
     * @param  {string} comment
     * @return {Object}
     */
    pickStack(name, comment = null) {

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

            return {
                attachments: [
                    {
                        fallback: 'Which stack to deploy?',
                        title: `Deploying ${app.name}`,
                        text: 'Which stack to deploy?',
                        callback_id: 'deploy',
                        attachment_type: 'default',
                        actions: actions
                    }
                ]
            };

        } else {

            return {
                attachments: [
                    {
                        fallback: `Sorry I dont know how to deploy ${name}.`,
                        color: 'warning',
                        title: `Sorry I dont know how to deploy ${name} :disappointed:`
                    }
                ]
            };

        }
    }
}

export default Deploy;
