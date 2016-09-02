declare module 'aws-sdk' {

  export class OpsWorks {
    constructor(options?: any);
    endpoint: Endpoint;
    createDeployment(params: OpsworksCreateDeploymentParams, next: (err: AwsError, data: any) => void): void;
    waitFor(type: string, params: OpsworksWaitForParams, next: (err: AwsError, data: any) => void): void;
  }

  export interface OpsworksCreateDeploymentParams {
    AppId: string;
    StackId: string;
    Comment: string;
    Command: {
        Name: string;
    };
  }

  export interface OpsworksWaitForParams {
    DeploymentIds: Array<string>;
  }
}
