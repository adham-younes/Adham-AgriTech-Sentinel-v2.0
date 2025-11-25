export async function testBlockchainConnection(): Promise<{ status: string; message: string }> {
  try {
    const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL

    if (!rpcUrl) {
      return {
        status: "error",
        message: "Blockchain RPC URL not configured",
      }
    }

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_blockNumber",
        params: [],
        id: 1,
      }),
    })

    if (!response.ok) {
      return {
        status: "error",
        message: `Blockchain RPC error: ${response.statusText}`,
      }
    }

    const data = await response.json()

    if (data.error) {
      return {
        status: "error",
        message: `Blockchain error: ${data.error.message}`,
      }
    }

    return {
      status: "success",
      message: "Blockchain connection successful",
    }
  } catch (error) {
    return {
      status: "error",
      message: `Blockchain connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}
