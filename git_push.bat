git init
git add .
git commit -m "Initial commit with DeliverableCourt GenLayer dApp"
gh repo create deliverable-court-genlayer --public --source=. --remote=origin --description="DeliverableCourt is an intelligent escrow dApp that resolves freelancer disputes using GenLayers AI validators" --push
