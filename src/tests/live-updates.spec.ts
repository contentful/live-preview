import { describe, it, vi, expect } from 'vitest';
import { LiveUpdates } from '../live-updates';

describe('LiveUpdates', () => {
  it('should listen to changes and calls the subscribed handlers', () => {
    const liveUpdates = new LiveUpdates();
    const data = { sys: { id: '1' }, title: 'Data 1' };
    const contentType = { fields: [] };
    const cb = vi.fn();
    liveUpdates.subscribe(data, 'en-US', cb);

    liveUpdates.receiveMessage({ entity: { sys: { id: '1' }, title: 'Data 2' }, contentType });

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(data);
  });

  it('no longer receives updates after unsubcribing', () => {
    const liveUpdates = new LiveUpdates();
    const data = { sys: { id: '1' }, title: 'Data 1' };
    const contentType = { fields: [] };
    const cb = vi.fn();
    const unsubscribe = liveUpdates.subscribe(data, 'en-US', cb);

    liveUpdates.receiveMessage({ entity: { sys: { id: '1' }, title: 'Data 2' }, contentType });

    expect(cb).toHaveBeenCalledTimes(1);

    unsubscribe();
    liveUpdates.receiveMessage({ entity: { sys: { id: '1' }, title: 'Data 3' } });

    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('ignores invalid messages', () => {
    const liveUpdates = new LiveUpdates();
    const data = { sys: { id: '1' }, title: 'Data 1' };
    const cb = vi.fn();
    liveUpdates.subscribe(data, 'en-US', cb);

    liveUpdates.receiveMessage({ isInspectorActive: false });

    expect(cb).not.toHaveBeenCalled();
  });
});
