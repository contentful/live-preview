import {
  DATA_CURR_ENTRY_ID,
  DATA_CURR_FIELD_ID,
  DATA_CURR_LOCALE,
  TOOLTIP_CLASS,
  TOOLTIP_HEIGHT,
  TOOLTIP_PADDING_LEFT,
} from './constants';
import { MessageAction, TagAttributes } from './types';
import { sendMessageToEditor } from './utils';

export class FieldTagging {
  private tooltip: HTMLButtonElement | null = null; // this tooltip scrolls to the correct field in the entry editor
  private currentElementBesideTooltip: HTMLElement | null = null; // this element helps to position the tooltip

  constructor() {
    this.tooltip = null;
    this.currentElementBesideTooltip = null;

    this.updateTooltipPosition = this.updateTooltipPosition.bind(this);
    this.addTooltipOnHover = this.addTooltipOnHover.bind(this);
    this.createTooltip = this.createTooltip.bind(this);
    this.clickHandler = this.clickHandler.bind(this);

    this.createTooltip();
    window.addEventListener('scroll', this.updateTooltipPosition);
    window.addEventListener('mouseover', this.addTooltipOnHover);
  }

  // Handles incoming messages from Contentful
  public receiveMessage(data: Record<string, unknown>): void {
    if (typeof data.isInspectorActive === 'boolean') {
      // Toggle the contentful-inspector--active class on the body element based on the isInspectorActive boolean
      document.body.classList.toggle('contentful-inspector--active', data.isInspectorActive);
    }
  }

  // Updates the position of the tooltip
  private updateTooltipPosition() {
    if (!this.currentElementBesideTooltip || !this.tooltip) return false;

    const currentRectOfElement = this.currentElementBesideTooltip.getBoundingClientRect();
    const currentRectOfParentOfElement = this.tooltip.parentElement?.getBoundingClientRect();

    if (currentRectOfElement && currentRectOfParentOfElement) {
      let upperBoundOfTooltip = currentRectOfElement.top - TOOLTIP_HEIGHT;
      const left = currentRectOfElement.left - TOOLTIP_PADDING_LEFT;

      if (upperBoundOfTooltip < 0) {
        if (currentRectOfElement.top < 0) upperBoundOfTooltip = currentRectOfElement.top;
        else upperBoundOfTooltip = 0;
      }

      this.tooltip.style.top = upperBoundOfTooltip + 'px';
      this.tooltip.style.left = left + 'px';

      return true;
    }

    return false;
  }

  private addTooltipOnHover(e: MouseEvent) {
    const eventTargets = e.composedPath();

    for (const eventTarget of eventTargets) {
      const element = eventTarget as HTMLElement;
      if (element.nodeName === 'BODY') break;
      if (typeof element?.getAttribute !== 'function') continue;

      const currFieldId = element.getAttribute(TagAttributes.FIELD_ID);
      const currEntryId = element.getAttribute(TagAttributes.ENTRY_ID);
      const currLocale = element.getAttribute(TagAttributes.LOCALE);

      if (currFieldId && currEntryId && currLocale) {
        this.currentElementBesideTooltip = element;

        if (this.updateTooltipPosition()) {
          this.tooltip?.setAttribute(DATA_CURR_FIELD_ID, currFieldId);
          this.tooltip?.setAttribute(DATA_CURR_ENTRY_ID, currEntryId);
          this.tooltip?.setAttribute(DATA_CURR_LOCALE, currLocale);
        }

        break;
      }
    }
  }

  private createTooltip() {
    if (!document.querySelector(`.${TOOLTIP_CLASS}`)) {
      const tooltip = document.createElement('button');
      tooltip.classList.add(TOOLTIP_CLASS);
      tooltip.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M13.5325 2.22242C13.825 2.51492 13.825 2.98742 13.5325 3.27992L12.16 4.65242L9.3475 1.83992L10.72 0.467422C11.0125 0.174922 11.485 0.174922 11.7775 0.467422L13.5325 2.22242ZM0.25 13.7499V10.9374L8.545 2.64243L11.3575 5.45493L3.0625 13.7499H0.25Z" fill="white"/>
      </svg>Edit`;
      window.document.body.insertAdjacentElement('beforeend', tooltip);
      tooltip.addEventListener('click', this.clickHandler);
      this.tooltip = tooltip;
    }
    this.updateTooltipPosition();
  }

  // responsible for handling the event when the user clicks on the edit button in the tooltip
  private clickHandler() {
    if (!this.tooltip) {
      return;
    }
    const fieldId = this.tooltip.getAttribute(DATA_CURR_FIELD_ID);
    const entryId = this.tooltip.getAttribute(DATA_CURR_ENTRY_ID);
    const locale = this.tooltip.getAttribute(DATA_CURR_LOCALE);

    sendMessageToEditor(MessageAction.TAGGED_FIELD_CLICKED, {
      fieldId,
      entryId,
      locale,
    });
  }
}
