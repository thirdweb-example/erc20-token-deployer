const { Telegraf, Markup } = require("telegraf");

const botToken = "";

const miniAppUrl = "t.me/NebulaTokenDeployerbot/nebulatokendeploy";

const API_BASE_URL = "https://nebula-api.thirdweb.com";
const SECRET_KEY = "";

const bot = new Telegraf(botToken);
// Request to the Nebula API

async function apiRequest(endpoint, method, body = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-secret-key": SECRET_KEY,
    },
    // Only include a body if it's not an empty object
    body: Object.keys(body).length ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("API Response Error:", errorText);
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

// Basic Question getting the first contract information.
async function askNebula(sessionId, chainId, contractAddress) {
  const message = `Give me all the details of this contract ${contractAddress} on chain ${chainId}`;
  const requestBody = {
    message,
    session_id: sessionId,
    context_filter: {
      chain_ids: [chainId.toString()],
      contractAddress: [contractAddress],
    },
  };

  console.log("Query Contract Request Body:", requestBody);
  const response = await apiRequest("/chat", "POST", requestBody);
  return response.message;
}

async function createSession(title = "Smart Contract Explorer") {
  const response = await apiRequest("/session", "POST", { title });
  const sessionId = response.result.id;
  return sessionId;
}

async function handleMessage(query, sessionId, chainId, contractAddress) {
  const requestBody = {
    message: query,
    session_id: sessionId,
    context_filters: {
      chain_ids: [chainId.toString()],
      contractAddress: [contractAddress],
    },
  };

  console.log("handleMessage Request Body:", requestBody);

  const response = await apiRequest("/chat", "POST", requestBody);
  return response.message;
}

// ----- State Management -----
// This object will store per‑user state keyed by chat ID.
const userStates = {};

// Map human‑readable chain names to chain IDs.
const chainMapping = {
  "Arbitrum Sepolia": "11155111",
  // Add more mappings if necessary.
};

// ----- Bot Commands and Handlers -----

// Step 1: Welcome Message with Button
bot.start((ctx) => {
  const chatId = ctx.chat.id;
  // Initialize state for this user.
  userStates[chatId] = {
    waitingForContract: true, // We expect a contract address next.
    conversationActive: false,
    chain: "Arbitrum Sepolia", // Default chain selection.
  };

  ctx.reply(
    "Welcome! This bot will help you deploy an ERC20 token.\n\n" +
      "Click the button below to start the process:",
    Markup.inlineKeyboard([
      Markup.button.callback("Deploy ERC20 Token", "start_deployment"),
    ])
  );
});

// Step 2: Provide Mini-App Link and Next button
bot.action("start_deployment", (ctx) => {
  ctx.reply(
    "Great! Click the link below to open the Telegram Mini-App, then click Next to continue:",
    Markup.inlineKeyboard([
      Markup.button.url("Open Mini-App", miniAppUrl),
      Markup.button.callback("Next", "ask_contract_address"),
    ])
  );
});

// Step 3: Ask for Contract Address
bot.action("ask_contract_address", (ctx) => {
  ctx.reply("Please enter the deployed contract address:");
});

// Step 4: Receive and confirm contract address
bot.on("text", async (ctx) => {
  const chatId = ctx.chat.id;
  const text = ctx.message.text.trim();

  // Ignore messages that are commands.
  if (text.startsWith("/")) return;

  const state = userStates[chatId];
  if (!state) {
    ctx.reply("Please start by sending /start");
    return;
  }

  // CASE 1: Waiting for the contract address.
  if (state.waitingForContract) {
    state.contractAddress = text;
    state.waitingForContract = false;
    ctx.reply("Creating session and fetching data...");

    try {
      // Create a new Nebula session.
      const sessionId = await createSession();
      state.sessionId = sessionId;

      // Determine the chain ID from the mapping.
      const chainId = chainMapping[state.chain] || "1";

      // Ask Nebula for contract details.
      const responseMessage = await askNebula(sessionId, chainId, text);

      // Mark that follow-up conversation is now active.
      state.conversationActive = true;

      ctx.reply(responseMessage, { parse_mode: "Markdown" });
    } catch (err) {
      console.error("Error in askNebula:", err);
      ctx.reply("Error fetching data from Nebula. Please try again later.");
    }
  }
  // CASE 2: Conversation is active – treat the input as a follow-up query.
  else if (state.conversationActive) {
    try {
      const chainId = chainMapping[state.chain] || "1";
      const responseMessage = await handleMessage(
        text,
        state.sessionId,
        chainId,
        state.contractAddress
      );
      ctx.reply(responseMessage, { parse_mode: "Markdown" });
    } catch (err) {
      console.error("Error in handleMessage:", err);
      ctx.reply("Error processing your query. Please try again.");
    }
  }
});

// Error handling
bot.catch((err) => {
  console.error("Error occurred:", err);
});

// Launch the bot
bot.launch();

console.log("Bot is running...");

// Graceful stop on process termination signals
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
