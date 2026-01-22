export type TimelinePreviewToken = {
  /** The ID of the release (release.sys.id) */
  releaseId?: string;
  /** The scheduled date of the release */
  timestamp?: string;
};

const DELIMITER = ';';

export function buildTimelinePreviewToken({ releaseId, timestamp }: TimelinePreviewToken): string {
  if (!releaseId && !timestamp) {
    throw new Error('Either releaseId or timestamp must be provided');
  }

  return encodeURIComponent([releaseId, timestamp].join(DELIMITER));
}

function toOptional(value: string | undefined): string | undefined {
  return value ? value : undefined;
}

export function parseTimelinePreviewToken(token: string): TimelinePreviewToken {
  const [releaseId, timestamp] = decodeURIComponent(token).split(DELIMITER).map(toOptional);
  return {
    releaseId,
    timestamp,
  };
}
