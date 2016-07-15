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

                let opsworks = new Opsworks(bot.reply, message);
                opsworks.deploy(app, comment);

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
}

export default Deploy;
