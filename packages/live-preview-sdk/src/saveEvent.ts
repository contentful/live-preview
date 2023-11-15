import { debug } from './helpers';
import { getAllTaggedEntries } from './inspectorMode/utils';
import { EntrySavedMessage, LivePreviewPostMessageMethods, MessageFromEditor } from './messages';
import { SubscribeCallback } from './types';

export class SaveEvent {
  locale: string;
  subscription: SubscribeCallback | undefined;

  constructor({ locale }: { locale: string }) {
    this.locale = locale;
  }

  public subscribe(cb: SubscribeCallback): VoidFunction {
    if (this.subscription) {
      debug.log(
        'There is already a subscription for the save event, the existing one will be replaced.'
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

  public receiveMessage(message: Omit<MessageFromEditor, 'from' | 'source'>): void {
    if (message.method === LivePreviewPostMessageMethods.ENTRY_SAVED && this.subscription) {
      const { entity } = message as unknown as EntrySavedMessage;
      const entries = getAllTaggedEntries();

      if (entries.includes(entity.sys.id)) {
        this.subscription(entity);
      }
    }
  }
}
