// TODO: instead of polling could we use MutationObserver to check for dom changes and then compare URL's
export function pollUrlChanges(callback: (newUrl: string) => void, interval = 500): () => void {
  let initialUrl = window.location.href;

  const checkUrlChange = () => {
    const currentUrl = window.location.href;
    if (currentUrl !== initialUrl) {
      initialUrl = currentUrl;
      callback(currentUrl);
    }
  };

  const intervalId = setInterval(checkUrlChange, interval);
  return () => clearInterval(intervalId);
}
