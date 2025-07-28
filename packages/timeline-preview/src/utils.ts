export type TimelinePreviewToken = {
  /** The ID of the release (release.sys.id) */
  releaseId?: string;
  /** The scheduled date of the release */
  timestamp?: string;
};

const DELIMETER = ';';

export function buildTimelinePreviewToken({ releaseId, timestamp }: TimelinePreviewToken): string {
  if (!releaseId && !timestamp) {
    throw new Error('Either releaseId or timestamp must be provided');
  }

  return [releaseId, timestamp].join(DELIMETER);
}

function toOptional(value: string | undefined): string | undefined {
  return value ? value : undefined;
}

export function parseTimelinePreviewToken(token: string): TimelinePreviewToken {
  const [releaseId, timestamp] = token.split(DELIMETER).map(toOptional);
  return {
    releaseId,
    timestamp,
  };
}
