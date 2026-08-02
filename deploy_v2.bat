cd c:\Users\Admin\Documents\genlayer\DeliverableCourt
git add .
git commit -m "Stunning UI Overhaul"
git push
cd frontend
npx vercel deploy --prod --yes --env VITE_CONTRACT_ADDRESS=0x526C759F9735306714fff9c95EB16B02E0875fEF
