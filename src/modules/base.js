class Base {

    /**
     * Register any webhooks to be listened for
     *
     * @param  {[type]} webserver
     * @return {void}
     */
    webhooks(bot, webserver) {}

    /**
     * Register any message callbacks to be listened for
     *
     * @param  {[type]} message
     * @return {void}
     */
    callbacks(bot, message) {}

    /**
     * Register any slash commands
     *
     * @param  {[type]} controller
     * @return {void}
     */
    slashCommands(bot, message) {}

    /**
     * Register any message listeners
     *
     * @param  {[type]} controller
     * @return {void}
     */
    messageListeners(controller) {}
}

export default Base;
