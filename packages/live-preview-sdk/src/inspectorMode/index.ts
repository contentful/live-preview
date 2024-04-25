import { sendMessageToEditor } from '../helpers/index.js';
import { type MessageFromEditor } from '../messages.js';
import {
  InspectorModeEventMethods,
  type InspectorModeAttributes,
  type InspectorModeChangedMessage,
} from './types.js';
import { getAllTaggedElements, getInspectorModeAttributes } from './utils.js';

type TaggedElement = {
  element: Element;
  isVisible: boolean;
  attributes: InspectorModeAttributes;
  coordinates: DOMRect;
};

function isEqualElement(previousElement: TaggedElement, currentElement: TaggedElement): boolean {
  if (previousElement.isVisible !== currentElement.isVisible) {
    return false;
  }

  if (previousElement.attributes !== currentElement.attributes) {
    return false;
  }

  if (previousElement.coordinates !== currentElement.coordinates) {
    return false;
  }

  return previousElement.element === currentElement.element;
}

function isEqual(previousElements: TaggedElement[], currentElements: TaggedElement[]) {
  if (previousElements.length !== currentElements.length) {
    return false;
  }

  for (const key in previousElements) {
    if (!isEqualElement(previousElements[key], currentElements[key])) {
      return false;
    }
  }

  return true;
}

type InspectorModeOptions = {
  locale: string;
  space?: string;
  environment?: string;
  targetOrigin: string[];
  ignoreManuallyTaggedElements?: boolean;
};

const DELAY = 150;

export class InspectorMode {
  private isInteracting = false;
  private interactionTimeout?: NodeJS.Timeout;
  private pollInterval?: NodeJS.Timeout;

  private taggedElements: TaggedElement[] = [];

  constructor(private options: InspectorModeOptions) {
    this.addScrollListener();
    this.addResizeListener();
    this.addMouseMoveListener();
    this.listenToChanges();
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

  // FIXME: Check if someone would scroll and then quickly resize or otherway around
  // would it crash the inspector mode as the end event is not send?
  private createInteraction =
    (
      targetOrigin: string[],
      startEvent: InspectorModeEventMethods,
      endEvent?: InspectorModeEventMethods,
    ) =>
    () => {
      if (!this.isInteracting) {
        this.isInteracting = true;
        clearInterval(this.pollInterval);
        sendMessageToEditor(startEvent, {}, targetOrigin);
      }

      if (this.interactionTimeout) {
        clearTimeout(this.interactionTimeout);
      }

      // Start timeout to trigger the `end` event, if there would be another interaction event,
      // the existing timeout will be canceled and it starts again.
      // Prevents showing wrong information during interaction.
      this.interactionTimeout = setTimeout(() => {
        this.isInteracting = false;
        if (endEvent) {
          sendMessageToEditor(endEvent, {}, targetOrigin);
        }
        this.sendAllElements();
        this.listenToChanges();
      }, DELAY);
    };

  /** Sends scroll start and end event to the editor, on end it also sends the tagged elements again */
  private addScrollListener = () => {
    const { targetOrigin } = this.options;

    const onScroll = this.createInteraction(
      targetOrigin,
      InspectorModeEventMethods.SCROLL_START,
      InspectorModeEventMethods.SCROLL_END,
    );

    window.addEventListener('scroll', onScroll);

    return () => window.removeEventListener('scroll', onScroll);
  };

  /** Sends resize start and end event to the editor, on end it also sends the tagged elements again */
  private addResizeListener = () => {
    const { targetOrigin } = this.options;

    const resizeObserver = new ResizeObserver(
      this.createInteraction(
        targetOrigin,
        InspectorModeEventMethods.RESIZE_START,
        InspectorModeEventMethods.RESIZE_END,
      ),
    );

    resizeObserver.observe(document.body);

    return () => resizeObserver.disconnect();
  };

  private addMouseMoveListener = () => {
    const { targetOrigin } = this.options;

    const onScroll = this.createInteraction(targetOrigin, InspectorModeEventMethods.MOUSE_MOVE);

    window.addEventListener('mousemove', onScroll);

    return () => window.removeEventListener('mousemove', onScroll);
  };

  // vs mutationobserver on everything (no filter)
  private listenToChanges = () => {
    this.pollInterval = setInterval(() => {
      if (!this.isInteracting) {
        this.sendAllElements();
      }
    }, 1000);

    return () => clearInterval(this.pollInterval);
  };

  /**
   * Finds all elements that have all inspector mode attributes
   * and sends them to the editor
   */
  private sendAllElements = () => {
    const { targetOrigin, locale, space, environment } = this.options;
    const elements = getAllTaggedElements();

    const height = window.innerHeight || document.documentElement.clientHeight;
    const width = window.innerWidth || document.documentElement.clientWidth;

    const taggedElements = [];
    for (const e of elements) {
      const attributes = getInspectorModeAttributes(e, { locale, space, environment });

      if (attributes) {
        const coordinates = e.getBoundingClientRect();
        taggedElements.push({
          element: e,
          attributes,
          coordinates,
          isVisible:
            coordinates.top >= 0 &&
            coordinates.left >= 0 &&
            coordinates.bottom <= height &&
            coordinates.right <= width,
          // FIXME: should we check for opacity too?
        });
      }
    }

    if (!isEqual(taggedElements, this.taggedElements)) {
      this.taggedElements = taggedElements;

      sendMessageToEditor(
        InspectorModeEventMethods.TAGGED_ELEMENTS,
        {
          elements: this.taggedElements.map((te) => ({ ...te, element: undefined })),
        },
        targetOrigin,
      );
    }
  };
}
