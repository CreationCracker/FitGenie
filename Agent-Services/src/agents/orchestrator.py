import os
import json
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
        description="Translate medical conditions (like Diabetes) or user requests into strict diet rules for the Meal Agent.",
        default=None
    )
    exercise_context_update: Optional[str] = Field(
        description="Translate medical conditions (like Back Pain or Knee Injury) or user requests into strict workout rules for the Exercise Agent.",
        default=None
    )

# ==========================================
# THE ORCHESTRATOR NODE
# ==========================================
def orchestrator_node(state: MasterGraphState) -> dict:
    print("[Orchestrator] Analyzing frontend inputs...")

    # FIX: Corrected model name
    model = ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite-preview", temperature=0.0)
    structured_model = model.with_structured_output(OrchestratorDecision)

    context_summary = f"""
User Prompt: "{state.get('user_prompt', 'None')}"
Selected Categories: {state.get('selected_categories', [])}
Primary Targets: {state.get('primary_targets', [])}
Medical Conditions: {state.get('medical_conditions', [])}
"""

    # FIX: Removed emojis from system prompt to avoid Gemini safety filter triggers
    system_prompt = """You are the Master Orchestrator for a fitness application.
Analyze the user's profile and determine which agents need to run.
Translate any Medical Conditions into strict, actionable context updates for the downstream agents.
For example:
- If they have Hypertension, tell the meal agent to limit sodium and avoid high-salt foods.
- If they have a Knee Injury, tell the exercise agent to avoid all high-impact jumping and deep squats.
- If they have Diabetes, tell the meal agent to avoid high-glycemic foods and refined sugars."""

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
# HUMAN-IN-THE-LOOP (HITL) NODES
# ==========================================
def human_review_node(state: MasterGraphState) -> dict:
    """Dummy node where the graph pauses for user feedback."""
    return {}

def route_from_orchestrator(state: MasterGraphState) -> List[str]:
    """Fan-Out: Sends the initial request to the required agents."""
    destinations = []
    if state.get("route_to_meal"):
        destinations.append("meal_planner")
    if state.get("route_to_exercise"):
        destinations.append("exercise_planner")
    if not destinations:
        return [END]
    return destinations

def route_after_human(state: MasterGraphState) -> List[str]:
    """Routing logic based on specific human feedback."""
    if state.get("is_satisfied"):
        return [END]

    destinations = []
    if state.get("meal_feedback"):
        destinations.append("meal_planner")
    if state.get("exercise_feedback"):
        destinations.append("exercise_planner")

    if not destinations:
        return ["orchestrator"]

    return destinations

# ==========================================
# GRAPH CONSTRUCTION
# ==========================================
workflow = StateGraph(MasterGraphState)

workflow.add_node("orchestrator", orchestrator_node)
workflow.add_node("meal_planner", meal_planning_agent)
workflow.add_node("exercise_planner", exercise_planning_agent)
workflow.add_node("human_review", human_review_node)

workflow.set_entry_point("orchestrator")

workflow.add_conditional_edges("orchestrator", route_from_orchestrator, ["meal_planner", "exercise_planner", END])
workflow.add_edge("meal_planner", "human_review")
workflow.add_edge("exercise_planner", "human_review")
workflow.add_conditional_edges("human_review", route_after_human, ["meal_planner", "exercise_planner", "orchestrator", END])

memory = MemorySaver()
app = workflow.compile(checkpointer=memory, interrupt_before=["human_review"])


# ==========================================
# EXECUTION, HITL & LOGGING LOOP
# ==========================================
if __name__ == "__main__":

    frontend_payload = {
        "user_prompt": "I want to get back in shape for my wedding.",
        "selected_categories": ["Gym / Strength", "Diet Only"],
        "primary_targets": ["Lose Weight", "Build Muscle"],
        "plan_duration_days": 2,
        "medical_conditions": ["Knee Injury"],
        "dietary_preferences": ["vegetarian"],
        "target_calories": 2200,
        "target_protein": 140,
        "days_per_week": 2,
        "fitness_level": "Intermediate",
        "available_equipment": ["Dumbbells"],
        # FIX: Pre-initialize optional fields to avoid KeyError in agents
        "meal_user_context": None,
        "exercise_user_context": None,
        "generated_meal_plan": None,
        "generated_workout_plan": None,
        "grocery_list": None,
        "equipment_needed": None,
        "route_to_meal": None,
        "route_to_exercise": None,
        "is_satisfied": None,
        "meal_feedback": None,
        "exercise_feedback": None,
    }

    config = {"configurable": {"thread_id": "production_user_001"}}

    with open("output.txt", "w", encoding="utf-8") as f:
        print("\n[START] Starting Master Orchestrator Workflow...")
        f.write("Starting Master Orchestrator Workflow...\n\n")

        for event in app.stream(frontend_payload, config=config):
            pass

        # --- HITL INTERACTIVE LOOP ---
        while True:
            current_state = app.get_state(config).values

            print("\n" + "=" * 50)
            print("PLANS GENERATED!")
            f.write("=" * 50 + "\nNEW PLANS GENERATED\n" + "=" * 50 + "\n")

            # Log Meal Plan
            if current_state.get("generated_meal_plan"):
                print("\nMEAL PLAN PREVIEW:")
                m_plan = current_state["generated_meal_plan"][0]
                print(f"  Day 1: {m_plan['total_daily_calories']} kcal, {m_plan['total_daily_protein']}g protein")

                f.write("\n--- FULL MEAL PLAN ---\n")
                f.write(json.dumps(current_state["generated_meal_plan"], indent=4))
                f.write("\n")
            else:
                print("  (No meal plan generated)")

            # Log Workout Plan
            if current_state.get("generated_workout_plan"):
                print("\nWORKOUT PLAN PREVIEW:")
                w_plan = current_state["generated_workout_plan"][0]
                print(f"  Day 1 Focus: {w_plan['focus']}")

                f.write("\n--- FULL WORKOUT PLAN ---\n")
                f.write(json.dumps(current_state["generated_workout_plan"], indent=4))
                f.write("\n")
            else:
                print("  (No workout plan generated)")

            print("=" * 50)

            user_choice = input("\nAre you satisfied with both plans? (y/n): ").strip().lower()
            f.write(f"\n[USER RESPONSE: Satisfied? -> {user_choice}]\n")

            if user_choice in ["y", "yes"]:
                print("\nApproving Final Plans...")
                app.update_state(config, {"is_satisfied": True}, as_node="human_review")
                for event in app.stream(None, config=config):
                    pass
                print("Graph finished. Plans saved to output.txt!")
                f.write("\nGRAPH FINISHED AND APPROVED.\n")
                break

            elif user_choice in ["n", "no"]:
                print("\nLet's fix it. Leave blank if you don't have feedback for that specific plan.")
                m_feedback = input("Feedback for Meals (or press Enter to skip): ").strip()
                e_feedback = input("Feedback for Exercise (or press Enter to skip): ").strip()

                f.write(f"Meal Feedback: {m_feedback}\nExercise Feedback: {e_feedback}\n\n")

                app.update_state(
                    config,
                    {
                        "is_satisfied": False,
                        "meal_feedback": m_feedback if m_feedback else None,
                        "exercise_feedback": e_feedback if e_feedback else None,
                    },
                    as_node="human_review"
                )

                print("\nRegenerating requested plans...")
                f.write("Regenerating...\n\n")
                for event in app.stream(None, config=config):
                    pass

            else:
                print("Invalid input. Please type 'y' or 'n'.")
