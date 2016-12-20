declare module 'botkit-storage-redis' {
    const redisStorage: (config?: any) => BotStorage;

    export = redisStorage;
}
