import Base from './base';
import Opsworks from '../services/opsworks';
import Config from 'config';

class Deploy extends Base {

    /**
     * Register any message listeners
     *
     * @param  {[type]} controller
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
     * @param  {[type]} message
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

                    const opsworks = new Opsworks(bot.replyInteractive, message);
                    opsworks.deploy(app, data.comment, action.name);

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
}

export default Deploy;
