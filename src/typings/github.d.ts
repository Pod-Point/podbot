interface GithubApi {
  new (options: { debug: boolean, protocol: string, host: string, headers: {} }): GithubApi;
  authenticate: (options: { type: string, token: string }) => void;
  pullRequests: { getAll: ( options: any ) => Promise<any[]> };
}

declare var GithubApi: GithubApi;

declare module 'github' {
  export = GithubApi;
}
