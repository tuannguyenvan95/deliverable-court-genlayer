cd c:\Users\Admin\Documents\genlayer\DeliverableCourt
git add .
git commit -m "Stunning UI Overhaul"
git push
cd frontend
npx vercel deploy --prod --yes --env VITE_CONTRACT_ADDRESS=0x8387B950Da230bBC50c871cBfC8aA2e4aBF842Cf
