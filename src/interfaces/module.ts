interface Module {

    /**
     * Register any webhooks to be listened for
     *
     * @param  {slackBot} bot
     * @param  {webServer} webserver
     * @return {void}
     */
    webhooks?: (bot: slackBot, webserver: webServer) => void;

    /**
     * Register any message callbacks to be listened for
     *
     * @param  {slackBot} bot
     * @param  {slackMessage} message
     * @return {void}
     */
    callbacks?: (bot: slackBot, message: slackMessage) => void;

    /**
     * Register any slash commands
     *
     * @param  {slackBot} bot
     * @param  {slackMessage} message
     * @return {void}
     */
    slashCommands?: (bot: slackBot, message: slackMessage) => void;

    /**
     * Register any message listeners
     *
     * @param  {controller} controller
     * @param  {slackBot} bot
     * @return {void}
     */
    messageListeners?: (controller: controller, bot: slackBot) => void;

    /**
     * Register any cronjobs
     *
     * @param  {slackBot} bot
     * @return {void}
     */
    cronjobs?: (bot: slackBot) => void;
}

export default Module;
