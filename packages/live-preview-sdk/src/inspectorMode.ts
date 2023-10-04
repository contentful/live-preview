import { getAllTaggedElements, getTaggedInformation } from './fieldTaggingUtils';
import { sendMessageToEditor } from './helpers';
import {
  InspectorModeChangedMessage,
  LivePreviewPostMessageMethods,
  MessageFromEditor,
  InteractionEventMethods,
} from './messages';

export class InspectorMode {
  private defaultLocale: string;
  private isScrolling: boolean = false;
  private scrollTimeout?: NodeJS.Timeout;
  private hoveredElement?: HTMLElement;

  constructor({ locale }: { locale: string }) {
    this.defaultLocale = locale;

    // TODO: we we need this?
    this.onMouseOver = this.onMouseOver.bind(this);
    this.onScroll = this.onScroll.bind(this);
    this.handleElementInteraction = this.handleElementInteraction.bind(this);
    this.sendAllElements = this.sendAllElements.bind(this);

    // TODO: on resize do the something similar as onScroll
    window.addEventListener('scroll', this.onScroll);
    window.addEventListener('mouseover', this.onMouseOver);
  }

  // Handles incoming messages from Contentful
  public receiveMessage(data: MessageFromEditor): void {
    if (
      ('action' in data && data.action === 'INSPECTOR_MODE_CHANGED') ||
      data.method === LivePreviewPostMessageMethods.INSPECTOR_MODE_CHANGED
    ) {
      const { isInspectorActive } = data as InspectorModeChangedMessage;
      // Toggle the contentful-inspector--active class on the body element based on the isInspectorActive boolean
      document.body.classList.toggle('contentful-inspector--active', isInspectorActive);

      if (isInspectorActive) {
        this.sendAllElements();
      }
    }
  }

  private onScroll() {
    if (!this.isScrolling) {
      this.isScrolling = true;
      sendMessageToEditor(InteractionEventMethods.SCROLL_START, {} as any);
    }

    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    this.scrollTimeout = setTimeout(() => {
      // No longer scrolling, let's update everything
      this.isScrolling = false;
      sendMessageToEditor(InteractionEventMethods.SCROLL_END, {} as any);
      this.sendAllElements();
      if (this.hoveredElement) {
        this.handleElementInteraction(this.hoveredElement);
      }
    }, 150);
  }

  private onMouseOver(e: MouseEvent) {
    const eventTargets = e.composedPath();

    for (const eventTarget of eventTargets) {
      const element = eventTarget as HTMLElement;
      if (element.nodeName === 'BODY') break;
      if (typeof element?.getAttribute !== 'function') continue;

      if (this.handleElementInteraction(element)) {
        return;
      }
    }

    // Clear if no tagged element is hovered
    this.hoveredElement = undefined;
    sendMessageToEditor(InteractionEventMethods.MOUSE_MOVE, {
      hoveredElement: null,
      coordinates: null,
    } as any);
  }

  private handleElementInteraction(element: HTMLElement): boolean {
    const taggedInformation = getTaggedInformation(element, this.defaultLocale);

    if (!taggedInformation) {
      return false;
    }

    this.hoveredElement = element;
    sendMessageToEditor(InteractionEventMethods.MOUSE_MOVE, {
      hoveredElement: taggedInformation,
      coordinates: element.getBoundingClientRect(),
    } as any);

    return true;
  }

  private sendAllElements() {
    const entries = getAllTaggedElements().filter(
      (element) => !!getTaggedInformation(element, this.defaultLocale)
    );

    // TODO: typing
    sendMessageToEditor(
      'TAGGED_ELEMENTS' as any,
      {
        elements: entries.map((e) => ({
          coordinates: e.getBoundingClientRect(),
        })),
      } as any
    );
  }
}
