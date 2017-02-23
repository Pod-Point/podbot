interface Trello {
    new (key: string, token: string): Trello;
    post: (url: string, data: Object, callback?: Function) => void;
}

declare var Trello: Trello;

declare module 'node-trello' {
    export = Trello;
}
