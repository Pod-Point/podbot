import dotenv from 'dotenv';
import Botkit from 'botkit';
import PrClosed from './modules/pr-closed';
import Deploy from './modules/deploy';

dotenv.config();

if (!process.env.clientId || !process.env.clientSecret || !process.env.port || !process.env.team || !process.env.verifyToken) {
    console.log('Error: Specify clientId, clientSecret, team, verifyToken and port in environment');
    process.exit(1);
}

let controller = Botkit.slackbot({
    debug: true,
    json_file_store: './db/'
}).configureSlackApp({
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    scopes: [
        'bot'
    ]
});

// Load modules

let prClosed = new PrClosed();
let deploy = new Deploy();

let modules = [
    prClosed,
    deploy
];

// Start bot

controller.storage.teams.get(process.env.team, (err, team) => {

    controller.spawn(team).startRTM((err, bot) => {

        if (err) {
            console.log('Error connecting bot to Slack:', err);
        }

        controller.setupWebserver(process.env.port, (err, webserver) => {

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

            if (message.token !== process.env.verifyToken) {
                return false;
            }

            register('callbacks', bot, message);

        });

        controller.on('slash_command', (bot, message) => {

            if (message.token !== process.env.verifyToken) {
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
