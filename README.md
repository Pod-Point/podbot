# PodBot
The POD Point slack bot built with [botkit](https://github.com/howdyai/botkit/).

## Develop

If you haven't already you will need to create a new slack application and add the `CLIENT_ID` and `CLIENT_SECRET` to the .env file.

You will also need to add an OAuth Redirect endpoint (`https://bot-url/oauth`) and Interactive Messages endpoint (`https://bot-url/slack/receive`) to your app. To do this use something like [ngrok](https://ngrok.com/) to forward a port to your local machine (`ngrok http 3003`) you can then run `npm run watch`.

If this is the first time you have run the application you will need to authorise the app by visiting `http://localhost:3003/login`.
