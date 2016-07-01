if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

import Botkit from 'botkit';

let controller = Botkit.slackbot({
    debug: true
}).configureSlackApp({
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    scopes: ['bot']
});

let bot = controller.spawn({
    token: process.env.token
}).startRTM();

controller.setupWebserver(process.env.port, (err, webserver) => {
    controller.createWebhookEndpoints(controller.webserver);

    controller.createOauthEndpoints(controller.webserver, (err, req, res) => {
        if (err) {
            res.status(500).send('ERROR: ' + err);
        } else {
            res.send('Success!');
        }
    });
});
