export const config = {
  bot: {
    version: "1.0.0",
    requiredEnvVars: [
      "BOT_TOKEN",
      "API_KEY",
      "API_BASE_URL",
      "API_ENDPOINT_USERS",
      "API_ENDPOINT_REGISTER",
      "WEBHOOK_BASE_URL"
    ],
  },
  api: {
    baseUrl: Deno.env.get("API_BASE_URL") ?? "",
    endpoints: {
      getUsers: Deno.env.get("API_ENDPOINT_USERS") ?? "",
      userRegister: Deno.env.get("API_ENDPOINT_REGISTER") ?? ""
    },
    apiKey: Deno.env.get("API_KEY") ?? "",
  },
  webhook: {
    baseUrl: Deno.env.get("WEBHOOK_BASE_URL") ?? ""
  }
}; 