import sys
import os
import unittest
from unittest.mock import MagicMock, patch

# --- GenLayer SDK Mock Infrastructure for Offline Regression Testing ---
class MockAddress(str):
    pass

class MockBigInt(int):
    pass

class MockUserError(Exception):
    pass

class MockReturn:
    def __init__(self, calldata):
        self.calldata = calldata

class MockContractStub:
    def __init__(self, address, transfer_tracker):
        self.address = address
        self.transfer_tracker = transfer_tracker

    def emit_transfer(self, value):
        self.transfer_tracker.append({"to": self.address, "value": value})

class MockGL:
    class Contract:
        def __init__(self):
            self.jobs = {}
            self.next_job_id = MockBigInt(0)

    class public:
        @staticmethod
        def view(fn): return fn
        @staticmethod
        def write(fn): return fn

    class message:
        value = MockBigInt(100)
        sender_address = MockAddress("0xClientAddress")

    class nondet:
        class web:
            @staticmethod
            def render(url, mode="text"):
                pass
        @staticmethod
        def exec_prompt(prompt, response_format="json"):
            pass

    class vm:
        Return = MockReturn
        @staticmethod
        def run_nondet(leader_fn, validator_fn):
            res = leader_fn()
            ret = MockReturn(calldata=res)
            validator_fn(ret)
            return res

    def __init__(self):
        self.transfers = []

    def get_contract_at(self, address):
        return MockContractStub(address, self.transfers)

# Setup decorator mocking
MockGL.public.write.payable = lambda fn: fn

# Inject mocks into sys.modules so 'from genlayer import *' works smoothly
mock_genlayer_mod = MagicMock()
mock_genlayer_mod.gl = MockGL()
mock_genlayer_mod.allow_storage = lambda cls: cls
mock_genlayer_mod.Address = MockAddress
mock_genlayer_mod.bigint = MockBigInt
mock_genlayer_mod.u256 = MockBigInt
mock_genlayer_mod.UserError = MockUserError
mock_genlayer_mod.TreeMap = dict

sys.modules["genlayer"] = mock_genlayer_mod

# Now import the actual contract logic
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "contracts")))
import deliverable_court

class TestPayoutCriticalPathRegression(unittest.TestCase):
    """
    Regression Test Suite for Payout-Critical Path (Requested by Pavel Kolosov)
    Ensures that brief-fetch failures preserve or escalate the escrow instead of refunding the client.
    """

    def setUp(self):
        self.gl_instance = mock_genlayer_mod.gl
        self.gl_instance.transfers = []
        self.contract = deliverable_court.Contract()
        self.contract.jobs = {}
        self.contract.next_job_id = MockBigInt(0)

        # Step 1: Client creates an escrow job
        self.gl_instance.message.sender_address = MockAddress("0xClient_1111")
        self.gl_instance.message.value = MockBigInt(500)
        self.job_id = self.contract.create_job(
            title="Frontend UI Implementation",
            description="Build modern dashboard UI",
            brief_url="https://example.com/client_brief.txt"
        )

        # Step 2: Freelancer accepts job and submits deliverable
        self.gl_instance.message.sender_address = MockAddress("0xFreelancer_9999")
        self.contract.accept_job(self.job_id)
        self.contract.submit_deliverable(
            self.job_id,
            deliverable_url="https://github.com/freelancer/repo-submission",
            notes="Completed dashboard UI according to specifications."
        )

    def test_01_brief_fetch_exception_preserves_escrow_no_refund(self):
        """
        REGRESSION TEST 1: Simulate network/connection exception when fetching Client Brief URL during adjudication.
        VERIFY: Escrow status is set to ESCALATED, verdict is ESCALATE, and NO REFUND is emitted to client.
        """
        def mock_render_exception(url, mode="text"):
            if "client_brief.txt" in url:
                raise Exception("DNS resolution failure / server offline")
            return MagicMock(content="Deliverable content verified.")

        self.gl_instance.nondet.web.render = mock_render_exception
        
        # Act
        self.contract.adjudicate(self.job_id)
        job_after = self.contract.jobs[self.job_id]

        # Assert: Verdict MUST be ESCALATE, never REFUND
        self.assertEqual(job_after.ai_verdict, "ESCALATE", "Verdict should be ESCALATE when brief URL fetch fails.")
        self.assertNotEqual(job_after.ai_verdict, "REFUND", "CRITICAL VULNERABILITY: Failed brief URL triggered refund!")
        self.assertEqual(job_after.status, "ESCALATED", "Status should be marked ESCALATED to preserve locked funds.")
        self.assertEqual(len(self.gl_instance.transfers), 0, "No token transfer should be emitted; escrow funds must remain preserved!")

    def test_02_brief_404_page_content_preserves_escrow(self):
        """
        REGRESSION TEST 2: Simulate Client intentionally altering brief URL to point to a 404 Error page after freelancer submits.
        VERIFY: Escrow is preserved via ESCALATION instead of refunding client.
        """
        def mock_render_404(url, mode="text"):
            if "client_brief.txt" in url:
                return MagicMock(content="404 Not Found: The requested resource is not available on this server.")
            return MagicMock(content="Deliverable source code and live demo ready.")

        self.gl_instance.nondet.web.render = mock_render_404
        
        # Act
        self.contract.adjudicate(self.job_id)
        job_after = self.contract.jobs[self.job_id]

        # Assert: Verdict MUST be ESCALATE to prevent client from manipulating payouts via 404 briefs
        self.assertEqual(job_after.ai_verdict, "ESCALATE", "404 brief content must trigger ESCALATE.")
        self.assertEqual(job_after.status, "ESCALATED", "Status must be ESCALATED.")
        self.assertEqual(len(self.gl_instance.transfers), 0, "Escrow balance must be preserved in contract.")

    def test_03_valid_brief_but_dummy_deliverable_triggers_refund(self):
        """
        CONTROL TEST 3: When brief IS valid, but freelancer submits a 404/dummy deliverable URL, normal REFUND rule applies.
        """
        def mock_render_normal(url, mode="text"):
            if "client_brief.txt" in url:
                return MagicMock(content="Valid brief requiring Dashboard UI implementation with Web3 wallet login.")
            return MagicMock(content="404 Error: deliverable repository not found.")

        self.gl_instance.nondet.web.render = mock_render_normal
        self.gl_instance.nondet.exec_prompt = lambda prompt, response_format="json": {"verdict": "REFUND", "confidence": 100, "reason": "Dummy/404 deliverable URLs cannot be accepted"}

        # Act
        self.contract.adjudicate(self.job_id)
        job_after = self.contract.jobs[self.job_id]

        # Assert
        self.assertEqual(job_after.ai_verdict, "REFUND")
        self.assertEqual(job_after.status, "CLOSED")
        self.assertEqual(len(self.gl_instance.transfers), 1, "Transfer should occur for valid refund.")
        self.assertEqual(self.gl_instance.transfers[0]["to"], "0xClient_1111")
        self.assertEqual(self.gl_instance.transfers[0]["value"], 500)

    def test_04_client_tampering_defense_audit(self):
        """
        AUDIT TEST 4: Verifies all 4 pillars of client brief tampering defense:
        1. Khách gian cấm được "Rút củi đáy nồi" (No REFUND on brief failure)
        2. Khóa Kiên Cố Tranh Chấp (Status changes to ESCALATED)
        3. Bảo toàn 100% tài sản (0 transfers emitted, tokens remain locked in contract)
        4. Phân định trắng đen rạch ròi (Distinction between client tampering vs freelancer failure)
        """
        # Set exact scenario amount as seen in user testing (234 GEN)
        self.gl_instance.transfers = []
        self.gl_instance.message.sender_address = MockAddress("0xClient_2056")
        self.gl_instance.message.value = MockBigInt(234)
        job_id_234 = self.contract.create_job("Node.js Backend", "Build backend system", "https://client-briefs.io/job234.html")
        
        self.gl_instance.message.sender_address = MockAddress("0xFreelancer_ad38")
        self.contract.accept_job(job_id_234)
        self.contract.submit_deliverable(job_id_234, "https://github.com/freelance/nodejs-backend-perfect", "Completed perfect backend.")
        
        # Client intentionally breaks brief link after submission
        def mock_render_tampered(url, mode="text"):
            if "job234.html" in url:
                raise Exception("Connection refused / File deleted by owner")
            return MagicMock(content="Perfect Node.js Express PostgreSQL backend implementation with JWT.")

        self.gl_instance.nondet.web.render = mock_render_tampered
        self.contract.adjudicate(job_id_234)
        job = self.contract.jobs[job_id_234]

        # Audit Verification
        self.assertNotEqual(job.ai_verdict, "REFUND", "[Pillar 1] FAILED: Contract allowed REFUND on brief failure!")
        self.assertEqual(job.ai_verdict, "ESCALATE", "[Pillar 1] PASSED: Verdict forced to ESCALATE.")
        self.assertEqual(job.status, "ESCALATED", "[Pillar 2] PASSED: Status locked to ESCALATED.")
        self.assertEqual(len(self.gl_instance.transfers), 0, "[Pillar 3] PASSED: 0 transfers emitted! 234 GEN locked inside contract.")
        self.assertEqual(int(job.amount), 234, "[Pillar 3] PASSED: 234 GEN untouched in escrow metadata.")


if __name__ == "__main__":
    print("=" * 75)
    print("RUNNING REGRESSION TEST SUITE FOR PAYOUT-CRITICAL PATH (GENLAYER)")
    print("=" * 75)
    unittest.main(verbosity=2)
