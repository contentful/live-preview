import { TOOLTIP_CLASS, TOOLTIP_HEIGHT } from './constants';
import { TagAttributes } from './types';
import { sendMessageToEditor } from './utils';

const INLINE_SUPPORTED = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

interface TooltipState {
  referenceId: string | null;
  locale: string | null;
  entryId: string | null;
  fieldId: string | null;
}

export class FieldTagging {
  private tooltipParent: HTMLDivElement | null;
  private currentElementBesideTooltip: HTMLElement | null = null; // this element helps to position the tooltip
  private inlineEditing = true;
  private tooltipState: TooltipState;

  constructor() {
    this.currentElementBesideTooltip = null;
    this.tooltipParent = null;

    this.tooltipState = {
      referenceId: null,
      locale: null,
      entryId: null,
      fieldId: null,
    };

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

    if (typeof data.isInlineEditingActive === 'boolean') {
      this.inlineEditing = data.isInlineEditingActive;
    }
  }

  private handleRemoveReferenceClick(
    event: MouseEvent,
    type: 'remove' | 'move_up' | 'move_down' | 'add'
  ) {
    if (this.tooltipState.entryId && this.tooltipState.referenceId && this.tooltipState.fieldId) {
      sendMessageToEditor({
        action: 'TAGGED_REFERENCE_CLICKED',
        type,
        referenceId: this.tooltipState.referenceId,
        entryId: this.tooltipState.entryId,
        fieldId: this.tooltipState.fieldId,
        locale: 'en-US',
      });
    }
  }

  // Updates the position of the tooltip
  private updateTooltipPosition() {
    if (!this.currentElementBesideTooltip) return false;

    const currentRectOfElement = this.currentElementBesideTooltip.getBoundingClientRect();
    const currentRectOfParentOfElement =
      this.currentElementBesideTooltip.parentElement?.getBoundingClientRect();

    if (currentRectOfElement && currentRectOfParentOfElement) {
      let upperBoundOfTooltip = currentRectOfElement.top - TOOLTIP_HEIGHT;
      const left = currentRectOfElement.left;

      if (upperBoundOfTooltip < 0) {
        if (currentRectOfElement.top < 0) upperBoundOfTooltip = currentRectOfElement.top;
        else upperBoundOfTooltip = 0;
      }

      this.tooltipParent?.style.setProperty('top', `${upperBoundOfTooltip}px`);
      this.tooltipParent?.style.setProperty('left', `${left}px`);

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

      if (currFieldId && currEntryId && currLocale) {
        this.currentElementBesideTooltip = element;
        if (this.updateTooltipPosition()) {
          this.tooltipState.fieldId = currFieldId;
          this.tooltipState.entryId = currEntryId;
          this.tooltipState.locale = currLocale;
          this.tooltipState.referenceId = currReference;

          if (this.tooltipState.referenceId) {
            this.tooltipParent?.classList.add('contentful-tooltip--all');
          } else {
            this.tooltipParent?.classList.remove('contentful-tooltip--all');
          }
        }
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
    tooltip.classList.add(`contentful-tooltip-${action}`);
    tooltip.innerHTML = content;
    tooltip.addEventListener('click', clickHandler);
    return tooltip;
  }

  // Update the createTooltip method to create all four tooltips
  private createTooltips() {
    if (!document.querySelector(`.${TOOLTIP_CLASS}`)) {
      this.tooltipParent = document.createElement('div');
      this.tooltipParent.classList.add('contentful-tooltip');

      const editTooltip = this.createSingleTooltip(
        'edit',
        `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M13.5325 2.22242C13.825 2.51492 13.825 2.98742 13.5325 3.27992L12.16 4.65242L9.3475 1.83992L10.72 0.467422C11.0125 0.174922 11.485 0.174922 11.7775 0.467422L13.5325 2.22242ZM0.25 13.7499V10.9374L8.545 2.64243L11.3575 5.45493L3.0625 13.7499H0.25Z" fill="white"/>
        </svg>Edit`,
        this.clickEditHandler
      );
      const removeTooltip = this.createSingleTooltip(
        'remove',
        '<svg width="14" height="14" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="white"></path><path d="M0 0h24v24H0z" fill="none"></path></svg>Remove',
        (e) => this.handleRemoveReferenceClick(e, 'remove')
      );
      const moveUpTooltip = this.createSingleTooltip(
        'move-up',
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path fill-opacity="0.2" d="M16.5 14.25h-9a.75.75 0 0 0-.53 1.28l4.5 4.5a.747.747 0 0 0 1.06 0l4.5-4.5a.75.75 0 0 0-.53-1.28Z"></path><path d="M6.764 8.854a.75.75 0 0 0 .736.896h9a.75.75 0 0 0 .53-1.28l-4.5-4.5a.751.751 0 0 0-1.061 0l-4.5 4.5a.75.75 0 0 0-.205.384Z"></path></svg>Move up',
        (e) => this.handleRemoveReferenceClick(e, 'move_up')
      );
      const moveDownTooltip = this.createSingleTooltip(
        'move-down',
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M16.5 14.25h-9a.75.75 0 0 0-.53 1.28l4.5 4.5a.747.747 0 0 0 1.06 0l4.5-4.5a.75.75 0 0 0-.53-1.28Z"></path><path fill-opacity="0.2" d="M6.764 8.854a.75.75 0 0 0 .736.896h9a.75.75 0 0 0 .53-1.28l-4.5-4.5a.751.751 0 0 0-1.061 0l-4.5 4.5a.75.75 0 0 0-.205.384Z"></path></svg>Move down',
        (e) => this.handleRemoveReferenceClick(e, 'move_down')
      );
      const addTooltip = this.createSingleTooltip(
        'add',
        '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" fill="white"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path><path d="M0 0h24v24H0z" fill="none"></path></svg>Add',
        (e) => this.handleRemoveReferenceClick(e, 'add')
      );

      [editTooltip, removeTooltip, moveUpTooltip, moveDownTooltip, addTooltip].forEach(
        (tooltip) => {
          if (tooltip && this.tooltipParent) {
            this.tooltipParent.insertAdjacentElement('beforeend', tooltip);
          }
        }
      );

      window.document.body.insertAdjacentElement('beforeend', this.tooltipParent);

      window.addEventListener('scroll', () => this.updateTooltipPosition());
      window.addEventListener('mouseover', this.addTooltipOnHover);
      window.addEventListener('mouseout', this.removeTooltip);
    }

    this.updateTooltipPosition();
  }

  private removeTooltip(e: MouseEvent) {
    let visible = false;
    if (this.tooltipParent?.matches(':hover')) {
      visible = true;
    }

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

    if (this.tooltipParent) this.tooltipParent.style.display = visible ? 'block' : 'none';
  }

  // responsible for handling the event when the user clicks on the edit button in the tooltip
  private clickEditHandler() {
    const { fieldId, entryId, locale } = this.tooltipState;

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
