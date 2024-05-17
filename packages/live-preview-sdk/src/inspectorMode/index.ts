import { debounce, sendMessageToEditor } from '../helpers/index.js';
import { type MessageFromEditor } from '../messages.js';
import {
  InspectorModeDataAttributes,
  InspectorModeEventMethods,
  type InspectorModeAttributes,
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

type TaggedElement = {
  attributes: InspectorModeAttributes;
  coordinates: DOMRect;
  element: Element;
  isVisible: boolean;
};

export class InspectorMode {
  private delay = 150;

  private isScrolling = false;
  private scrollTimeout?: NodeJS.Timeout;

  private isResizing = false;
  private resizeTimeout?: NodeJS.Timeout;

  private hoveredElement?: Element;
  private taggedElements: TaggedElement[] = [];
  private manuallyTaggedCount: number = 0;
  private automaticallyTaggedCount: number = 0;

  private io: IntersectionObserver;

  constructor(private options: InspectorModeOptions) {
    this.io = new IntersectionObserver(
      (entries) => {
        const taggedElements: TaggedElement[] = this.taggedElements;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            for (const te of taggedElements) {
              if (te.element === entry.target) {
                te.coordinates = entry.intersectionRect;
                te.isVisible = entry.target.checkVisibility({
                  checkOpacity: true,
                  checkVisibilityCSS: true,
                });
              }
            }
          }
        }

        this.taggedElements = taggedElements;
        this.sendTaggedElements();
      },
      { threshold: 0.15 },
    );

    // Attach interaction listeners
    this.addScrollListener();
    this.addMutationListener();
    this.addResizeListener();
    this.addMouseMoveListener();
    this.addHoverListener();
  }

  // Handles incoming messages from Contentful
  public receiveMessage = (data: MessageFromEditor): void => {
    if (data.method === InspectorModeEventMethods.INSPECTOR_MODE_CHANGED) {
      const { isInspectorActive } = data as InspectorModeChangedMessage;
      if (isInspectorActive) {
        this.updateElements();
      }
    }
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
        this.updateElements();
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
        this.updateElements();
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
        'class',
        'style',
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
        this.updateElements();
      }, this.delay);
    });

    resizeObserver.observe(document.body);

    return () => resizeObserver.disconnect();
  };

  private sendTaggedElements = () => {
    sendMessageToEditor(
      InspectorModeEventMethods.TAGGED_ELEMENTS,
      {
        elements: this.taggedElements.map((taggedElement) => ({
          ...taggedElement,
          // We need to remove the actual DOM node before sending it
          // Prevents: `DataCloneError: Failed to execute 'postMessage' on 'Window': HTMLDivElement object could not be cloned.`
          element: undefined,
          isHovered: this.hoveredElement === taggedElement.element,
        })),
        automaticallyTaggedCount: this.automaticallyTaggedCount,
        manuallyTaggedCount: this.manuallyTaggedCount,
      },
      this.options.targetOrigin,
    );
  };

  /** Checks if the hovered element is an tagged entry and then sends it to the editor */
  private addHoverListener = () => {
    const onMouseOver = (e: MouseEvent) => {
      let match: TaggedElement | undefined;

      const eventTargets = e.composedPath();
      for (const eventTarget of eventTargets) {
        const element = eventTarget as HTMLElement;
        if (element.nodeName === 'BODY') break;

        const taggedElement = this.taggedElements.find((te) => te.element === element);
        if (taggedElement) {
          match = taggedElement;
          break;
        }
      }

      this.hoveredElement = match?.element;
      this.sendTaggedElements();
    };

    window.addEventListener('mouseover', onMouseOver, { passive: true });

    return () => window.removeEventListener('mouseover', onMouseOver);
  };

  /** Checks if through interactions the tagged elements has been changed */
  private addMouseMoveListener = () => {
    const onMouseMove = debounce(() => {
      if (this.isResizing || this.isScrolling) {
        return;
      }

      this.updateElements();
    }, this.delay);

    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  };

  /**
   * Finds all elements that have all inspector mode attributes
   * and sends them to the editor
   */
  private updateElements = () => {
    const { taggedElements, manuallyTaggedCount, automaticallyTaggedCount } =
      getAllTaggedElements();

    // clear previously watched element
    this.taggedElements.forEach((te) => this.io.unobserve(te.element));
    this.taggedElements = taggedElements.map((taggedElement) => ({
      element: taggedElement,
      coordinates: taggedElement.getBoundingClientRect(),
      attributes: getInspectorModeAttributes(taggedElement, this.options)!,
      isVisible: false,
    }));
    // watch the new ones
    taggedElements.forEach((te) => this.io.observe(te));

    this.manuallyTaggedCount = manuallyTaggedCount;
    this.automaticallyTaggedCount = automaticallyTaggedCount;
  };
}
