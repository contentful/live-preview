import { debug } from './helpers/index.js';
import type { InspectorModeOptions } from './inspectorMode/inspectorMode.js';
import { getAllTaggedEntries } from './inspectorMode/utils.js';
import { EntrySavedMessage, LivePreviewPostMessageMethods, MessageFromEditor } from './messages.js';
import { SubscribeCallback } from './types.js';

export class SaveEvent {
  locale: string;
  options: InspectorModeOptions;
  subscription: SubscribeCallback | undefined;

  constructor({ locale, options }: { locale: string; options: InspectorModeOptions }) {
    this.locale = locale;
    this.options = options;
  }

  public subscribe(cb: SubscribeCallback): VoidFunction {
    if (this.subscription) {
      debug.log(
        'There is already a subscription for the save event, the existing one will be replaced.',
      );
    }

    this.subscription = cb;

    // TODO: How would we like to handle this for the subscribe event?
    // sendMessageToEditor(LivePreviewPostMessageMethods.SUBSCRIBED, {
    //   action: LivePreviewPostMessageMethods.SUBSCRIBED,
    //   type: isGQL ? 'GQL' : 'REST', // we don't know that
    //   locale,
    //   entryId: sysId, // we don't have that
    //   event: 'save',
    // } as SubscribedMessage);

    return () => {
      this.subscription = undefined;
    };
  }

  public receiveMessage(
    message: Omit<MessageFromEditor, 'from' | 'source'> | EntrySavedMessage,
  ): void {
    if (message.method === LivePreviewPostMessageMethods.ENTRY_SAVED && this.subscription) {
      const { entity } = message as EntrySavedMessage;
      const entries = getAllTaggedEntries({ options: this.options });

      if (entries.includes(entity.sys.id)) {
        this.subscription(entity);
      }
    }
  }
}
