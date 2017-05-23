# PodBot

[![Build Status](https://travis-ci.com/Pod-Point/podbot.svg?token=F7wj2GWZpNRsZSDUXLya&branch=master)](https://travis-ci.com/Pod-Point/podbot) [![codecov](https://codecov.io/gh/Pod-Point/podbot/branch/master/graph/badge.svg?token=s8NmBmIuY6)](https://codecov.io/gh/Pod-Point/podbot)

The POD Point slack bot built with [Botkit](https://github.com/howdyai/botkit/) in [TypeScript](https://www.typescriptlang.org/).

## Deploy

Make sure the `podbot.pod-point.com` domain is pointing to your instance then visit the `/login` endpoint to authorise the bot with Slack. You might need to use `supervisorctl` on the instance to restart the process after authorising.

## Develop

If you haven't already you will need to create a new slack application and add the `CLIENT_ID` and `CLIENT_SECRET` to the .env file.

You will also need to add an OAuth Redirect endpoint (`https://bot-url/oauth`) and Interactive Messages endpoint (`https://bot-url/slack/receive`) to your app. To do this use something like [ngrok](https://ngrok.com/) to forward a port to your local machine (`ngrok http 3003`) you can then run `npm run watch`.

If this is the first time you have run the application you will need to authorise the app by visiting `http://localhost:3003/login`.

You can then run the application with `npm run watch`.

## Typings

You will need to install [typings](https://blogs.msdn.microsoft.com/typescript/2016/06/15/the-future-of-declaration-files/) for third party modules. Otherwise tsc will fail to compile.

* `npm install --save @types/aws-sdk`

## Linting

We use [TSLint](https://palantir.github.io/tslint/) as code linting utility, to ensure a consistent code style.
Linting rules and config can be added to `tslint.json` file.
