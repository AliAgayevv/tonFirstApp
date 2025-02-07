import { useEffect } from "react";
import { initTelegram } from "./Telegram";
import ShowWallet from "./components/ShowWallet";

export default function App() {
  //  For initializing the Telegram Mini App SDK
  useEffect(() => {
    initTelegram();
  }, []);
  return (
    <div className="">
      <div className="flex justify-center flex-col items-center h-screen bg-blue-500">
        <ShowWallet />
      </div>
    </div>
  );
}
