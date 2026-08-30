cd c:\Users\Admin\Documents\genlayer\DeliverableCourt
git add .
git commit -m "Stunning UI Overhaul"
git push
cd frontend
npx.cmd vercel deploy --prod --yes --env VITE_CONTRACT_ADDRESS=0x33D0C20a95a44c5ce0585F5945F5A48930cC9bAd
