import { sendMessageToEditor } from '../helpers/index.js';
import { type MessageFromEditor } from '../messages.js';
import {
  InspectorModeDataAttributes,
  InspectorModeEventMethods,
  type InspectorModeChangedMessage,
} from './types.js';
import { getAllTaggedElements, getInspectorModeAttributes } from './utils.js';

type InspectorModeOptions = {
  locale: string;
  space?: string;
  environment?: string;
  targetOrigin: string[];
  ignoreManuallyTaggedElements?: boolean;
};

export class InspectorMode {
  private isScrolling = false;
  private scrollTimeout?: NodeJS.Timeout;

  private isResizing = false;
  private resizeTimeout?: NodeJS.Timeout;

  private hoveredElement?: HTMLElement;
  private taggedElements: Element[] = [];
  private taggedElementMutationObserver?: MutationObserver;

  constructor(private options: InspectorModeOptions) {
    // Attach interaction listeners
    this.addHoverListener();
    this.addScrollListener();
    this.addMutationListener();
    this.addResizeListener();
  }

  // Handles incoming messages from Contentful
  public receiveMessage = (data: MessageFromEditor): void => {
    if (data.method === InspectorModeEventMethods.INSPECTOR_MODE_CHANGED) {
      const { isInspectorActive } = data as InspectorModeChangedMessage;
      if (isInspectorActive) {
        this.sendAllElements();
      }
    }
  };

  /** Checks if the hovered element is an tagged entry and then sends it to the editor */
  private addHoverListener = () => {
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
          this.options.targetOrigin,
        );
      }
    };

    window.addEventListener('mouseover', onMouseOver);

    return () => window.removeEventListener('mouseover', onMouseOver);
  };

  /** Sends scroll start and end event to the editor, on end it also sends the tagged elements again */
  private addScrollListener = () => {
    const { targetOrigin } = this.options;

    const onScroll = () => {
      if (!this.isScrolling) {
        this.isScrolling = true;
        sendMessageToEditor(InspectorModeEventMethods.SCROLL_START, {}, targetOrigin);
      }

      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
      }

      // Start timeout to trigger the `end` event, if there would be another scroll event,
      // the existing timeout will be canceled and it starts again.
      // Prevents showing wrong information during scrolling.
      this.scrollTimeout = setTimeout(() => {
        this.isScrolling = false;
        sendMessageToEditor(InspectorModeEventMethods.SCROLL_END, {}, targetOrigin);
        this.sendAllElements();
        if (this.hoveredElement) {
          this.handleTaggedElement(this.hoveredElement);
        }
      }, 150);
    };

    window.addEventListener('scroll', onScroll);

    return () => window.removeEventListener('scroll', onScroll);
  };

  /** Detects DOM changes and sends the tagged elements to the editor */
  private addMutationListener = () => {
    const mutationObserver = new MutationObserver(() => {
      const { taggedElements } = getAllTaggedElements();

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
        InspectorModeDataAttributes.SPACE,
        InspectorModeDataAttributes.ENVIRONMENT,
      ],
      childList: true,
      subtree: true,
    });

    return () => mutationObserver.disconnect();
  };

  /** Sends resize start and end event to the editor, on end it also sends the tagged elements again */
  private addResizeListener = () => {
    const { targetOrigin } = this.options;

    const resizeObserver = new ResizeObserver(() => {
      if (!this.isResizing) {
        this.isResizing = true;
        sendMessageToEditor(InspectorModeEventMethods.RESIZE_START, {}, targetOrigin);
      }

      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }

      // Start timeout to trigger the `end` event, if there would be another resize event,
      // the existing timeout will be canceled and it starts again.
      // Prevents showing wrong information during resizing.
      this.resizeTimeout = setTimeout(() => {
        this.isResizing = false;
        sendMessageToEditor(InspectorModeEventMethods.RESIZE_END, {}, targetOrigin);
        this.sendAllElements();
        if (this.hoveredElement) {
          this.handleTaggedElement(this.hoveredElement);
        }
      }, 150);
    });

    resizeObserver.observe(document.body);

    return () => resizeObserver.disconnect();
  };

  /**
   * Validates if the element has the inspector mode attributes
   * and sends it then to the editor
   */
  private handleTaggedElement = (element: HTMLElement): boolean => {
    const { targetOrigin, locale, space, environment } = this.options;
    const taggedInformation = getInspectorModeAttributes(element, { locale, space, environment });

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
      targetOrigin,
    );

    return true;
  };

  /**
   * Finds all elements that have all inspector mode attributes
   * and sends them to the editor
   */
  private sendAllElements = () => {
    const { targetOrigin, locale, space, environment } = this.options;
    const { taggedElements, manuallyTaggedCount, automaticallyTaggedCount } =
      getAllTaggedElements();

    this.taggedElements = taggedElements;
    if (this.taggedElementMutationObserver) {
      this.taggedElementMutationObserver.disconnect();
    }

    const sendTaggedElementsMessage = () => {
      sendMessageToEditor(
        InspectorModeEventMethods.TAGGED_ELEMENTS,
        {
          elements: taggedElements.map((e) => ({
            attributes: getInspectorModeAttributes(e, { locale, space, environment }),
            coordinates: e.getBoundingClientRect(),
          })),
          automaticallyTaggedCount,
          manuallyTaggedCount,
        },
        targetOrigin,
      );
    };

    this.taggedElementMutationObserver = new MutationObserver(sendTaggedElementsMessage);

    this.taggedElements.forEach((element) => {
      this.taggedElementMutationObserver?.observe(element, {
        attributes: true,
        attributeFilter: [
          InspectorModeDataAttributes.ENTRY_ID,
          InspectorModeDataAttributes.FIELD_ID,
          InspectorModeDataAttributes.LOCALE,
          InspectorModeDataAttributes.SPACE,
          InspectorModeDataAttributes.ENVIRONMENT,
        ],
        childList: true,
        subtree: true,
        characterData: true,
      });
    });

    sendTaggedElementsMessage();
  };
}
