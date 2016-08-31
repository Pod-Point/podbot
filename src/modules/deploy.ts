import Opsworks from '../services/opsworks';
import Github from '../services/github';
import * as Config from 'config';
import App from '../interfaces/app';
import Stack from '../interfaces/stack';
import Action from '../interfaces/action';
import Message from '../interfaces/message';

class Deploy {

    private apps: Array<App>;

    /**
     * Perform api functions on AWS Opsworks
     *
     * @return {void}
     */
    constructor() {
        this.apps = Config.get<Array<App>>('apps');
    }

    /**
     * Register any message listeners
     *
     * @param  {controller} controller
     * @return {void}
     */
    messageListeners(controller: controller): void {

        controller.hears(['deploy ?([a-zA-Z]+)?( with comment )?(.*)?'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {

            let name: string = message.match[1];
            let comment: string = message.match[3];

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
     * @param  {slackBot} bot
     * @param  {slackMessage} message
     * @return {void}
     */
    callbacks(bot: slackBot, message: slackMessage): void {

        const action: {name: string, value: string} = message.actions[0];

        if (action.name === 'cancel') {

            return bot.api.chat.delete({
                token: bot.config.token,
                ts: message.message_ts,
                channel: message.channel
            });

        }

        if (message.callback_id === 'select-app') {

            bot.replyInteractive(message, this.pickStack(action.value));

        }

        if (message.callback_id === 'deploy') {

            const data: {app: string, comment: string} = JSON.parse(action.value);
            const app: App = this.apps.find((app) => {
                return app.name === data.app;
            });

            if (app) {

                this.getComment(app.repo, data.comment).then((comment) => {

                    const opsworks: Opsworks = new Opsworks();
                    const deployments = opsworks.deploy(app, comment, action.name);

                    let responses: Array<Message> = [];

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
     * @param  {slackBot} bot
     * @param  {Object} message
     * @return {void}
     */
    updateSlack(responses: Array<Message>, bot: slackBot, message): void {

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
     * @param  {string} comment
     * @param  {string} comment
     * @return {Promise}
     */
    getComment(repo: string, comment: string): Promise<string> {

        if (comment) {

            return new Promise((resolve) => {
                resolve(comment);
            });

        } else {

            const github: Github = new Github();

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
     * @return {slackMessage}
     */
    pickApp(): slackMessage {

        let actions = [];

        this.apps.forEach((app) => {
            actions.push({
                name: app.name,
                text: app.name,
                value: app.name,
                type: 'button'
            });
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
     * @return {slackMessage}
     */
    pickStack(name: string, comment: string = null): slackMessage {

        const app = this.apps.find((app) => {
            return app.name === name;
        });

        if (app) {

            let actions = [];

            app.stacks.forEach((stack) => {
                actions.push({
                    name: stack.name,
                    text: stack.name,
                    value: JSON.stringify({
                        app: name,
                        comment: comment
                    }),
                    type: 'button'
                });
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
