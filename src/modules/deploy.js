import Base from './base';
import Opsworks from '../services/opsworks';
import Apps from '../../data/apps';

class Deploy extends Base {

    /**
     * Register any message listeners
     *
     * @param  {[type]} controller
     * @return {void}
     */
    messageListeners(controller) {
        controller.hears('deploy (.*) with comment (.*)', ['direct_message', 'direct_mention', 'mention'], (bot, message) => {

            let name = message.match[1];
            let comment = message.match[2];

            let app = Apps.find((app) => {
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

            let action = message.actions[0];

            if (action.name == 'yes') {

                let data = JSON.parse(action.value);
                let app = Apps.find((app) => {
                    return app.name == data.name;
                });

                if (app) {

                    let opsworks = new Opsworks(bot.replyInteractive, message);
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
