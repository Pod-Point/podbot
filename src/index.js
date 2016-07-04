import dotenv from 'dotenv';
import Botkit from 'botkit';
import PrClosed from './modules/pr-closed';

dotenv.config();

if (!process.env.clientId || !process.env.clientSecret || !process.env.port || !process.env.team) {
    console.log('Error: Specify clientId, clientSecret, team and port in environment');
    process.exit(1);
}

let controller = Botkit.slackbot({
    debug: true,
    json_file_store: './db/'
}).configureSlackApp({
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    scopes: ['bot']
});

controller.storage.teams.get(process.env.team, (err, team) => {

    let bot = controller.spawn(team).startRTM((err) => {
        if (err) {
            console.log('Error connecting bot to Slack:', err);
        }
    });

    let prClosed = new PrClosed(bot);

    let modules = [
        prClosed
    ];

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

        modules.forEach((module) => {
            if (typeof module.registerWebhooks === 'function') {
                module.registerWebhooks(webserver);
            }
        });

    });

    controller.on('interactive_message_callback', (bot, message) => {

        modules.forEach((module) => {
            if (typeof module.registerCallbacks === 'function') {
                module.registerCallbacks(message);
            }
        });

    });
});

controller.on('rtm_open', (bot) => {
    console.log('** The RTM api just connected!');
});

controller.on('rtm_close', (bot) => {
    console.log('** The RTM api just closed');
});
