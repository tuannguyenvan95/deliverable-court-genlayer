import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

const client = createClient({ chain: studionet });
console.log("Client deploy methods:", Object.keys(client).filter(k => k.toLowerCase().includes('deploy')));
console.log("All client methods:", Object.keys(client));
