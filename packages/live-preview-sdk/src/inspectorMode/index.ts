import isEqual from 'lodash.isequal';

import { debounce, sendMessageToEditor } from '../helpers/index.js';
import { type MessageFromEditor } from '../messages.js';
import {
  InspectorModeDataAttributes,
  InspectorModeEventMethods,
  type InspectorModeAttributes,
  type InspectorModeChangedMessage,
} from './types.js';
import { getAllTaggedElements } from './utils.js';

export type InspectorModeOptions = {
  locale: string;
  space?: string;
  environment?: string;
  targetOrigin: string[];
  ignoreManuallyTaggedElements?: boolean;
};

type TaggedElement = {
  attributes: InspectorModeAttributes | null;
  coordinates: DOMRect;
  element: Element;
  isVisible: boolean;
  zIndex: number;
  layerCoordinates: DOMRect;
  isCoveredByOtherElement: boolean;
};

export class InspectorMode {
  private delay = 300;

  private isScrolling = false;
  private scrollTimeout?: NodeJS.Timeout;

  private isResizing = false;
  private resizeTimeout?: NodeJS.Timeout;

  private hoveredElement?: Element;
  private taggedElements: TaggedElement[] = [];
  private manuallyTaggedCount: number = 0;
  private automaticallyTaggedCount: number = 0;

  private intersectionObserver: IntersectionObserver;

  private observersCB: VoidFunction[] = [];
  private cleanupCB: VoidFunction[] = [];

  constructor(private options: InspectorModeOptions) {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        const taggedElements: TaggedElement[] = this.taggedElements;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            for (const te of taggedElements) {
              if (te.element === entry.target) {
                // Update coordinates (in case something is in an scrollable element)
                te.coordinates = entry.intersectionRect;
                // Update visibility information
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
  }

  /**
   * Attaches the event listeners and send the tagged elements once
   */
  private init = () => {
    // Attach interaction listeners
    this.cleanupCB = [
      this.addScrollListener(),
      this.addMutationListener(document.body),
      this.addResizeListener(),
      this.addHoverListener(),
    ];

    // Send the elements once
    this.updateElements();
  };

  /**
   * Cancels all listeners and observers
   */
  private cleanup = () => {
    this.observersCB.forEach((cb) => cb());
    this.cleanupCB.forEach((cb) => cb());
  };

  // Handles incoming messages from Contentful
  public receiveMessage = (data: MessageFromEditor): void => {
    if (data.method === InspectorModeEventMethods.INSPECTOR_MODE_CHANGED) {
      const { isInspectorActive } = data as InspectorModeChangedMessage;
      if (isInspectorActive) {
        this.init();
      } else {
        this.cleanup();
      }
    }
  };

  /** Listen for changes on the element via intersection and mutation observer */
  private observe = (element: Element) => {
    this.intersectionObserver.observe(element);
    const disconnect = this.addMutationListener(element);

    this.observersCB.push(disconnect, () => this.intersectionObserver.unobserve(element));
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
  private addMutationListener = (element: Element) => {
    const mutationObserver = new MutationObserver(() => {
      this.updateElements();
    });
    mutationObserver.observe(element, {
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

  /** Checks if the hovered element is an tagged entry and then sends it to the editor */
  private addHoverListener = () => {
    const onMouseOverInternal = debounce((eventTargets: EventTarget[]) => {
      let match: TaggedElement | undefined;

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
      this.updateElements();
    }, this.delay);

    const onMouseOver = (e: MouseEvent) => {
      // Need to debounce the internal logic,
      // otherwise the eventTargets would be always an empty array
      onMouseOverInternal(e.composedPath());
    };

    window.addEventListener('mouseover', onMouseOver, { passive: true });

    return () => window.removeEventListener('mouseover', onMouseOver);
  };

  private sendTaggedElements = () => {
    sendMessageToEditor(
      InspectorModeEventMethods.TAGGED_ELEMENTS,
      {
        elements: this.taggedElements.map((taggedElement) => ({
          // Important: do not add `element` as it can't be cloned by sendMessage
          coordinates: taggedElement.coordinates,
          isVisible: taggedElement.isVisible,
          attributes: taggedElement.attributes,
          isHovered: this.hoveredElement === taggedElement.element,
          isCoveredByOtherElement: !!taggedElement.isCoveredByOtherElement,
        })),
        automaticallyTaggedCount: this.automaticallyTaggedCount,
        manuallyTaggedCount: this.manuallyTaggedCount,
      },
      this.options.targetOrigin,
    );
  };

  private getZIndex = (element: Element): string | null => {
    if (window.getComputedStyle) {
      const computedStyle = window.getComputedStyle(element);
      if (computedStyle.zIndex) {
        return computedStyle.zIndex;
      }
    }
    return null;
  };

  private getClosestParentWithZIndex = (
    element: Element,
  ): { closestParent?: Element; zIndex?: string } => {
    const zIndex = this.getZIndex(element);

    if (zIndex !== 'auto' && zIndex !== null) {
      return { zIndex, closestParent: element };
    }

    if (!element.parentElement) {
      return {};
    }

    return this.getClosestParentWithZIndex(element.parentElement);
  };

  private doElementIntersect = (elementA: DOMRect, elementB: DOMRect): boolean => {
    // Check if the two elements intersect
    if (
      elementA.left < elementB.right &&
      elementA.right > elementB.left &&
      elementA.top < elementB.bottom &&
      elementA.bottom > elementB.top
    ) {
      return true;
    }

    return false;
  };

  /**
   * 1. Gets the z-index of the element or the closest parent with a z-index
   * 2. Calculates the bounding boxes for the tagged elements and the layer they are on
   */
  private addCoordinatesAndLayerAttributesToTaggedElements = (
    taggedElements: Partial<TaggedElement>[],
  ): Partial<TaggedElement>[] => {
    return taggedElements.map(({ element, attributes }) => {
      const { closestParent, zIndex } = this.getClosestParentWithZIndex(element!);
      const elementCoordinates = element!.getBoundingClientRect();
      const layerCoordinates = closestParent
        ? closestParent.getBoundingClientRect()
        : elementCoordinates;
      const nextElement = {
        element,
        coordinates: elementCoordinates,
        attributes,
        zIndex: zIndex ? Number(zIndex) : 0,
        layerCoordinates,
      };
      return nextElement;
    });
  };

  /**
   * 1. Checks if the element is visible
   * 2. Checks if the element is covered by another element with a higher z-index
   */
  private addVisibilityAttributesToTaggedElements = (taggedElements: Partial<TaggedElement>[]) =>
    taggedElements.map((taggedElement, currentIndex) => {
      const { element, layerCoordinates, zIndex } = taggedElement;
      const isVisible = element!.checkVisibility({
        checkOpacity: true,
        checkVisibilityCSS: true,
      });

      for (let otherIndex = 0; otherIndex < taggedElements.length; otherIndex++) {
        if (currentIndex === otherIndex) {
          continue;
        }

        const otherElement = taggedElements[otherIndex];
        const { layerCoordinates: otherParentCoordinates, zIndex: otherZIndex } = otherElement;

        if (
          zIndex! < otherZIndex! &&
          this.doElementIntersect(layerCoordinates!, otherParentCoordinates!)
        ) {
          return { ...taggedElement, isVisible, isCoveredByOtherElement: true };
        }
      }

      return { ...taggedElement, isVisible, isCoveredByOtherElement: false };
    });

  /**
   * Finds all elements that have all inspector mode attributes
   * and sends them to the editor
   */
  private updateElements = () => {
    const { taggedElements, manuallyTaggedCount, automaticallyTaggedCount } = getAllTaggedElements({
      options: this.options,
    });

    const taggedElementsWithCalculatedAttributes =
      this.addCoordinatesAndLayerAttributesToTaggedElements(taggedElements);
    const nextElements = this.addVisibilityAttributesToTaggedElements(
      taggedElementsWithCalculatedAttributes,
    );

    if (isEqual(nextElements, this.taggedElements)) {
      return;
    }

    // clear previously watched elements
    this.observersCB.forEach((cb) => cb());
    this.observersCB = [];

    // update elements and watch them
    this.taggedElements = nextElements as TaggedElement[];
    taggedElements.forEach(({ element }) => this.observe(element));

    // update the counters for telemetry
    this.manuallyTaggedCount = manuallyTaggedCount;
    this.automaticallyTaggedCount = automaticallyTaggedCount;
  };
}
