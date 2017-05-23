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

        new CronJob('00 15 09 * * 1-5', () => {
            const day: number = new Date().getDay();
            let message: string = 'Morning team, don\'t forget we have a standup at 9:30am :+1:';

            if (day === 3) {
                message += ' Also it\'s Wednesday so we are starting a new sprint today!';
            }

            bot.say({
                channel: Config.get<string>('channels.software.code'),
                text: message,
            });
        }, null, true, 'Europe/London');

    }
}
