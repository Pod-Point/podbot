import Base from './base';
import { CronJob } from 'cron';

class Messages extends Base {

    /**
     * Register any cronjobs
     *
     * @param  {[type]} bot
     * @return {void}
     */
    cronjobs(bot) {

        new CronJob('00 45 09 * * 1-5', () => {

            bot.say({
                channel: 'C0299REQ9',
                text: 'Morning team, don\'t forget to sign into Jell and update your standup status before 10am :+1:'
            });

        }, null, true, 'Europe/London');

        new CronJob('00 45 12 * * 4', () => {

            bot.say({
                channel: 'C0299REQ9',
                text: 'Don\'t forget, we\'ve got story planning at 2pm today so don\'t leave lunch too late!'
            });

        }, null, true, 'Europe/London');

    }
}

export default Messages;
