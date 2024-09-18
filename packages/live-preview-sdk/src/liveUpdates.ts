import { stringify } from 'flatted';

import { debug, generateUID, sendMessageToEditor } from './helpers/index.js';
import type {
  ContentfulSubscribeConfig,
  EditorMessage,
  EntryUpdatedMessage,
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

      if (!data.sys || !data.sys.id) {
        debug.error(
          'Received an update with missing `sys.id`, please provide `sys.id` in order to enable live updates',
          {
            data,
            subscriptionId,
          },
        );
        return;
      }

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

  /**
   * Subscribe to data changes from the Editor, returns a function to unsubscribe
   * Will be called once initially for the restored data
   */
  public subscribe(config: ContentfulSubscribeConfig): VoidFunction {
    const id = generateUID();
    const locale = config.locale ?? this.defaultLocale;

    this.subscriptions.set(id, {
      ...config,
    });

    // Tell the editor that there is a subscription
    // It's possible that the `type` is not 100% accurate as we don't know how it will be merged in the future.
    const message: Omit<SubscribedMessage, 'action'> | UnsubscribedMessage = {
      locale,
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
