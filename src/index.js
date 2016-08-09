import dotenv from 'dotenv';
import Botkit from 'botkit';
import redisStorage from 'botkit-storage-redis';
import PrClosed from './modules/pr-closed';
import Codeship from './modules/codeship';

dotenv.config();

if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET || !process.env.PORT || !process.env.TEAM || !process.env.VERIFY_TOKEN) {
    console.log('Error: Specify CLIENT_ID, clientSecret, TEAM, VERIFY_TOKEN and PORT in environment');
    process.exit(1);
}

let controller = Botkit.slackbot({
    debug: false,
    storage: redisStorage()
}).configureSlackApp({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    scopes: [
        'bot'
    ]
});

// Load modules

let prClosed = new PrClosed();
let codeship = new Codeship();

let modules = [
    prClosed,
    codeship
];

// Start bot

controller.storage.teams.get(process.env.TEAM, (err, team) => {

    controller.spawn(team).startRTM((err, bot) => {

        if (err) {
            console.log('Error connecting bot to Slack:', err);
        }

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

        controller.on('interactive_message_callback', (bot, message) => {

            if (message.token !== process.env.VERIFY_TOKEN) {
                return false;
            }

            register('callbacks', bot, message);

        });

        controller.on('slash_command', (bot, message) => {

            if (message.token !== process.env.VERIFY_TOKEN) {
                return false;
            }

            register('slashCommands', bot, message);


        });

        register('messageListeners', controller);

    });
});

/**
 * Call register functions on modules
 *
 * @param  {string} type
 * @param  {...} args
 * @return {void}
 */
function register(type, ...args) {
    modules.forEach((module) => {
        if (typeof module[type] === 'function') {
            module[type](...args);
        }
    });
}
