import { council } from '../frontend/src/lib/ai/council';

async function testCouncil() {
    console.log('🏛️ Convening the Council of Minds...');

    try {
        const prompt = 'Explain the concept of "Sovereign AI" in one sentence.';
        console.log(`\n❓ Prompt: "${prompt}"`);

        const response = await council.consult(prompt);

        console.log('\n✅ Council Decision Reached:');
        console.log('---------------------------------------------------');
        console.log(response.consensus);
        console.log('---------------------------------------------------');

        console.log('\n🗳️ Individual Votes:');
        console.log(`- Groq (The Chair): ${response.votes.groq ? '✅ Voted' : '❌ Abstained'}`);
        console.log(`- OpenAI (The Advisor): ${response.votes.openai ? '✅ Voted' : '❌ Abstained'}`);

        console.log(`\n⏱️ Duration: ${response.meta.duration}ms`);

    } catch (error: any) {
        console.error('❌ Council Adjourned Unexpectedly:', error.message);
    }
}

testCouncil();
