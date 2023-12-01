import { sendMessageToEditor } from '../helpers';
import { LivePreviewPostMessageMethods, type MessageFromEditor } from '../messages';
import {
  InspectorModeDataAttributes,
  type InspectorModeChangedMessage,
  InspectorModeEventMethods,
} from './types';
import { getAllTaggedElements, getInspectorModeAttributes } from './utils';

export class InspectorMode {
  private defaultLocale: string;
  private targetOrigin: string[];

  private isScrolling = false;
  private scrollTimeout?: NodeJS.Timeout;

  private isResizing = false;
  private resizeTimeout?: NodeJS.Timeout;

  private hoveredElement?: HTMLElement;
  private taggedElements: Element[] = [];

  constructor({ locale, targetOrigin }: { locale: string; targetOrigin: string[] }) {
    this.defaultLocale = locale;
    this.targetOrigin = targetOrigin;

    this.addHoverListener = this.addHoverListener.bind(this);
    this.addScrollListener = this.addScrollListener.bind(this);
    this.addMutationListener = this.addMutationListener.bind(this);
    this.addResizeListener = this.addResizeListener.bind(this);

    this.handleTaggedElement = this.handleTaggedElement.bind(this);
    this.sendAllElements = this.sendAllElements.bind(this);

    // Attach interaction listeners
    this.addHoverListener();
    this.addScrollListener();
    this.addMutationListener();
    this.addResizeListener();
  }

  // Handles incoming messages from Contentful
  public receiveMessage(data: MessageFromEditor): void {
    if (data.method === InspectorModeEventMethods.INSPECTOR_MODE_CHANGED) {
      const { isInspectorActive } = data as InspectorModeChangedMessage;
      if (isInspectorActive) {
        this.sendAllElements();
      }
    } else if (
      data.method === LivePreviewPostMessageMethods.ENTRY_UPDATED ||
      data.method === LivePreviewPostMessageMethods.ENTRY_SAVED
    ) {
      // for entry updates we need to wait a bit to make sure the DOM is updated
      // then send the tagged elements again so that outlines are correct
      this.handleResizing(250);
    }
  }

  private handleResizing(timeout = 150) {
    if (!this.isResizing) {
      this.isResizing = true;
      sendMessageToEditor(InspectorModeEventMethods.RESIZE_START, {}, this.targetOrigin);
    }

    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    // Start timeout to trigger the `end` event, if there would be another resize event,
    // the existing timeout will be canceled and it starts again.
    // Prevents showing wrong information during resizing.
    this.resizeTimeout = setTimeout(() => {
      this.isResizing = false;
      sendMessageToEditor(InspectorModeEventMethods.RESIZE_END, {}, this.targetOrigin);
      this.sendAllElements();
      if (this.hoveredElement) {
        this.handleTaggedElement(this.hoveredElement);
      }
    }, timeout);
  }

  /** Checks if the hovered element is an tagged entry and then sends it to the editor */
  private addHoverListener() {
    const onMouseOver = (e: MouseEvent) => {
      const eventTargets = e.composedPath();

      for (const eventTarget of eventTargets) {
        const element = eventTarget as HTMLElement;
        if (element.nodeName === 'BODY') break;
        if (typeof element?.getAttribute !== 'function') continue;

        if (this.handleTaggedElement(element)) {
          return;
        }
      }

      // Clear if no tagged element is hovered
      if (this.hoveredElement) {
        this.hoveredElement = undefined;
        sendMessageToEditor(
          InspectorModeEventMethods.MOUSE_MOVE,
          { element: null },
          this.targetOrigin
        );
      }
    };

    window.addEventListener('mouseover', onMouseOver);

    return () => window.removeEventListener('mouseover', onMouseOver);
  }

  /** Sends scroll start and end event to the editor, on end it also sends the tagged elements again */
  private addScrollListener() {
    const onScroll = () => {
      if (!this.isScrolling) {
        this.isScrolling = true;
        sendMessageToEditor(InspectorModeEventMethods.SCROLL_START, {}, this.targetOrigin);
      }

      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
      }

      // Start timeout to trigger the `end` event, if there would be another scroll event,
      // the existing timeout will be canceled and it starts again.
      // Prevents showing wrong information during scrolling.
      this.scrollTimeout = setTimeout(() => {
        this.isScrolling = false;
        sendMessageToEditor(InspectorModeEventMethods.SCROLL_END, {}, this.targetOrigin);
        this.sendAllElements();
        if (this.hoveredElement) {
          this.handleTaggedElement(this.hoveredElement);
        }
      }, 150);
    };

    window.addEventListener('scroll', onScroll);

    return () => window.removeEventListener('scroll', onScroll);
  }

  /** Detects DOM changes and sends the tagged elements to the editor */
  private addMutationListener() {
    const mutationObserver = new MutationObserver(() => {
      const taggedElements = getAllTaggedElements().filter(
        (el) => !!getInspectorModeAttributes(el)
      );

      if (this.taggedElements?.length !== taggedElements.length) {
        this.sendAllElements();
      }
    });

    mutationObserver.observe(document.body, {
      attributes: true,
      attributeFilter: [
        InspectorModeDataAttributes.ENTRY_ID,
        InspectorModeDataAttributes.FIELD_ID,
        InspectorModeDataAttributes.LOCALE,
      ],
      childList: true,
      subtree: true,
    });

    return () => mutationObserver.disconnect();
  }

  /** Sends resize start and end event to the editor, on end it also sends the tagged elements again */
  private addResizeListener() {
    const resizeObserver = new ResizeObserver(() => {
      this.handleResizing();
    });

    resizeObserver.observe(document.body);

    return () => resizeObserver.disconnect();
  }

  /**
   * Validates if the element has the inspector mode attributes
   * and sends it then to the editor
   */
  private handleTaggedElement(element: HTMLElement): boolean {
    const taggedInformation = getInspectorModeAttributes(element, this.defaultLocale);

    if (!taggedInformation) {
      return false;
    }

    this.hoveredElement = element;
    sendMessageToEditor(
      InspectorModeEventMethods.MOUSE_MOVE,
      {
        element: {
          attributes: taggedInformation,
          coordinates: element.getBoundingClientRect(),
        },
      },
      this.targetOrigin
    );

    return true;
  }

  /**
   * Finds all elements that have all inspector mode attributes
   * and sends them to the editor
   */
  private sendAllElements() {
    const entries = getAllTaggedElements().filter(
      (element) => !!getInspectorModeAttributes(element, this.defaultLocale)
    );

    this.taggedElements = entries;

    sendMessageToEditor(
      InspectorModeEventMethods.TAGGED_ELEMENTS,
      {
        elements: entries.map((e) => ({
          coordinates: e.getBoundingClientRect(),
        })),
      },
      this.targetOrigin
    );
  }
}
