/**
 * Sends the given message to the editor
 * enhances it with the information necessary to be accepted
 */
export function sendMessageToEditor(data: Record<string, unknown>): void {
  window.top?.postMessage(
    {
      from: 'live-preview',
      ...data,
    },
    // TODO: check if there is any security risk with this
    '*'
  );
}
