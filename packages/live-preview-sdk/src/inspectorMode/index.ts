import { debounce, sendMessageToEditor } from '../helpers/index.js';
import { type MessageFromEditor } from '../messages.js';
import {
  InspectorModeDataAttributes,
  InspectorModeEventMethods,
  type InspectorModeAttributes,
  type InspectorModeChangedMessage,
} from './types.js';
import { AutoTaggedElement, getAllTaggedElements, getInspectorModeAttributes } from './utils.js';

type InspectorModeOptions = {
  locale: string;
  space?: string;
  environment?: string;
  targetOrigin: string[];
  ignoreManuallyTaggedElements?: boolean;
};

type TaggedElement = {
  element: Element;
  isVisible: boolean;
  coordinates: DOMRect;
  attributes: InspectorModeAttributes;
};

export class InspectorMode {
  private delay = 150;

  private isScrolling = false;
  private scrollTimeout?: NodeJS.Timeout;

  private isResizing = false;
  private resizeTimeout?: NodeJS.Timeout;

  private hoveredElement?: HTMLElement;
  private taggedElements: TaggedElement[] = [];
  private taggedElementMutationObserver?: MutationObserver;
  private autoTaggedElements: AutoTaggedElement[] = [];

  constructor(private options: InspectorModeOptions) {
    // Attach interaction listeners
    this.addHoverListener();
    this.addScrollListener();
    this.addMutationListener();
    this.addResizeListener();
    this.addMouseMoveListener();
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
      }, this.delay);
    };

    const options = { capture: true, passive: true };
    window.addEventListener('scroll', onScroll, options);

    return () => window.removeEventListener('scroll', onScroll, options);
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
      // Content source maps
      characterData: true,
      // Manual tagging
      attributes: true,
      attributeFilter: [
        InspectorModeDataAttributes.ENTRY_ID,
        InspectorModeDataAttributes.FIELD_ID,
        InspectorModeDataAttributes.LOCALE,
        InspectorModeDataAttributes.SPACE,
        InspectorModeDataAttributes.ENVIRONMENT,
      ],
      // Adding or removal of new nodes
      childList: true,
      // Include children
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
      }, this.delay);
    });

    resizeObserver.observe(document.body);

    return () => resizeObserver.disconnect();
  };

  /** Checks if through interactions the tagged elements has been changed */
  private addMouseMoveListener = () => {
    const onMouseMove = debounce(() => {
      if (this.isResizing || this.isScrolling) {
        return;
      }

      this.sendAllElements();
    }, this.delay);

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMouseMove);
  };

  /**
   * Validates if the element
   * - is visible
   * - has the inspector mode attributes
   * and sends it then to the editor
   */
  private handleTaggedElement = (element: HTMLElement): boolean => {
    if (!this.isVisible(element)) {
      return false;
    }

    const { targetOrigin, locale, space, environment } = this.options;
    let taggedInformation = getInspectorModeAttributes(element, { locale, space, environment });

    if (!taggedInformation) {
      const autoTaggedElement = this.autoTaggedElements.find((el) => el.element === element);

      if (!autoTaggedElement) {
        return false;
      }

      const contentful = autoTaggedElement.sourceMap.contentful;
      taggedInformation = {
        fieldId: contentful.field,
        locale: contentful.locale ?? locale,
        environment: contentful.environment ?? environment,
        space: contentful.space ?? space,
        ...(contentful.entityType === 'Asset'
          ? { assetId: contentful.entity }
          : { entryId: contentful.entity }),
        manuallyTagged: false,
      };
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
   * Checks if the provided element is visible
   */
  private isVisible = (element: HTMLElement): boolean => {
    if ('checkVisibility' in element) {
      return element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
    }
    // Safari does not support element.checkVisibility yet
    // Type casts are needed as typescript defines checkVisiblity to always exists on HTMLElement
    const style = window.getComputedStyle(element);
    return !(
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.opacity === '0' ||
      (element as HTMLElement).hidden ||
      (element as HTMLElement).offsetParent === null ||
      (element as HTMLElement).getClientRects().length === 0
    );
  };

  /**
   * Finds all elements that have all inspector mode attributes
   * and sends them to the editor
   */
  private sendAllElements = () => {
    const { targetOrigin, locale, space, environment } = this.options;
    const { taggedElements, manuallyTaggedCount, automaticallyTaggedCount, autoTaggedElements } =
      getAllTaggedElements();

    this.taggedElements = taggedElements.map((element) => ({
      element,
      attributes: getInspectorModeAttributes(element, { locale, space, environment })!,
      coordinates: element.getBoundingClientRect(),
      isVisible: this.isVisible(element as HTMLElement),
    }));
    this.autoTaggedElements = autoTaggedElements;

    if (this.taggedElementMutationObserver) {
      this.taggedElementMutationObserver.disconnect();
    }

    const sendTaggedElementsMessage = () => {
      sendMessageToEditor(
        InspectorModeEventMethods.TAGGED_ELEMENTS,
        {
          elements: this.taggedElements.map((taggedElement) => ({
            ...taggedElement,
            // We need to remove the actual DOM node before sending it
            // Prevents: `DataCloneError: Failed to execute 'postMessage' on 'Window': HTMLDivElement object could not be cloned.`
            element: undefined,
          })),
          automaticallyTaggedCount,
          manuallyTaggedCount,
        },
        targetOrigin,
      );
    };

    this.taggedElementMutationObserver = new MutationObserver(sendTaggedElementsMessage);
    // TODO: why do we need this?
    this.taggedElements.forEach(({ element }) => {
      this.taggedElementMutationObserver?.observe(element, {
        // Content source maps
        characterData: true,
        // Manual tagging
        attributes: true,
        attributeFilter: [
          InspectorModeDataAttributes.ENTRY_ID,
          InspectorModeDataAttributes.FIELD_ID,
          InspectorModeDataAttributes.LOCALE,
          InspectorModeDataAttributes.SPACE,
          InspectorModeDataAttributes.ENVIRONMENT,
        ],
        // Adding or removal of new nodes
        childList: true,
        // Include children
        subtree: true,
      });
    });

    sendTaggedElementsMessage();
  };
}
