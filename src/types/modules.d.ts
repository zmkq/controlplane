declare module 'web-push' {
  export interface WebPushError extends Error {
    statusCode?: number;
  }

  export interface PushSubscription {
    endpoint: string;
    keys: {
      auth: string;
      p256dh: string;
    };
  }

  const webPush: {
    setVapidDetails(subject: string, publicKey: string, privateKey: string): void;
    sendNotification(subscription: PushSubscription, payload?: string): Promise<void>;
    generateVAPIDKeys(): {
      publicKey: string;
      privateKey: string;
    };
  };

  export default webPush;
}

declare module 'pg-copy-streams' {
  export function from(query: string): unknown;
  export function to(query: string): unknown;
}
