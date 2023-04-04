import {
  DATA_CURR_ENTRY_ID,
  DATA_CURR_FIELD_ID,
  DATA_CURR_LOCALE,
  DATA_CURR_REF_ID,
  TOOLTIP_CLASS,
  TOOLTIP_HEIGHT,
  TOOLTIP_PADDING_LEFT,
} from './constants';
import { TagAttributes } from './types';
import { sendMessageToEditor } from './utils';

const INLINE_SUPPORTED = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

export class FieldTagging {
  private tooltips: {
    edit: HTMLButtonElement | null;
    remove: HTMLButtonElement | null;
    moveUp: HTMLButtonElement | null;
    moveDown: HTMLButtonElement | null;
  } = {
    edit: null,
    remove: null,
    moveUp: null,
    moveDown: null,
  };
  private currentElementBesideTooltip: HTMLElement | null = null; // this element helps to position the tooltip
  private inlineEditing = true;

  constructor() {
    this.tooltips = { edit: null, remove: null, moveUp: null, moveDown: null };
    this.currentElementBesideTooltip = null;

    this.updateTooltipPosition = this.updateTooltipPosition.bind(this);
    this.addTooltipOnHover = this.addTooltipOnHover.bind(this);
    this.createTooltips = this.createTooltips.bind(this);
    this.clickEditHandler = this.clickEditHandler.bind(this);
    this.createSingleTooltip = this.createSingleTooltip.bind(this);

    this.createTooltips();
  }

  // Handles incoming messages from Contentful
  public receiveMessage(data: Record<string, unknown>): void {
    if (typeof data.isInspectorActive === 'boolean') {
      // Toggle the contentful-inspector--active class on the body element based on the isInspectorActive boolean
      document.body.classList.toggle('contentful-inspector--active', data.isInspectorActive);
    }
  }

  private handleRemoveReferenceClick(event: MouseEvent, type: 'remove' | 'move_up' | 'move_down') {
    const button = event.target as HTMLButtonElement;
    const referenceId = button.getAttribute('current-data-contentful-reference-id') as string;
    const entryId = button.getAttribute('current-data-contentful-entry-id') as string;
    const fieldId = button.getAttribute('current-data-contentful-field-id') as string;

    if (entryId) {
      sendMessageToEditor({
        action: 'TAGGED_REFERENCE_CLICKED',
        type,
        referenceId,
        entryId,
        fieldId,
        locale: 'en-US',
      });
    }
  }

  // Updates the position of the tooltip
  private updateTooltipPosition(tooltipToUpdate: string) {
    if (!this.currentElementBesideTooltip) return false;

    const currentRectOfElement = this.currentElementBesideTooltip.getBoundingClientRect();
    const currentRectOfParentOfElement =
      this.currentElementBesideTooltip.parentElement?.getBoundingClientRect();

    if (currentRectOfElement && currentRectOfParentOfElement) {
      let upperBoundOfTooltip = currentRectOfElement.top - TOOLTIP_HEIGHT;
      const left = currentRectOfElement.left - TOOLTIP_PADDING_LEFT;
      const right = currentRectOfElement.right - 300;

      if (upperBoundOfTooltip < 0) {
        if (currentRectOfElement.top < 0) upperBoundOfTooltip = currentRectOfElement.top;
        else upperBoundOfTooltip = 0;
      }

      // Update position for the edit tooltip
      if (tooltipToUpdate === 'field' || tooltipToUpdate === 'all') {
        this.tooltips.edit?.style.setProperty('top', `${upperBoundOfTooltip}px`);
        this.tooltips.edit?.style.setProperty('left', `${left}px`);
      }

      if (tooltipToUpdate === 'reference' || tooltipToUpdate === 'all') {
        // Update positions for new tooltips
        this.tooltips.remove?.style.setProperty('top', `${upperBoundOfTooltip}px`);
        this.tooltips.remove?.style.setProperty('left', `${right}px`);
        this.tooltips.moveUp?.style.setProperty('top', `${upperBoundOfTooltip + TOOLTIP_HEIGHT}px`);
        this.tooltips.moveUp?.style.setProperty('left', `${right}px`);
        this.tooltips.moveDown?.style.setProperty(
          'top',
          `${upperBoundOfTooltip + 2 * TOOLTIP_HEIGHT}px`
        );
        this.tooltips.moveDown?.style.setProperty('left', `${right}px`);
      }

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
      const currReference = element.getAttribute(TagAttributes.REFERENCE);

      console.log('>> element', element);

      let tooltipToUpdate;

      if (currFieldId && currEntryId && currReference) {
        this.currentElementBesideTooltip = element;
        tooltipToUpdate = 'reference';
        if (this.updateTooltipPosition(tooltipToUpdate)) {
          this.tooltips.remove?.setAttribute(DATA_CURR_FIELD_ID, currFieldId);
          this.tooltips.remove?.setAttribute(DATA_CURR_ENTRY_ID, currEntryId);
          this.tooltips.remove?.setAttribute(DATA_CURR_REF_ID, currReference);
          this.tooltips.moveUp?.setAttribute(DATA_CURR_FIELD_ID, currFieldId);
          this.tooltips.moveUp?.setAttribute(DATA_CURR_ENTRY_ID, currEntryId);
          this.tooltips.moveUp?.setAttribute(DATA_CURR_REF_ID, currReference);
          this.tooltips.moveDown?.setAttribute(DATA_CURR_FIELD_ID, currFieldId);
          this.tooltips.moveDown?.setAttribute(DATA_CURR_ENTRY_ID, currEntryId);
          this.tooltips.moveDown?.setAttribute(DATA_CURR_REF_ID, currReference);
        }
        break;
      }

      if (currFieldId && currEntryId && currLocale) {
        this.currentElementBesideTooltip = element;
        tooltipToUpdate = 'field';
        if (this.updateTooltipPosition(tooltipToUpdate)) {
          this.tooltips.edit?.setAttribute(DATA_CURR_FIELD_ID, currFieldId);
          this.tooltips.edit?.setAttribute(DATA_CURR_ENTRY_ID, currEntryId);
          this.tooltips.edit?.setAttribute(DATA_CURR_LOCALE, currLocale);
        }

        // if there is a parent with a reference, then read it
        let parent = this.currentElementBesideTooltip.parentElement;
        do {
          const reference = parent?.getAttribute(TagAttributes.REFERENCE);
          if (reference) {
            this.tooltips.moveDown?.setAttribute(DATA_CURR_REF_ID, reference);
            this.tooltips.moveUp?.setAttribute(DATA_CURR_REF_ID, reference);
            this.tooltips.remove?.setAttribute(DATA_CURR_REF_ID, reference);
            parent = null;
          } else {
            parent = parent?.parentElement || null;
          }
        } while (parent && parent.tagName !== 'BODY');
        break;
      }
    }
  }

  // Method to create a tooltip for a specific action
  private createSingleTooltip(
    action: string,
    content: string,
    clickHandler: (event: MouseEvent) => void
  ): HTMLButtonElement {
    const tooltip = document.createElement('button');
    tooltip.classList.add(TOOLTIP_CLASS, `tooltip-${action}`);
    tooltip.innerHTML = content;
    tooltip.addEventListener('click', clickHandler);
    return tooltip;
  }

  // Update the createTooltip method to create all four tooltips
  private createTooltips() {
    if (!document.querySelector(`.${TOOLTIP_CLASS}`)) {
      this.tooltips.edit = this.createSingleTooltip(
        'edit',
        `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M13.5325 2.22242C13.825 2.51492 13.825 2.98742 13.5325 3.27992L12.16 4.65242L9.3475 1.83992L10.72 0.467422C11.0125 0.174922 11.485 0.174922 11.7775 0.467422L13.5325 2.22242ZM0.25 13.7499V10.9374L8.545 2.64243L11.3575 5.45493L3.0625 13.7499H0.25Z" fill="white"/>
        </svg>Edit`,
        this.clickEditHandler
      );
      this.tooltips.remove = this.createSingleTooltip('newTooltip1', 'remove', (e) =>
        this.handleRemoveReferenceClick(e, 'remove')
      );
      this.tooltips.moveUp = this.createSingleTooltip('newTooltip2', 'move up', (e) =>
        this.handleRemoveReferenceClick(e, 'move_up')
      );
      this.tooltips.moveDown = this.createSingleTooltip('newTooltip3', 'move down', (e) =>
        this.handleRemoveReferenceClick(e, 'move_down')
      );

      Object.values(this.tooltips).forEach((tooltip) => {
        if (tooltip) {
          window.document.body.insertAdjacentElement('beforeend', tooltip);
        }
      });

      window.addEventListener('scroll', () => this.updateTooltipPosition('all'));
      window.addEventListener('mouseover', this.addTooltipOnHover);
      window.addEventListener('mouseout', this.removeTooltip);
    }

    this.updateTooltipPosition('all');
  }

  private removeTooltip(e: MouseEvent) {
    let visible = false;
    Object.values(this.tooltips || {}).forEach((element) => {
      if (element && element.matches(':hover')) {
        visible = true;
      }
    });

    if (!visible) {
      const eventTargets = e.composedPath();

      for (const eventTarget of eventTargets) {
        const element = eventTarget as HTMLElement;
        if (element.nodeName === 'BODY') break;
        if (typeof element?.getAttribute !== 'function') continue;

        const currEntryId = element.getAttribute(TagAttributes.ENTRY_ID);

        if (currEntryId) {
          visible = true;
        }
      }
    }

    Object.values(this.tooltips || {}).forEach((element) => {
      if (element) element.style.display = visible ? 'block' : 'none';
    });
  }

  // responsible for handling the event when the user clicks on the edit button in the tooltip
  private clickEditHandler() {
    if (!this.tooltips.edit) {
      return;
    }
    const fieldId = this.tooltips.edit.getAttribute(DATA_CURR_FIELD_ID);
    const entryId = this.tooltips.edit.getAttribute(DATA_CURR_ENTRY_ID);
    const locale = this.tooltips.edit.getAttribute(DATA_CURR_LOCALE);

    if (fieldId && entryId && locale) {
      if (this.inlineEditing) {
        const editableField: HTMLInputElement | null = document.querySelector(
          `[${TagAttributes.ENTRY_ID}="${entryId}"][${TagAttributes.FIELD_ID}="${fieldId}"][${TagAttributes.LOCALE}="${locale}"]`
        );

        if (editableField && INLINE_SUPPORTED.includes(editableField.tagName.toLowerCase())) {
          const initialContent = editableField.textContent;
          // make it editable
          editableField.setAttribute('contenteditable', 'true');
          editableField.focus();
          window.getSelection()?.selectAllChildren(editableField);
          window.getSelection()?.collapseToEnd();

          const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Enter') {
              editableField.blur();
              editableField.removeEventListener('keydown', onKeyDown);
            }
          };

          editableField.addEventListener('keydown', onKeyDown);

          editableField.addEventListener(
            'blur',
            () => {
              editableField.removeAttribute('contenteditable');
              const content = editableField.textContent;
              if (content && content !== initialContent) {
                // send it back to the editor
                sendMessageToEditor({
                  action: 'FIELD_EDITED_INLINE',
                  fieldId,
                  entryId,
                  locale,
                  newContent: content,
                });
              }
            },
            { once: true }
          );

          return;
        }
      }

      // Fallback if not inline is disabled, the field is not support or no match found
      // then scroll to field in the editor sidebar.
      sendMessageToEditor({
        action: 'TAGGED_FIELD_CLICKED',
        fieldId,
        entryId,
        locale,
      });
    }
  }
}
