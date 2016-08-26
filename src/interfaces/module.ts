interface Module {

    /**
     * Register any webhooks to be listened for
     *
     * @param  {[type]} bot
     * @param  {[type]} webserver
     * @return {void}
     */
    webhooks?: (bot, webserver) => void;

    /**
     * Register any message callbacks to be listened for
     *
     * @param  {[type]} bot
     * @param  {[type]} message
     * @return {void}
     */
    callbacks?: (bot, message) => void;

    /**
     * Register any slash commands
     *
     * @param  {[type]} bot
     * @param  {[type]} message
     * @return {void}
     */
    slashCommands?: (bot, message) => void;

    /**
     * Register any message listeners
     *
     * @param  {[type]} controller
     * @return {void}
     */
    messageListeners?: (controller, bot) => void;

    /**
     * Register any cronjobs
     *
     * @param  {[type]} bot
     * @return {void}
     */
    cronjobs?: (bot) => void;
}

export default Module;
