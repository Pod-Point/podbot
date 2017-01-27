/// <reference path="../typings/node-trello.d.ts" />
import * as Trello from 'node-trello';
import * as Config from 'config';
import App from '../interfaces/app';

export default class Sentry {

    /**
     * Listen for Sentry webhooks and create Trello cards if applicable
     *
     * @param  {SlackBot} bot
     * @param  {WebServer} webserver
     * @return {void}
     */
    public webhooks(bot: SlackBot, webserver: WebServer): void {
        webserver.post('/sentry', (req, res) => {
            const trello = new Trello(process.env.TRELLO_KEY, process.env.TRELLO_TOKEN);
            const data: SentryWebhook = req.body;

            const apps = Config.get<App[]>('apps');
            const app: App = apps.find((app) => {
                return app.sentry === data.project_name;
            });

            trello.post('1/cards', {
                idList: '5825f19c448059485b692824',
                name: `${data.event.metadata.type}: ${data.event.metadata.value}`,
                desc: `${data.url}\n\n    ${data.message}`,
                idLabels: app.label
            }, () => false);

            res.send('OK');
        });
    }
}

interface SentryWebhook {
    message: string;
    url: string;
    project_name: string;
    event: {
        metadata: {
            type: string,
            value: string,
        }
    };
}
