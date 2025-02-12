"use client";
import "./App.css";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { client } from "./client.ts";
import { sepolia } from "thirdweb/chains";
import { useState } from "react";
import { Nebula } from "thirdweb/ai";
import { inAppWallet } from "thirdweb/wallets";

function App() {
  const activeAAccount = useActiveAccount();

  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [selectedChain, setSelectedChain] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [explorerUrl, setExplorerUrl] = useState("");

  interface TransactionResult {
    transactionHash: string;
    chain: {
      blockExplorers: {
        name: string;
        url: string;
        apiUrl: string;
      }[];
      id: number;
      name: string;
      nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
      };
      rpc: string;
      testnet: boolean;
    };
    client: {
      clientId: string;
      secretKey: string;
    };
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeAAccount?.address) return;

    setModalOpen(true);
    setTransactionStatus("in-progress");

    const executeMessage = `Deploy a new ERC20 token with name ${tokenName} and symbol ${tokenSymbol} on chain ${selectedChain} with a initial supply of 1000000000000`;

    try {
      const result = (await Nebula.execute({
        client: client,
        account: activeAAccount,
        message: executeMessage,
        contextFilter: {
          chains: [sepolia],
        },
      })) as TransactionResult;

      const transactionHash = result.transactionHash;
      const explorer = result.chain.blockExplorers[0].url;

      setTransactionHash(transactionHash);
      setExplorerUrl(`${explorer}/tx/${transactionHash}`);
      setTransactionStatus("submitted");
    } catch (error) {
      console.error("Transaction failed", error);
      setTransactionStatus("failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      {activeAAccount ? (
        <div className="w-full max-w-3xl">
          <div className="absolute top-4 right-4">
            <ConnectButton
              client={client}
              accountAbstraction={{
                chain: sepolia,
                sponsorGas: true,
              }}
              wallets={[
                inAppWallet({
                  auth: {
                    options: ["email"],
                  },
                }),
              ]}
            />
          </div>
          <h1 className="text-center text-2xl font-bold text-white mb-6">
            Deploy Your ERC20 Token
          </h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="tokenName"
                className="block text-lg font-medium text-gray-300"
              >
                Token Name
              </label>
              <input
                type="text"
                id="tokenName"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                required
                className="mt-1 block w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter token name"
              />
            </div>
            <div>
              <label
                htmlFor="tokenSymbol"
                className="block text-lg font-medium text-gray-300"
              >
                Token Symbol
              </label>
              <input
                type="text"
                id="tokenSymbol"
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value)}
                required
                className="mt-1 block w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter token symbol"
              />
            </div>
            <div>
              <label
                htmlFor="chain"
                className="block text-lg font-medium text-gray-300"
              >
                Chain
              </label>
              <select
                id="chain"
                value={selectedChain}
                onChange={(e) => setSelectedChain(e.target.value)}
                required
                className="mt-1 block w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select a chain</option>
                <option value="Ethereum">Ethereum</option>
                <option value="Sepolia">Sepolia</option>
                <option value="Arbitrum Sepolia">Arbitrum Sepolia</option>
                <option value="Base">Base</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 text-lg"
            >
              Deploy
            </button>
          </form>
        </div>
      ) : (
        <div className="w-full min-h-screen flex flex-col items-center justify-center bg-gradient-to-t from-purple-600 to-black text-white p-6">
          <p className="text-2xl font-bold mb-6">
            Welcome! Let's deploy your ERC20 token. First, connect to the app.
          </p>
          <div className="mt-4">
            <ConnectButton
              client={client}
              accountAbstraction={{
                chain: sepolia,
                sponsorGas: true,
              }}
              wallets={[
                inAppWallet({
                  auth: {
                    options: ["email"],
                  },
                }),
              ]}
            />
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-6 z-50">
          <div className="bg-gray-800 rounded-lg p-6 text-center max-w-md w-full">
            {transactionStatus === "in-progress" ? (
              <>
                <div className="text-white text-2xl font-semibold mb-4">
                  Transaction in Progress...
                </div>
                <div className="loader mb-6"></div>{" "}
                {/* Replace with your circle animation */}
              </>
            ) : transactionStatus === "submitted" ? (
              <>
                <div className="text-green-500 text-3xl mb-4">✔</div>
                <div className="text-white text-lg font-semibold mb-2">
                  Transaction Submitted!
                </div>
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline"
                >
                  View on Block Explorer
                </a>
                <p className="text-gray-400 mt-2 break-all">
                  {transactionHash}
                </p>
              </>
            ) : (
              <div className="text-red-500 text-lg font-semibold">
                Transaction Failed
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
