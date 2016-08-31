/// <reference path="typings/botkit.d.ts" />
/// <reference path="typings/botkit-storage-redis.d.ts" />
import * as dotenv from 'dotenv';
import * as Botkit from 'botkit';
import * as redisStorage from 'botkit-storage-redis';
import PrClosed from './modules/pr-closed';
import Codeship from './modules/codeship';
import Coveralls from './modules/coveralls';
import Messages from './modules/messages';
import Deploy from './modules/deploy';
import Module from './interfaces/module';

dotenv.config();

if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET || !process.env.PORT || !process.env.TEAM || !process.env.VERIFY_TOKEN) {
    console.log('Error: Specify CLIENT_ID, clientSecret, TEAM, VERIFY_TOKEN and PORT in environment');
    process.exit(1);
}

if (process.env.ENV === 'local') {

    var botParams: BotParams = {
        debug: true,
        json_file_store: './db'
    };

} else {

    var botParams: BotParams = {
        debug: false,
        storage: redisStorage()
    };

}

const controller: BotController = Botkit.slackbot(botParams).configureSlackApp({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    scopes: [
        'bot'
    ]
});

const prClosed: Module = new PrClosed();
const codeship: Module = new Codeship();
const coveralls: Module = new Coveralls();
const messages: Module = new Messages();
const deploy: Module = new Deploy();

const modules: Array<any> = [
    prClosed,
    codeship,
    coveralls,
    messages,
    deploy
];

controller.storage.teams.get(process.env.TEAM, (err, team) => {

    controller.spawn(team).startRTM((err, bot) => {

        if (err) {
            console.log('Error connecting bot to Slack:', err);
        }

        /**
         * Set up listening webserver endpoints
         */
        controller.setupWebserver(process.env.PORT, (err, webserver) => {

            controller.createHomepageEndpoint(controller.webserver);
            controller.createWebhookEndpoints(controller.webserver);
            controller.createOauthEndpoints(controller.webserver, (err, req, res) => {
                if (err) {
                    res.status(500).send('ERROR: ' + err);
                } else {
                    res.send('Success!');
                }
            });

            register('webhooks', bot, webserver);

        });

        /**
         * Listen for interactive slack message callbacks
         */
        controller.on('interactive_message_callback', (bot, message) => {

            if (message.token !== process.env.VERIFY_TOKEN) {
                return false;
            }

            register('callbacks', bot, message);

        });

        /**
         * Listen for slash commands
         */
        controller.on('slash_command', (bot, message) => {

            if (message.token !== process.env.VERIFY_TOKEN) {
                return false;
            }

            register('slashCommands', bot, message);

        });

        /**
         * Listen for normal slack messages
         */
        register('messageListeners', controller);

        /**
         * Register any cronjobs
         */
        register('cronjobs', bot);

    });
});

/**
 * Call register functions on modules
 *
 * @param  {string} type
 * @param  {...} args
 * @return {void}
 */
function register(type: string, ...args: any[]): void {
    modules.forEach((module) => {
        if (typeof module[type] === 'function') {
            module[type](...args);
        }
    });
}
