import { CronJob } from 'cron';
import * as Config from 'config';

export default class Messages {

    /**
     * Register any cronjobs
     *
     * @param  {SlackBot} bot
     * @return {void}
     */
    public cronjobs(bot: SlackBot): void {

        new CronJob('00 45 09 * * 1-5', () => {

            bot.say({
                channel: Config.get<string>('channels.software.code'),
                text: 'Morning team, don\'t forget to sign into Jell and update your standup status before 10am :+1:'
            });

        }, null, true, 'Europe/London');

        new CronJob('00 45 12 * * 4', () => {

            bot.say({
                channel: Config.get<string>('channels.software.code'),
                text: 'Don\'t forget, we\'ve got story planning at 2pm today so don\'t leave lunch too late!'
            });

        }, null, true, 'Europe/London');

    }
}
