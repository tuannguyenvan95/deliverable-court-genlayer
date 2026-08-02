cd c:\Users\Admin\Documents\genlayer\DeliverableCourt
git add .
git commit -m "Stunning UI Overhaul"
git push
cd frontend
npx.cmd vercel deploy --prod --yes --env VITE_CONTRACT_ADDRESS=0x160B79DA501ADB54c5362f3293563c0F762Fe952
