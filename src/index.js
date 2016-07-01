import dotenv from 'dotenv';
import Botkit from 'botkit';

dotenv.config();

var bot = null;

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
    bot = controller.spawn(team).startRTM((err) => {
        if (err) {
            console.log('Error connecting bot to Slack:', err);
        }
    });
});

controller.setupWebserver(process.env.port, (err, webserver) => {

    webserver.post('/pr_closed', (req, res) => {

        let hook = req.body;
        let pr = hook.pull_request;

        if (hook.action == 'closed' && pr.merged === true) {

            let message = {
                text: `#${hook.number} ${pr.title} was just merged into ${hook.repository.name}`,
                channel: '#software-dev',
                attachments: [
                    {
                        title: 'Do you want to deploy this PR?',
                        callback_id: 'deploy-pr',
                        attachment_type: 'default',
                        actions: [
                            {
                                name: 'yes',
                                text: ':shipit:',
                                value: JSON.stringify({
                                    repo: hook.repository.id,
                                    pr: hook.number
                                }),
                                style: 'primary',
                                type: 'button'
                            },
                            {
                                name: 'no',
                                text: ':thumbsdown:',
                                style: 'danger',
                                type: 'button'
                            }
                        ]
                    }
                ]
            };

            bot.say(message);

        }

        res.send('OK');
    });

    controller.createHomepageEndpoint(controller.webserver);

    controller.createWebhookEndpoints(controller.webserver);

    controller.createOauthEndpoints(controller.webserver, (err, req, res) => {
        if (err) {
            res.status(500).send('ERROR: ' + err);
        } else {
            res.send('Success!');
        }
    });

});

controller.on('interactive_message_callback', (bot, message) => {

    let action = message.actions[0];

    if (message.callback_id == 'deploy-pr') {

        let reply = {};

        if (action.name == 'yes') {

            let value = JSON.parse(action.value);
            reply = {
                text: `Deploying PR #${value.pr} from repo ${value.repo}`,
                attachments: []
            };

        } else {

            reply = {
                text: 'Ok then :disappointed:',
                attachments: []
            };

            console.log(reply);

        }

        bot.replyInteractive(message, reply);

    }

});

controller.on('rtm_open', (bot) => {
    console.log('** The RTM api just connected!');
});

controller.on('rtm_close', (bot) => {
    console.log('** The RTM api just closed');
});
