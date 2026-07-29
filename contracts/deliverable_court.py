# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
from dataclasses import dataclass

@allow_storage
@dataclass
class Job:
    client: Address
    freelancer: Address
    amount: bigint
    brief_url: str
    deliverable_url: str
    status: str
    title: str
    description: str
    ai_verdict: str
    ai_reason: str

class Contract(gl.Contract):
    jobs: TreeMap[str, Job]
    next_job_id: bigint

    def __init__(self):
        self.next_job_id = bigint(0)
    
    @gl.public.write
    def create_job(self, title: str, description: str, brief_url: str) -> str:
        amount = gl.msg.value
        if amount <= bigint(0):
            raise UserError("Job amount must be greater than 0")
            
        job_id = str(self.next_job_id)
        self.next_job_id += bigint(1)
        
        self.jobs[job_id] = Job(
            client=gl.msg.sender,
            freelancer=Address("0x0000000000000000000000000000000000000000"),
            amount=amount,
            brief_url=brief_url,
            deliverable_url="",
            status="OPEN",
            title=title,
            description=description,
            ai_verdict="",
            ai_reason=""
        )
        return job_id
        
    @gl.public.write
    def accept_job(self, job_id: str) -> None:
        if job_id not in self.jobs:
            raise UserError("Job does not exist")
            
        job = self.jobs[job_id]
        if job.status != "OPEN":
            raise UserError("Job is not open")
            
        job.freelancer = gl.msg.sender
        job.status = "IN_PROGRESS"
        self.jobs[job_id] = job
        
    @gl.public.write
    def submit_deliverable(self, job_id: str, deliverable_url: str, notes: str) -> None:
        if job_id not in self.jobs:
            raise UserError("Job does not exist")
            
        job = self.jobs[job_id]
        if job.status != "IN_PROGRESS":
            raise UserError("Job is not in progress")
        if gl.msg.sender != job.freelancer:
            raise UserError("Only the assigned freelancer can submit deliverable")
            
        job.deliverable_url = deliverable_url + "\nNotes: " + notes
        self.jobs[job_id] = job
        
    @gl.public.write
    def adjudicate(self, job_id: str) -> None:
        if job_id not in self.jobs:
            raise UserError("Job does not exist")
            
        job = self.jobs[job_id]
        if job.status != "IN_PROGRESS" and job.status != "OPEN":
            raise UserError("Job is closed")
            
        if not job.deliverable_url:
            raise UserError("No deliverable submitted yet")

        # Nondeterministic execution
        raw_json = gl.vm.run_nondet(
            lambda: self._adjudicate_leader(job.brief_url, job.deliverable_url),
            self._adjudicate_validator
        )
        
        import json
        try:
            data = json.loads(raw_json)
            final_verdict = data.get("verdict", "ESCALATE")
            confidence = int(data.get("confidence", 0))
            reason = data.get("reason", "No reason provided")
            if confidence < 65:
                final_verdict = "ESCALATE"
                reason = "Confidence score below 65. Escalate to human review."
        except Exception:
            final_verdict = "ESCALATE"
            reason = "Failed to parse AI response."
            
        job.ai_verdict = final_verdict
        job.ai_reason = reason
        
        amount = job.amount
        job.amount = bigint(0)
        
        if final_verdict == "RELEASE":
            job.status = "CLOSED"
            gl.get_contract_at(gl.current_contract_address).emit_transfer(job.freelancer, amount)
        elif final_verdict == "REFUND":
            job.status = "CLOSED"
            gl.get_contract_at(gl.current_contract_address).emit_transfer(job.client, amount)
        elif final_verdict == "PARTIAL":
            job.status = "CLOSED"
            half = amount // bigint(2)
            rem = amount - half
            gl.get_contract_at(gl.current_contract_address).emit_transfer(job.client, half)
            gl.get_contract_at(gl.current_contract_address).emit_transfer(job.freelancer, rem)
        elif final_verdict == "ESCALATE":
            job.amount = amount
            
        self.jobs[job_id] = job

    def _adjudicate_leader(self, brief_url: str, deliverable_url: str) -> str:
        import json
        
        brief_res = gl.nondet.web.render(brief_url)
        if not brief_res.ok:
            return json.dumps({"verdict": "ESCALATE", "reason": f"Failed to fetch brief URL. It might be invalid, private, or a 404.", "confidence": 100})
            
        deliv_res = gl.nondet.web.render(deliverable_url.split("\nNotes: ")[0])
        if not deliv_res.ok:
            return json.dumps({"verdict": "ESCALATE", "reason": f"Failed to fetch deliverable URL. It might be invalid, private, or a 404.", "confidence": 100})
            
        prompt = f"""
        You are an expert project manager and judge. 
        Evaluate the following deliverable against the original brief.
        
        BRIEF:
        {brief_res.content}
        
        DELIVERABLE:
        {deliv_res.content}
        
        Decide on one of the following verdicts:
        - RELEASE: The deliverable fully meets the brief requirements.
        - PARTIAL: The deliverable partially meets the brief, but is missing some elements.
        - REFUND: The deliverable completely fails to meet the brief or is irrelevant.
        - ESCALATE: The evidence is contradictory, or you are unsure.
        
        Provide your reasoning and a confidence score (0-100).
        You MUST output ONLY a valid JSON object in this format:
        {{"verdict": "RELEASE|PARTIAL|REFUND|ESCALATE", "reason": "your reasoning", "confidence": 100}}
        """
        
        # Calling exec_prompt without schema dictionary to avoid Studio AST parsing bugs
        result = gl.nondet.exec_prompt(prompt)
        return result.content
        
    def _adjudicate_validator(self, res_leader: str, res_val: str) -> bool:
        import json
        try:
            dict_leader = json.loads(res_leader)
            dict_val = json.loads(res_val)
            v_leader = dict_leader.get("verdict", "ESCALATE")
            v_val = dict_val.get("verdict", "ESCALATE")
            return v_leader == v_val
        except Exception:
            return False
