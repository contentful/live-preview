import { LIVE_PREVIEW_EDITOR_SOURCE } from '../constants';

export function isValidMessage(event: MessageEvent<unknown>): boolean {
  if (typeof event.data !== 'object' || !event.data) {
    return false;
  }

  if ('from' in event.data && event.data.from === 'live-preview') {
    return true;
  }

  if ('source' in event.data && event.data.source === LIVE_PREVIEW_EDITOR_SOURCE) {
    return true;
  }

  return false;
}
