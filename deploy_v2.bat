cd c:\Users\Admin\Documents\genlayer\DeliverableCourt
git add .
git commit -m "Stunning UI Overhaul"
git push
cd frontend
npx.cmd vercel deploy --prod --yes --env VITE_CONTRACT_ADDRESS=0xCEea241F4dFd754175466B186E7bc030d2522bF0
