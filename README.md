# PodBot
The POD Point slack bot built with [Botkit](https://github.com/howdyai/botkit/) in [TypeScript](https://www.typescriptlang.org/).

## Develop

If you haven't already you will need to create a new slack application and add the `CLIENT_ID` and `CLIENT_SECRET` to the .env file.

You will also need to add an OAuth Redirect endpoint (`https://bot-url/oauth`) and Interactive Messages endpoint (`https://bot-url/slack/receive`) to your app. To do this use something like [ngrok](https://ngrok.com/) to forward a port to your local machine (`ngrok http 3003`) you can then run `npm run watch`.

If this is the first time you have run the application you will need to authorise the app by visiting `http://localhost:3003/login`.

You can then run the application with `npm run watch`.

## Typings

You will need to install [typings](https://github.com/typings/typings) for third party modules. Otherwise tsc will fail to compile. These are saved in `typings.json` and can be installed with:

* `typings install`

If you add a new module you will need to install the typings for the module to the `typings.json` file with the command:

* `typings search MODULE`
* `typings install --save dt~MODULE --global`

You can also create custom typings definitions in `src/typings`.
