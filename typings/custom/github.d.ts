declare module 'github' {

  interface GithubApi {
    new (options: { debug: boolean, protocol: string, host: string, headers: {} }): GithubApi;
      authenticate: (options: { type: string, token: string }) => void;
      pullRequests: { getAll: ( options: any ) => Promise<Array<any>> };
  }

  let GithubApi: GithubApi;
  export = GithubApi;

}
