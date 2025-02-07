import WebApp from "@twa-dev/sdk";

export const initTelegram = () => {
  if (WebApp) {
    WebApp.expand();
    console.log("Telegram Mini App initialized");
  } else {
    console.error("Telegram Mini App SDK not available");
  }
};
