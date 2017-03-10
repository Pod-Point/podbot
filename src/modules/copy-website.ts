import S3 from '../services/s3';
import Github from '../services/github';
import * as Config from 'config';
import App from '../interfaces/app';

export default class CopyWebsite {

    private apps: App[];

    /**
     * Register any message listeners
     *
     * @param  {BotController} controller
     * @return {void}
     */
    public messageListeners(controller: BotController): void {
        controller.hears(['test'], [
            'direct_message',
            'direct_mention',
            'mention'
        ], (bot, message) => {
            const s3: S3 = new S3();
            // const myTest = s3.copyBucket('podpoint-website-dev-test', 'podpoint-website-test', null);
            const myTest = s3.backupBucket('podpoint-website-test');
            // const myTest = s3.test();

            myTest.then((val) => {
                bot.reply(message, val);
            })
            .catch((err) => {
                bot.reply(message, err);
            });
        });
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
}
