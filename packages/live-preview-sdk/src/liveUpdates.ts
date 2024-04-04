import { stringify } from 'flatted';

import { debug, generateUID, sendMessageToEditor } from './helpers/index.js';
import { validateLiveUpdatesConfiguration } from './helpers/validation.js';
import type {
  ContentfulSubscribeConfig,
  EditorMessage,
  EntryUpdatedMessage,
  ErrorMessage,
  MessageFromEditor,
  PostMessageMethods,
  SubscribedMessage,
  UnsubscribedMessage,
} from './index.js';
import { LivePreviewPostMessageMethods } from './messages.js';
import { Subscription } from './types.js';

/**
 * LiveUpdates for the Contentful Live Preview mode
 * receives the updated Entity from the Editor and merges them together with the incoming data
 */
export class LiveUpdates {
  private subscriptions = new Map<string, Subscription>();
  private defaultLocale: string;
  private sendMessage: (method: PostMessageMethods, data: EditorMessage) => void;

  constructor({ locale, targetOrigin }: { locale: string; targetOrigin: string[] }) {
    this.defaultLocale = locale;
    this.sendMessage = (method, data) => sendMessageToEditor(method, data, targetOrigin);
  }

  /** Receives the data from the message event handler and calls the subscriptions */
  public async receiveMessage(message: MessageFromEditor): Promise<void> {
    if (message.method === LivePreviewPostMessageMethods.ENTRY_UPDATED) {
      const { data, subscriptionId } = message as EntryUpdatedMessage;

      const subscription = this.subscriptions.get(subscriptionId);

      if (subscription) {
        subscription.callback(data);
        subscription.data = data;
        this.subscriptions.set(subscriptionId, subscription);
      } else {
        debug.error('Received an update for an unknown subscription', {
          subscriptionId,
          data,
          subscriptions: this.subscriptions,
        });
      }
    }
  }

  private sendErrorMessage(error: ErrorMessage): void {
    this.sendMessage(LivePreviewPostMessageMethods.ERROR, error);
  }

  /**
   * Subscribe to data changes from the Editor, returns a function to unsubscribe
   * Will be called once initially for the restored data
   */
  public subscribe(originalConfig: ContentfulSubscribeConfig): VoidFunction {
    const { isGQL, isValid, sysIds, isREST, config } =
      validateLiveUpdatesConfiguration(originalConfig);

    if (!isValid || !config) {
      this.sendErrorMessage({
        message: 'Failed to subscribe',
        payload: { isGQL, isValid, sysIds, isREST },
        type: 'SUBSCRIPTION_SETUP_FAILED',
      });
      return () => {
        /* noop */
      };
    }

    const id = generateUID();
    const locale = config.locale ?? this.defaultLocale;

    this.subscriptions.set(id, {
      ...config,
      sysIds,
    });

    // Tell the editor that there is a subscription
    // It's possible that the `type` is not 100% accurate as we don't know how it will be merged in the future.
    const message: Omit<SubscribedMessage, 'action'> | UnsubscribedMessage = {
      type: isGQL ? 'GQL' : 'REST',
      locale,
      sysIds,
      event: 'edit',
      id,
      config: stringify(config),
    };

    this.sendMessage(LivePreviewPostMessageMethods.SUBSCRIBED, message);

    return () => {
      this.sendMessage(LivePreviewPostMessageMethods.UNSUBSCRIBED, message);
      this.subscriptions.delete(id);
    };
  }
}
