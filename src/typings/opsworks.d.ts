declare module 'aws-sdk' {

  export class OpsWorks {
    constructor(options?: any);
    endpoint: Endpoint;
    createDeployment(params: OpsworksParams, next: (err: AwsError, data: any) => void): void;
    waitFor(type: string, params: OpsworksParams, next: (err: AwsError, data: any) => void): void;
  }

  export interface OpsworksParams {
    AppId: string;
    StackId: string;
    Comment?: string;
    Command?: {
        Name: string;
    };
    DeploymentIds?: Array<string>;
  }
}
