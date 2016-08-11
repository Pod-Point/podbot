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

                bot.reply(message, {
                    attachments: [
                        {
                            title: `Deploy ${app.name} to all stacks`,
                            text: 'Are you sure?',
                            callback_id: 'deploy',
                            attachment_type: 'default',
                            actions: [
                                {
                                    name: 'yes',
                                    text: ':shipit:',
                                    value: JSON.stringify({
                                        name: name,
                                        comment: comment
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

            if (action.name == 'yes') {

                const data = JSON.parse(action.value);
                const app = Apps.find((app) => {
                    return app.name == data.name;
                });

                if (app) {

                    const opsworks = new Opsworks(bot.replyInteractive, message);
                    opsworks.deploy(app, data.comment);

                } else {

                    bot.replyInteractive(message, {
                        attachments: [
                            {
                                color: 'warning',
                                title: `Sorry I dont know how to deploy ${data.name} :disappointed:`
                            }
                        ]
                    });

                }

            } else {

                bot.replyInteractive(message, {
                    attachments: [{}]
                });

            }
        }
    }
}

export default Deploy;
