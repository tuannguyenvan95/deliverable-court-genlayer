cd c:\Users\Admin\Documents\genlayer\DeliverableCourt
git add .
git commit -m "Stunning UI Overhaul"
git push
cd frontend
npx.cmd vercel deploy --prod --yes --env VITE_CONTRACT_ADDRESS=0x3f221378A6Bb172165B2c06998A54D0390d2dcCC
