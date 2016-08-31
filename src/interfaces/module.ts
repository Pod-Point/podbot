interface Module {

    /**
     * Register any webhooks to be listened for
     *
     * @param  {SlackBot} bot
     * @param  {WebServer} webserver
     * @return {void}
     */
    webhooks?: (bot: SlackBot, webserver: WebServer) => void;

    /**
     * Register any message callbacks to be listened for
     *
     * @param  {SlackBot} bot
     * @param  {SlackMessage} message
     * @return {void}
     */
    callbacks?: (bot: SlackBot, message: SlackMessage) => void;

    /**
     * Register any slash commands
     *
     * @param  {SlackBot} bot
     * @param  {SlackMessage} message
     * @return {void}
     */
    slashCommands?: (bot: SlackBot, message: SlackMessage) => void;

    /**
     * Register any message listeners
     *
     * @param  {BotController} controller
     * @param  {SlackBot} bot
     * @return {void}
     */
    messageListeners?: (controller: BotController, bot: SlackBot) => void;

    /**
     * Register any cronjobs
     *
     * @param  {SlackBot} bot
     * @return {void}
     */
    cronjobs?: (bot: SlackBot) => void;
}

export default Module;
