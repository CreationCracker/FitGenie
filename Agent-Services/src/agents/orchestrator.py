import os
from typing import List, Optional
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from dotenv import load_dotenv

from state import MasterGraphState
from meal_agent import meal_planning_agent
from exercise_agent import exercise_planning_agent

load_dotenv()

# ==========================================
# ORCHESTRATOR BRAIN (Pydantic Schema)
# ==========================================
class OrchestratorDecision(BaseModel):
    update_meal_plan: bool = Field(description="Set to True if the input involves Diet, Meals, or Nutrition.")
    update_exercise_plan: bool = Field(description="Set to True if the input involves Gym, Yoga, Cardio, Injuries, or Workouts.")

    meal_context_update: Optional[str] = Field(
        description="Translate medical conditions (like Diabetes) into strict diet rules for the Meal Agent.",
        default=None
    )
    exercise_context_update: Optional[str] = Field(
        description="Translate medical conditions (like Knee Injury) into strict workout rules for the Exercise Agent.",
        default=None
    )

# ==========================================
# THE ORCHESTRATOR NODE
# ==========================================
def orchestrator_node(state: MasterGraphState) -> dict:
    print("[Orchestrator] Analyzing frontend inputs...")

    model = ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite-preview", temperature=0.0)
    structured_model = model.with_structured_output(OrchestratorDecision)

    context_summary = f"""
User Prompt: "{state.get('user_prompt', 'None')}"
Selected Categories: {state.get('selected_categories', [])}
Primary Targets: {state.get('primary_targets', [])}
Medical Conditions: {state.get('medical_conditions', [])}
"""

    system_prompt = """You are the Master Orchestrator for a fitness application.
Analyze the user's profile and determine which agents need to run.
Translate any Medical Conditions into strict, actionable context updates for the downstream agents.
For example:
- Hypertension -> tell the meal agent to limit sodium and avoid high-salt foods.
- Knee Injury  -> tell the exercise agent to avoid high-impact jumping and deep squats.
- Diabetes     -> tell the meal agent to avoid high-glycemic foods and refined sugars."""

    decision: OrchestratorDecision = structured_model.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=context_summary)
    ])

    state_updates = {
        "route_to_meal": decision.update_meal_plan,
        "route_to_exercise": decision.update_exercise_plan,
    }

    if decision.meal_context_update:
        state_updates["meal_user_context"] = decision.meal_context_update
        print(f"   -> Meal Rule: {decision.meal_context_update}")

    if decision.exercise_context_update:
        state_updates["exercise_user_context"] = decision.exercise_context_update
        print(f"   -> Exercise Rule: {decision.exercise_context_update}")

    return state_updates

# ==========================================
# HUMAN-IN-THE-LOOP NODES & ROUTING
# ==========================================
def human_review_node(state: MasterGraphState) -> dict:
    return {}

def route_from_orchestrator(state: MasterGraphState) -> List[str]:
    destinations = []
    if state.get("route_to_meal"):
        destinations.append("meal_planner")
    if state.get("route_to_exercise"):
        destinations.append("exercise_planner")
    return destinations if destinations else [END]

def route_after_human(state: MasterGraphState) -> List[str]:
    if state.get("is_satisfied"):
        return [END]

    destinations = []
    if state.get("meal_feedback"):
        destinations.append("meal_planner")
    if state.get("exercise_feedback"):
        destinations.append("exercise_planner")

    return destinations if destinations else ["orchestrator"]

# ==========================================
# GRAPH CONSTRUCTION (module-level singleton)
# ==========================================
workflow = StateGraph(MasterGraphState)

workflow.add_node("orchestrator", orchestrator_node)
workflow.add_node("meal_planner", meal_planning_agent)
workflow.add_node("exercise_planner", exercise_planning_agent)
workflow.add_node("human_review", human_review_node)

workflow.set_entry_point("orchestrator")

workflow.add_conditional_edges(
    "orchestrator", route_from_orchestrator, ["meal_planner", "exercise_planner", END]
)
workflow.add_edge("meal_planner", "human_review")
workflow.add_edge("exercise_planner", "human_review")
workflow.add_conditional_edges(
    "human_review", route_after_human, ["meal_planner", "exercise_planner", "orchestrator", END]
)

memory = MemorySaver()
graph_app = workflow.compile(checkpointer=memory, interrupt_before=["human_review"])
