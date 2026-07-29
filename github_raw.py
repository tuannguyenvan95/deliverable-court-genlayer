import os

with open('c:\\Users\\Admin\\Documents\\genlayer\\DeliverableCourt\\frontend\\src\\App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace vercel URLs with github raw URLs
content = content.replace("https://deliverable-court-genlayer.vercel.app/", "https://raw.githubusercontent.com/tuannguyenvan95/deliverable-court-genlayer/master/frontend/public/")

with open('c:\\Users\\Admin\\Documents\\genlayer\\DeliverableCourt\\frontend\\src\\App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated to github raw")
