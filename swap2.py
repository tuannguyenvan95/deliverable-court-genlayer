import json

with open('c:\\Users\\Admin\\Documents\\genlayer\\DeliverableCourt\\frontend\\src\\App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

stats_grid = """                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  <div className="glass-card rounded-xl p-5 border-white/5">
                    <h3 className="text-xs text-gray-500 uppercase font-semibold mb-1">Total Escrows</h3>
                    <div className="text-3xl font-light text-white">{totalJobs}</div>
                  </div>
                  <div className="glass-card rounded-xl p-5 border-white/5">
                    <h3 className="text-xs text-gray-500 uppercase font-semibold mb-1">In Progress</h3>
                    <div className="text-3xl font-light text-white">{activeJobs}</div>
                  </div>
                  <div className="glass-card rounded-xl p-5 border-white/5">
                    <h3 className="text-xs text-gray-500 uppercase font-semibold mb-1">Adjudicated</h3>
                    <div className="text-3xl font-light text-white">{closedJobs}</div>
                  </div>
                </div>"""

workflow_stepper = """                {/* Workflow Stepper - Moved below the form */}
                <div className="mt-8 pt-8 border-t border-[#222]">
                  <h2 className="text-sm font-semibold text-gray-300 mb-8 font-mono tracking-wider uppercase text-center flex items-center justify-center gap-2">
                    <Brain size={16} className="text-[#a855f7]" /> GenLayer Intelligent Workflow
                  </h2>
                  <div className="flex flex-col md:flex-row items-start justify-between relative max-w-4xl mx-auto">
                    <div className="hidden md:block absolute left-0 top-4 w-full h-px bg-gradient-to-r from-[#222] via-[#444] to-[#222] z-0"></div>
                    
                    <div className="relative z-10 flex flex-col items-center gap-3 w-full md:w-1/4 text-center mb-6 md:mb-0 bg-[#0a0a0a]">
                      <div className="w-8 h-8 rounded-full bg-black border border-white/20 flex items-center justify-center text-xs text-gray-400 font-mono shadow-[0_0_15px_rgba(255,255,255,0.05)]">1</div>
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-1">Create</h4>
                        <p className="text-[11px] text-gray-500 max-w-[160px] mx-auto">Client locks bounty in smart contract with brief URL.</p>
                      </div>
                    </div>
                    
                    <div className="relative z-10 flex flex-col items-center gap-3 w-full md:w-1/4 text-center mb-6 md:mb-0 bg-[#0a0a0a]">
                      <div className="w-8 h-8 rounded-full bg-black border border-white/20 flex items-center justify-center text-xs text-gray-400 font-mono shadow-[0_0_15px_rgba(255,255,255,0.05)]">2</div>
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-1">Build</h4>
                        <p className="text-[11px] text-gray-500 max-w-[160px] mx-auto">Freelancer accepts and submits final GitHub/Figma URL.</p>
                      </div>
                    </div>

                    <div className="relative z-10 flex flex-col items-center gap-3 w-full md:w-1/4 text-center mb-6 md:mb-0 bg-[#0a0a0a]">
                      <div className="w-8 h-8 rounded-full bg-black border border-primary/40 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(177,85,255,0.15)]">
                        <Brain size={14} />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-1">AI Evaluates</h4>
                        <p className="text-[11px] text-gray-500 max-w-[160px] mx-auto">GenLayer LLM reads both URLs & evaluates quality.</p>
                      </div>
                    </div>

                    <div className="relative z-10 flex flex-col items-center gap-3 w-full md:w-1/4 text-center bg-[#0a0a0a]">
                      <div className="w-8 h-8 rounded-full bg-black border border-white/20 flex items-center justify-center text-xs text-gray-400 font-mono shadow-[0_0_15px_rgba(255,255,255,0.05)]">4</div>
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-1">Release</h4>
                        <p className="text-[11px] text-gray-500 max-w-[160px] mx-auto">Funds released, partially refunded, or fully refunded.</p>
                      </div>
                    </div>
                  </div>
                </div>"""

# Ensure exact exact match by removing trailing spaces etc or just split/replace
if stats_grid in content and workflow_stepper in content:
    content = content.replace(stats_grid, "@@STATS_GRID@@")
    content = content.replace(workflow_stepper, "@@WORKFLOW_STEPPER@@")
    
    # Also fix the styling of workflow stepper since it will be at the top now
    # We should change "mt-8 pt-8 border-t border-[#222]" to "mb-12"
    new_workflow_stepper = workflow_stepper.replace('className="mt-8 pt-8 border-t border-[#222]"', 'className="mb-12"')
    
    # And fix stats grid since it's at the bottom now
    new_stats_grid = stats_grid.replace('className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"', 'className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8 border-t border-[#222]"')
    
    content = content.replace("@@STATS_GRID@@", new_workflow_stepper)
    content = content.replace("@@WORKFLOW_STEPPER@@", new_stats_grid)
    
    with open('c:\\Users\\Admin\\Documents\\genlayer\\DeliverableCourt\\frontend\\src\\App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS")
else:
    print("NOT FOUND")
    if stats_grid not in content:
        print("STATS GRID NOT FOUND")
    if workflow_stepper not in content:
        print("WORKFLOW NOT FOUND")
