import { createThirdwebClient } from "thirdweb";

const clientId = "";
const secreKey = "";

export const client = createThirdwebClient({
  clientId: clientId,
  secretKey: secreKey,
});
