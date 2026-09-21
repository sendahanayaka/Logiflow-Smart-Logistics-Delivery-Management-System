# [S1..S4] Agent nodes. Each student owns one file; the node signature is frozen:
#   def <name>_node(state: WorkflowState) -> dict   (a partial state update)
from app.agents.triage_agent import triage_node
from app.agents.allocation_agent import allocation_node
from app.agents.validation_agent import validation_node
from app.agents.routing_agent import routing_node

__all__ = ["triage_node", "allocation_node", "validation_node", "routing_node"]
