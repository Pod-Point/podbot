import Opsworks from '../services/opsworks';
import CodeBuild from '../services/code-build';
import Github from '../services/github';
import * as Config from 'config';
import App from '../interfaces/app';
import Stack from '../interfaces/stack';

export default class Deploy {

    private apps: App[];

    private bot: SlackBot;

    private message: SlackMessage;

    /**
     * Deploys apps to stacks
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

        controller.hears(['deploy ?([a-zA-Z0-9-]+)?( with comment )?(.*)?'], [
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

        this.bot = bot;
        this.message = message;

        const action: SlackAttachmentAction = message.actions[0];

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

                    switch (app.type) {
                        case 'codebuild':
                            this.codeBuildDeploy(app, action.name);
                            break;

                        default:
                            this.opsworksDeploy(app, comment, action.name);
                            break;
                    }

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

    /**
     * Deploy an app on opsworks
     *
     * @param {App}    app
     * @param {string} comment
     * @param {string} stackToDeploy
     */
    private opsworksDeploy(app: App, comment: string, stackToDeploy: string) {

        const opsworks: Opsworks = new Opsworks();
        const stacks = this.getStacks(app, stackToDeploy);

        const statusUri = (stack: Stack) => `https://console.aws.amazon.com/opsworks/home?region=${stack.region}#/stack/${stack.stackId}/deployments`;
        const deployPromise = (stack: Stack) => opsworks.deploy(stack, comment);

        this.deployStacks(app, stacks, statusUri, deployPromise);
    }

    /**
     * Deploy an app on CodeBuild
     *
     * @param {App}    app
     * @param {string} stackToDeploy
     */
    private codeBuildDeploy(app: App, stackToDeploy: string) {

        const codebuild: CodeBuild = new CodeBuild();
        const stacks = this.getStacks(app, stackToDeploy);

        const statusUri = (stack: Stack) => `https://console.aws.amazon.com/codebuild/home?region=eu-west-1#/projects/${stack.project}/view`;
        const deployPromise = (stack: Stack) => codebuild.startBuild(stack);

        this.deployStacks(app, stacks, statusUri, deployPromise);
    }

    /**
     * Deploy stacks and update slack with the statuses
     *
     * @param {App}      app
     * @param {Array}    stacks
     * @param {Function} statusUri
     * @param {Function} deployPromise
     */
    private deployStacks(app: App, stacks: Stack[], statusUri: Function, deployPromise: Function) {

        const responses: { [index: string]: SlackAttachment; } = {};

        stacks.forEach(stack => {

            responses[stack.name] = {
                fallback: `Deploying ${app.name} to ${stack.name}.`,
                color: '#3AA3E3',
                title: `Deploying ${app.name} to ${stack.name}...`,
                text: `<${statusUri(stack)}|Check status>`
            };

            deployPromise(stack).then(() => {

                responses[stack.name] = {
                    fallback: `Deployed ${app.name} to ${stack.name}.`,
                    color: 'good',
                    title: 'Success!',
                    text: `Deployed ${app.name} to ${stack.name} :blush:`
                };

                this.updateSlack(responses, this.bot, this.message);

            })
            .catch((err: string) => {

                responses[stack.name] = {
                    fallback: `Sorry I wasn't able to deploy ${app.name} to ${stack.name}.`,
                    color: 'danger',
                    title: `Sorry I wasn't able to deploy ${app.name} to ${stack.name} :disappointed:`,
                    text: err
                };

                this.updateSlack(responses, this.bot, this.message);

            });
        });

        this.updateSlack(responses, this.bot, this.message);
    }

    /**
     * Get stacks to be deployed
     *
     * @param {App}    app
     * @param {string} stackToDeploy
     */
    private getStacks(app: App, stackToDeploy: string) {

        return app.stacks.filter(stack => {

            if (stackToDeploy !== 'all' && stack.name !== stackToDeploy) {
                return false;
            }

            return true;

        });
    }
}
