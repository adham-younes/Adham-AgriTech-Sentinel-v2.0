import { DivineKnowledge } from "../frontend/src/lib/ai/divine-knowledge";
import * as dotenv from "dotenv";

dotenv.config({ path: '.env.divine' });

async function main() {
    console.log("🔮 Consulting the Divine Knowledge Graph...");

    const oracle = new DivineKnowledge();
    await oracle.init();

    const query = "How does the irrigation system work?";
    console.log(`❓ Query: "${query}"`);

    const wisdom = await oracle.omniscientSearch(query);

    console.log("\n📜 Divine Wisdom Revealed:");
    console.log(wisdom);
}

main().catch(console.error);
