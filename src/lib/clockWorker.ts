onmessage = (event: MessageEvent<number>) => {
  setInterval(() => postMessage(null), event.data);
};
