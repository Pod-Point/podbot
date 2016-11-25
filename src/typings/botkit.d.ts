interface BotParams {
    debug?: boolean;
    storage?: any;
    json_file_store?: string;
}

interface SlackOptions {
    clientId?: string;
    clientSecret?: string;
    scopes?: string[];
}

interface BotStorage {
    get: (key: string, callback: (err: any, result: any) => void) => string;
}

interface WebServer {
    post: (key: string, callback: (req: any, res: any) => void) => void;
}

interface SlackMessage {
    match?: string[];
    channel: string;
    actions?: SlackAttachmentAction[];
    attachments?: SlackAttachment[];
    message_ts: string;
    callback_id?: string;
    token: string;
}

interface SlackReply {
    channel?: string;
    attachments?: SlackAttachment[];
    unfurl_links?: boolean;
    text?: string;
}

interface SlackAttachmentField {
    title: string;
    value: string;
    short: boolean;
}

interface SlackAttachmentAction {
    name: string;
    text?: string;
    value?: string;
    style?: string;
    type: string;
}

interface SlackAttachment {
    fallback: string;
    color?: string;
    title: string;
    title_link?: string;
    callback_id?: string;
    attachment_type?: string;
    text?: string;
    fields?: SlackAttachmentField[];
    actions?: SlackAttachmentAction[];
}

interface SlackApi {
    chat: {
        delete: (options: { token: string, ts: string, channel: string }) => void;
    };
}

interface SlackBot {
    say: (message: SlackReply) => void;
    replyInteractive: (message: SlackMessage, reply: SlackReply) => void;
    reply: (message: SlackMessage, reply: SlackReply) => void;
    api: SlackApi;
    config: {
        token: string
    };
}

interface BotController {
    configureSlackApp?: (options?: SlackOptions) => BotController;
    storage: { teams: BotStorage };
    webserver: WebServer;
    spawn: (team?: string) => BotController;
    startRTM?: (callback: (err: any, bot: SlackBot) => void) => BotController;
    setupWebserver?: (port: number, callback: (err: any, bot: SlackBot) => void) => BotController;
    createHomepageEndpoint?: (webserver: WebServer) => void;
    createWebhookEndpoints?: (webserver: WebServer) => void;
    createOauthEndpoints?: (webserver: WebServer, callback: (err: any, req: any, res: any) => void) => void;
    on?: (event: string, callback: (bot: SlackBot, message: SlackMessage) => void) => void;
    hears?: (events: string[], types: string[], callback: (bot: SlackBot, message: SlackMessage) => void) => void;
}

declare module 'botkit' {
    export function slackbot(options?: BotParams): BotController;
}
