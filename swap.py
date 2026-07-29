import re
with open('c:\\Users\\Admin\\Documents\\genlayer\\DeliverableCourt\\frontend\\src\\App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

stats_grid = re.search(r'                \{/\* Stats Grid \*/\}(.*?)(?=\n\n\n\n                <div className="grid grid-cols-1 lg:grid-cols-2)', content, re.DOTALL)
workflow_stepper = re.search(r'                \{/\* Workflow Stepper - Moved below the form \*/\}(.*?)(?=\n\n              </div>\n            \}\)\n\n            \{/\* JOBS TAB)', content, re.DOTALL)

if not stats_grid or not workflow_stepper:
    print("Could not find blocks")
else:
    sg_full = stats_grid.group(0)
    wf_full = workflow_stepper.group(0)
    
    new_content = content.replace(sg_full, wf_full)
    new_content = new_content.replace(wf_full, sg_full)
    
    with open('c:\\Users\\Admin\\Documents\\genlayer\\DeliverableCourt\\frontend\\src\\App.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Swapped successfully!")
