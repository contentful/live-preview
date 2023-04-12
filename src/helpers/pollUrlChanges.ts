export function pollUrlChanges(
  previousUrl: string,
  callback: (newUrl: string) => void,
  interval = 500
): () => void {
  const checkUrlChange = () => {
    const currentUrl = window.location.href;
    if (currentUrl !== previousUrl) {
      previousUrl = currentUrl;
      callback(currentUrl);
    }
  };

  const intervalId = setInterval(checkUrlChange, interval);
  return () => clearInterval(intervalId);
}
