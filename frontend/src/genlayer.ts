import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

export const client = createClient({
  chain: studionet,
});
