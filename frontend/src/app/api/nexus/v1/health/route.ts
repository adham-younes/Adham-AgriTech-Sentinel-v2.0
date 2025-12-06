import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        protocol: "NEXUS",
        version: "v1.0.0",
        utilities: [
            { name: "Oculus Vision", endpoint: "/api/nexus/v1/vision", status: "active", price_per_call: "$0.05" },
            { name: "Oracle Prediction", endpoint: "/api/nexus/v1/oracle", status: "active", price_per_call: "$1.00" },
            { name: "Satellite NDVI", endpoint: "/api/nexus/v1/ndvi", status: "active", price_per_call: "$0.10" }
        ],
        message: "Welcome to the OSIRIS API Economy. Build the future with us."
    });
}
