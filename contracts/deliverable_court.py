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
    
    @gl.public.view
    def get_all_jobs(self) -> str:
        import json
        result = {}
        for job_id, job in self.jobs.items():
            result[job_id] = {
                "client": str(job.client),
                "freelancer": str(job.freelancer),
                "amount": str(job.amount),
                "brief_url": job.brief_url,
                "deliverable_url": job.deliverable_url,
                "status": job.status,
                "title": job.title,
                "description": job.description,
                "ai_verdict": job.ai_verdict,
                "ai_reason": job.ai_reason
            }
        return json.dumps(result)
        
    @gl.public.view
    def get_job(self, job_id: str) -> str:
        import json
        if job_id not in self.jobs:
            raise UserError("Job does not exist")
        job = self.jobs[job_id]
        return json.dumps({
            "client": str(job.client),
            "freelancer": str(job.freelancer),
            "amount": str(job.amount),
            "brief_url": job.brief_url,
            "deliverable_url": job.deliverable_url,
            "status": job.status,
            "title": job.title,
            "description": job.description,
            "ai_verdict": job.ai_verdict,
            "ai_reason": job.ai_reason
        })
    
    @gl.public.write.payable
    def create_job(self, title: str, description: str, brief_url: str) -> str:
        amount = gl.message.value
        if amount <= bigint(0):
            raise UserError("Job amount must be greater than 0")
            
        job_id = str(self.next_job_id)
        self.next_job_id += bigint(1)
        
        self.jobs[job_id] = Job(
            client=gl.message.sender_address,
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
        if gl.message.sender_address == job.client:
            raise UserError("Client cannot accept their own job")
            
        job.freelancer = gl.message.sender_address
        job.status = "IN_PROGRESS"
        self.jobs[job_id] = job
        
    @gl.public.write
    def submit_deliverable(self, job_id: str, deliverable_url: str, notes: str) -> None:
        if job_id not in self.jobs:
            raise UserError("Job does not exist")
            
        job = self.jobs[job_id]
        if job.status != "IN_PROGRESS":
            raise UserError("Job is not in progress")
        if gl.message.sender_address != job.freelancer:
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

        # Nondeterministic execution without accessing storage inside lambda
        brief_str = str(job.brief_url)
        deliv_str = str(job.deliverable_url)

        def leader_fn():
            try:
                brief_res = gl.nondet.web.render(brief_str, mode="text")
                brief_text = brief_res.content if hasattr(brief_res, "content") else str(brief_res)
            except Exception as e:
                brief_text = f"404 placeholder or network error: {str(e)}"
                
            try:
                deliv_url_clean = deliv_str.split("\nNotes: ")[0].strip()
                deliv_res = gl.nondet.web.render(deliv_url_clean, mode="text")
                deliv_text = deliv_res.content if hasattr(deliv_res, "content") else str(deliv_res)
            except Exception as e:
                deliv_text = f"404 placeholder or network error: {str(e)}"
                
            prompt = f"""
            You are an expert project manager and judge.
            Evaluate the following deliverable against the original brief.
            
            BRIEF:
            {brief_text[:2500]}
            
            DELIVERABLE:
            {deliv_text[:2500]}
            
            Decide on one of the following verdicts:
            - RELEASE: The deliverable fully meets the brief requirements.
            - PARTIAL: The deliverable partially meets the brief.
            - REFUND: The deliverable fails to meet the brief, or is unrelated/dummy.
            - ESCALATE: The evidence is contradictory, or you are unsure.
            
            CRITICAL RULE: If either the brief or the deliverable appears to be a 404 error page, example domain placeholder, or mock/dummy testing URL, you MUST output verdict "REFUND" with confidence 100 and reason "Dummy/404 URLs cannot be accepted".
            
            You MUST respond with ONLY a JSON object:
            {{"verdict": "RELEASE|PARTIAL|REFUND|ESCALATE", "confidence": 100, "reason": "your reasoning"}}
            """
            
            res = gl.nondet.exec_prompt(prompt, response_format="json")
            if isinstance(res, dict):
                return res
            if hasattr(res, 'calldata') and isinstance(res.calldata, dict):
                return res.calldata
            try:
                text = res.content if hasattr(res, "content") else str(res)
                return self._parse_llm_json(text)
            except Exception:
                return {"verdict": "REFUND", "confidence": 100, "reason": "Fallback to refund on JSON parse error"}

        def validator_fn(leader_res) -> bool:
            if not isinstance(leader_res, gl.vm.Return):
                return False
            leader_data = leader_res.calldata if hasattr(leader_res, "calldata") else leader_res
            if not isinstance(leader_data, dict):
                try:
                    leader_data = self._parse_llm_json(str(leader_data))
                except Exception:
                    leader_data = {"verdict": "REFUND"}
                    
            mine_data = leader_fn()
            v_leader = str(leader_data.get("verdict", "")).upper().strip()
            v_mine = str(mine_data.get("verdict", "")).upper().strip()
            return v_leader == v_mine

        result = gl.vm.run_nondet(leader_fn, validator_fn)
        if not isinstance(result, dict):
            try:
                result = self._parse_llm_json(str(result))
            except Exception:
                result = {"verdict": "ESCALATE", "confidence": 0, "reason": "Failed to parse AI response."}

        final_verdict = str(result.get("verdict", "ESCALATE")).upper()
        try:
            confidence = int(result.get("confidence", 0))
        except Exception:
            confidence = 100
        reason = str(result.get("reason", "No reason provided"))
        
        if confidence < 65:
            final_verdict = "ESCALATE"
            reason = f"[Confidence below threshold: {confidence}%] " + reason
            
        job.ai_verdict = final_verdict
        job.ai_reason = reason
        
        amount = job.amount
        # Keep job.amount untouched in metadata so UI always displays original contract value after closure
        
        if final_verdict == "RELEASE":
            job.status = "CLOSED"
            gl.get_contract_at(Address(str(job.freelancer))).emit_transfer(value=amount)
        elif final_verdict == "REFUND":
            job.status = "CLOSED"
            gl.get_contract_at(Address(str(job.client))).emit_transfer(value=amount)
        elif final_verdict == "PARTIAL":
            job.status = "CLOSED"
            half = amount // bigint(2)
            rem = amount - half
            gl.get_contract_at(Address(str(job.client))).emit_transfer(value=half)
            gl.get_contract_at(Address(str(job.freelancer))).emit_transfer(value=rem)
        elif final_verdict == "ESCALATE":
            job.amount = amount
            
        self.jobs[job_id] = job

    def _parse_llm_json(self, text) -> dict:
        if isinstance(text, dict):
            return text
        if hasattr(text, '__dict__'):
            return text.__dict__
        import json
        text = str(text).strip()
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        return json.loads(text.strip())
