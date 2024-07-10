import axe from 'axe-core';

import { debounce, sendMessageToEditor } from '../helpers/index.js';
import { type MessageFromEditor } from '../messages.js';
import { InspectorModeEventMethods, type InspectorModeAttributes } from './types.js';
import { getAllTaggedElements } from './utils.js';

export type A11yOptions = {
  targetOrigin: string[];
  locale: string;
};

type A11yElement = {
  coordinates: DOMRect;
  element: Element;
  selector: string[];
  isVisible: boolean;
  isHovered: boolean;
  attributes?: InspectorModeAttributes | null;
};

// TODO: some stuff is the same on inspectorMode, we could have a base class to share the observers, ..
export class A11yMode {
  private initialized = false;

  private delay = 300;

  private isScrolling = false;
  private scrollTimeout?: NodeJS.Timeout;

  private isResizing = false;
  private resizeTimeout?: NodeJS.Timeout;

  private hoveredElement?: Element;
  private originalElements: string[][] = [];
  private elements: A11yElement[] = [];

  private intersectionObserver: IntersectionObserver;

  private observersCB: VoidFunction[] = [];
  private cleanupCB: VoidFunction[] = [];

  constructor(private options: A11yOptions) {
    axe.configure({
      allowedOrigins: ['<unsafe_all_origins>'],
    });

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        const elements = this.elements;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            for (const e of elements) {
              if (e.element === entry.target) {
                // Update coordinates (in case something is in an scrollable element)
                e.coordinates = entry.intersectionRect;
                // Update visibility information
                e.isVisible = entry.target.checkVisibility({
                  checkOpacity: true,
                  checkVisibilityCSS: true,
                });
              }
            }
          }
        }

        this.elements = elements;
        this.sendResolvedNodes();
      },
      { threshold: 0.15 },
    );
  }

  /**
   * Attaches the event listeners and send the tagged elements once
   */
  private init = () => {
    this.initialized = true;

    // Attach interaction listeners
    this.cleanupCB = [this.addScrollListener(), this.addResizeListener(), this.addHoverListener()];
  };

  /**
   * Cancels all listeners and observers
   */
  private cleanup = () => {
    this.initialized = false;
    this.elements = [];
    this.originalElements = [];
    this.observersCB.forEach((cb) => cb());
    this.cleanupCB.forEach((cb) => cb());
  };

  // Handles incoming messages from Contentful
  public receiveMessage = (data: MessageFromEditor): void => {
    if ((data.method as any) === 'A11Y_CLOSED') {
      this.cleanup();
    }

    if (!this.initialized) {
      this.init();
    }

    if ((data.method as any) === 'A11Y_RESOLVE_NODES') {
      this.originalElements = (data as any).nodes;
      this.updateElements();
    }
  };

  private updateElements = () => {
    const resolvedNodes: A11yElement[] = [];
    const { taggedElements } = getAllTaggedElements({
      options: { locale: this.options.locale },
    });

    for (const selector of this.originalElements) {
      const resolved = document.querySelector(selector.join(' '));
      if (resolved) {
        resolvedNodes.push({
          element: resolved,
          selector,
          coordinates: resolved.getBoundingClientRect(),
          isVisible: resolved.checkVisibility({
            checkOpacity: true,
            checkVisibilityCSS: true,
          }),
          isHovered: false,
          attributes: taggedElements.find((te) => resolved === te.element)?.attributes,
        });
      }
    }

    this.elements = resolvedNodes;

    console.log('>> resolved elements', this.elements);

    this.observersCB.forEach((cb) => cb());
    this.observersCB = [];
    this.elements.forEach(({ element }) => this.observe(element));
  };

  /** Listen for changes on the element via intersection and mutation observer */
  private observe = (element: Element) => {
    this.intersectionObserver.observe(element);
    this.observersCB.push(() => this.intersectionObserver.unobserve(element));
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
      let match: A11yElement | undefined;

      for (const eventTarget of eventTargets) {
        const element = eventTarget as HTMLElement;
        if (element.nodeName === 'BODY') break;

        const taggedElement = this.elements.find((e) => e.element === element);
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

  private sendResolvedNodes = () => {
    sendMessageToEditor(
      'A11Y_RESOLVED_NODES' as any,
      {
        nodes: this.elements.map((element) => ({
          // Important: do not add `element` as it can't be cloned by sendMessage
          coordinates: element.coordinates,
          isVisible: element.isVisible,
          isHovered: this.hoveredElement === element.element,
          selector: element.selector,
        })),
      } as any,
      this.options.targetOrigin,
    );
  };
}
