import Trello from 'node-trello';

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

            const trello = new Trello(process.env.GITHUB_TOKEN, process.env.GITHUB_TOKEN);
            const data: SentryWebhook = req.body;

            const trelloData = {
                idList: 1,
                name: data.message,
                desc: data.message,
                urlSource: data.url
            };

            trello.post('1/cards', trelloData, (err: any, response: any) => {
                console.log(response);
            });

            res.send('OK');
        });
    }
}

interface SentryWebhook {
    message: string;
    url: string;
}
