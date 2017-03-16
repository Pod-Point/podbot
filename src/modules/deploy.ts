import Opsworks from '../services/opsworks';
import Github from '../services/github';
import * as Config from 'config';
import App from '../interfaces/app';

export default class Deploy {

    private apps: App[];

    /**
     * Perform api functions on AWS Opsworks
     *
     * @return {void}
     */
    constructor() {
        this.apps = Config.get<App[]>('apps');
    }

    /**
     * Register any message listeners
     *
     * @param  {BotController} controller
     * @return {void}
     */
    public messageListeners(controller: BotController): void {

        controller.hears(['deploy ?([a-zA-Z]+)?( with comment )?(.*)?'], [
            'direct_message',
            'direct_mention',
            'mention'
        ], (bot, message) => {

            const name: string = message.match[1];
            const comment: string = message.match[3];

            if (name === undefined) {
                bot.reply(message, this.pickApp());
            } else {
                bot.reply(message, this.pickStack(name, comment));
            }

        });
    }

    /**
     * Register any message callbacks to be listened for
     *
     * @param  {SlackBot} bot
     * @param  {SlackMessage} message
     * @return {void}
     */
    public callbacks(bot: SlackBot, message: SlackMessage): void {

        console.log('BOT: ' + bot);
        console.log('MESSAGE: ' + message);

        const action: SlackAttachmentAction = message.actions[0];

        if (action.name === 'cancel') {
            return bot.api.chat.delete({
                token: bot.config.token,
                ts: message.message_ts,
                channel: message.channel
            });
        }

        if (message.callback_id === 'select-app') {
            console.log('PICK STACK ATTACHMENT: ' + JSON.stringify(this.pickStack(action.value)));
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

                    const responses: { [index: string]: SlackAttachment; } = {};

                    deployments.forEach((deployment) => {

                        const endpoint: string = 'https://console.aws.amazon.com/opsworks/home';
                        const uri: string = `${endpoint}?region=${deployment.stack.region}#/stack/${deployment.stack.stackId}/deployments`;

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
                                title: 'Success!',
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
     * @param  {Object}  responses
     * @param  {SlackBot} bot
     * @param  {SlackMessage} message
     * @return {void}
     */
    private updateSlack(responses: { [index: string]: SlackAttachment; }, bot: SlackBot, message: SlackMessage): void {

        const attachments: SlackAttachment[] = [];

        Object.keys(responses).forEach((key) => {
            attachments.push(responses[key]);
        });

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
    private getComment(repo: string, comment: string): Promise<string> {

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
     * @return {SlackReply}
     */
    private pickApp(): SlackReply {

        const actions: SlackAttachmentAction[] = [];

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
     * @return {SlackReply}
     */
    private pickStack(name: string, comment: string = null): SlackReply {

        const app: App = this.apps.find((app) => {
            return app.name === name;
        });

        if (app) {

            const actions: SlackAttachmentAction[] = [];

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
