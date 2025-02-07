import { useEffect, useState } from "react";
import { Address, fromNano } from "ton";
import {
  TonConnectUI,
  Wallet,
  WalletInfoInjectable,
  WalletInfoRemote,
} from "@tonconnect/ui";
import { Button, Box, useDisclosure } from "@chakra-ui/react";
import { Collapse } from "@chakra-ui/transition";
import { Buffer } from "buffer";
window.Buffer = Buffer;

type WalletType =
  | (Wallet & WalletInfoInjectable)
  | (Wallet & WalletInfoRemote)
  | null;

import TonWeb from "tonweb";

const tonConnect = new TonConnectUI({
  manifestUrl:
    "https://shimmering-naiad-bb65d2.netlify.app/tonconnect-manifest.json",
});

const ShowWallet = () => {
  const [walletAddress, setWalletAddress] = useState<WalletType>(null);
  const [rawAddress, setRawAddress] = useState<string | null>(null);
  const [userFriendlyAddress, setUserFriendlyAddress] = useState<string | null>(
    null
  );
  const [transactions, setTransactions] = useState<any[]>([]);
  const [tonBalance, setTonBalance] = useState<number | null | string>(null);
  const { open, onToggle } = useDisclosure();

  useEffect(() => {
    const handleStatusChange = async (updatedWalletAddress: WalletType) => {
      setWalletAddress(updatedWalletAddress || null);

      if (updatedWalletAddress && updatedWalletAddress.account) {
        const address = await getRawAddress(updatedWalletAddress);
        setRawAddress(address);

        if (address) {
          fetchBalance(address);

          // Fetch and update transactions asynchronously
          const transactionsData = await fetchTransactions(address);
          setTransactions(transactionsData);

          const userFriendly = convertRawToBase64(address);
          setUserFriendlyAddress(userFriendly);

          fetchJettonBalance(userFriendly);
        }
      }
    };

    tonConnect.onStatusChange(handleStatusChange);
  }, []);

  const fetchJettonBalance = async (argAddress: string) => {
    // console.log("argAddress", argAddress);
    const tonweb = new TonWeb();
    console.log(
      Address.parse(tonConnect.account?.address.toString() || "").toString()
    );
    // const jettonMinter = new TonWeb.token.jetton.JettonMinter(tonweb.provider, {
    //   address: "EQCBPTfghL-_KsmnASLFSAMVKTY8lepp2qb5ra4l4XsBwYKM",
    // });
    // const data = await jettonMinter.getJettonData();
    // console.log("Total supply:", fromNano(data.totalSupply).toString());

    // const jettonWalletAddress = await jettonMinter.getJettonWalletAddress(

    // );
    // console.log("Jetton Wallet: " + jettonWalletAddress);
    // const jettonWallet = new TonWeb.token.jetton.JettonWallet(tonweb.provider, {
    //   address: jettonWalletAddress,
    // });

    // const jettonData = await jettonWallet.getData();
    // console.log(jettonData);

    // if (
    //   expectedJettonWalletAddress.toString(false) !==
    //   new TonWeb.utils.Address(walletAddress).toString(false)
    // ) {
    //   throw new Error("jetton minter does not recognize the wallet");
    // }
    // console.log(
    //   "Jetton master address:",
    //   data.jettonMinterAddress.toString(true, true, true)
    // );
  };

  const fetchTransactions = async (address: string) => {
    try {
      if (!address) {
        throw new Error("Address is required");
      }

      const res = await fetch(
        `https://toncenter.com/api/v2/getTransactions?address=${address}`
      );

      if (!res.ok) {
        throw new Error("Error fetching transactions");
      }

      const data = await res.json();
      return data.ok && data.result ? data.result : [];
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return []; // Return empty array to avoid undefined state
    }
  };

  const fetchBalance = async (address: string) => {
    try {
      const res = await fetch(`https://tonapi.io/v2/accounts/${address}`);
      if (!res.ok) {
        throw new Error("Error fetching balance");
      }
      const resData = await res.json();
      setTonBalance((Number(resData.balance) / 1e9).toFixed(2));
    } catch (error) {
      console.error("Error getting balance:", error);
    }
  };

  const connectWallet = async () => {
    try {
      await tonConnect.connectWallet();
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const disconnectWallet = async () => {
    try {
      await tonConnect.disconnect();
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };

  const getRawAddress = async (
    walletAddress: WalletType
  ): Promise<string | null> => {
    try {
      return walletAddress?.account.address || null;
    } catch (error) {
      console.error("Error getting address:", error);
      return null;
    }
  };

  const convertRawToBase64 = (rawAddress: string): string => {
    try {
      const address = Address.parseRaw(rawAddress);
      return address.toString({ bounceable: true, testOnly: false });
    } catch (error) {
      console.error("Error converting raw to base64:", error);
      return "Invalid string";
    }
  };

  return (
    <Box className="text-black p-5">
      {walletAddress ? (
        <div>
          <Box className="mt-3">
            <p>
              <strong>Raw Wallet Address:</strong> {rawAddress}
            </p>
            <p>
              <strong>User-Friendly Address:</strong> {userFriendlyAddress}
            </p>
            <p>
              <strong>Balance:</strong> {tonBalance} TON
            </p>
          </Box>

          <Box className="mt-5">
            <hr />
            <Box className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Transactions History</h3>
              {transactions.length > 0 && (
                <Button
                  onClick={onToggle}
                  className="bg-blue-500 text-white px-3 py-1 rounded-md"
                >
                  {open ? "Hide" : "Show"}
                </Button>
              )}
            </Box>
            <hr />

            {transactions.length > 0 ? (
              <Collapse in={open}>
                <ul className="pl-5 rounded-lg p-3">
                  {transactions.map((tx, index) => {
                    const isIncoming =
                      tx.in_msg?.source && tx.in_msg.source !== "";
                    const senderAddress = isIncoming ? tx.in_msg.source : "N/A";

                    const isOutgoing = tx.out_msgs.length > 0;
                    const receiverAddresses = isOutgoing
                      ? tx.out_msgs
                          .map((msg: any) => msg.destination)
                          .join(", ")
                      : "N/A";

                    const transactionAmount = isIncoming
                      ? `${Number(tx.in_msg.value) / 1e9} TON`
                      : isOutgoing
                      ? tx.out_msgs
                          .map((msg: any) => `${Number(msg.value) / 1e9} TON`)
                          .join(", ")
                      : "N/A";

                    return (
                      <div key={tx.transaction_id.hash || index}>
                        <li className="border-b py-2">
                          <p
                            className={`${
                              isIncoming ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {isIncoming ? "Received" : "Sent"}
                          </p>
                          <p>
                            <strong>Time:</strong>{" "}
                            {new Date(tx.utime * 1000).toLocaleString()}
                          </p>

                          {isIncoming && (
                            <p>
                              <strong>From:</strong> {senderAddress}
                            </p>
                          )}
                          {isOutgoing && (
                            <p>
                              <strong>To:</strong> {receiverAddresses}
                            </p>
                          )}

                          <p>
                            <strong>Amount:</strong> {transactionAmount}
                          </p>
                        </li>
                        <hr />
                      </div>
                    );
                  })}
                </ul>
              </Collapse>
            ) : (
              <p className="mt-2 text-gray-500">
                No transactions available on your wallet.
              </p>
            )}
          </Box>
          <Button
            onClick={disconnectWallet}
            className=" text-white px-3 py-10 rounded-md mb-4 w-full"
            color={"red.500 bg.red.500"}
          >
            Disconnect
          </Button>
        </div>
      ) : (
        <Button
          onClick={connectWallet}
          className="bg-blue-500 text-white px-3 py-2 rounded-md"
        >
          Connect
        </Button>
      )}
    </Box>
  );
};

export default ShowWallet;
