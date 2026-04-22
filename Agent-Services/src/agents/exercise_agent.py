import os
from typing import List
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv

from state import MasterGraphState

load_dotenv()

# --- PYDANTIC SCHEMAS ---
class Exercise(BaseModel):
    name: str = Field(description="Name of the exercise")
    sets: int = Field(description="Number of sets (Use 1 for continuous flows or cardio)")
    reps_or_duration: str = Field(description="Target reps (e.g., '8-12') or duration (e.g., '30 mins')")
    rest_seconds: int = Field(description="Rest time between sets in seconds")
    notes: str = Field(description="Brief form cue or cue for intensity")

class WorkoutDay(BaseModel):
    day: int = Field(description="The day number (e.g., 1, 2)")
    focus: str = Field(description="Focus of the session (e.g., 'Upper Body', 'Yoga Flow', 'Rest Day')")
    exercises: List[Exercise] = Field(default_factory=list,description="List of exercises for the day. Use an empty list for Rest Days.")

class WorkoutPlanResponse(BaseModel):
    plan: List[WorkoutDay] = Field(description="The complete workout plan for the requested duration")
    equipment_needed: List[str] = Field(description="Consolidated master list of all equipment needed for the plan.")

# --- AGENT LOGIC ---
def exercise_planning_agent(state: MasterGraphState) -> dict:
    print("   [Exercise Agent] Generating workout plan...")

    # FIX: Corrected model name (gemini-3-flash-preview does not exist)
    model = ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite-preview", temperature=0.2)
    structured_model = model.with_structured_output(WorkoutPlanResponse)

    categories_str = ", ".join(state.get("selected_categories", []))
    targets_str = ", ".join(state.get("primary_targets", []))
    equipment_list = state.get("available_equipment", [])
    equipment_str = ", ".join(equipment_list) if equipment_list else "Bodyweight only"

    duration_days = 7

    user_context_str = state.get("exercise_user_context", "")

    # FIX: Removed emoji-heavy "MASTER DIRECTIVE" block that triggered Gemini safety filters.
    # Injected as clean plain-text instructions instead.
    privileged_instructions = ""
    if user_context_str:
        privileged_instructions = f"""

IMPORTANT EXERCISE RESTRICTIONS (follow strictly):
{user_context_str}
"""

    system_prompt = f"""You are an expert Strength and Conditioning Coach and Fitness AI.
Your task is to create a highly effective, personalized workout plan.{privileged_instructions}
Constraints:
- Fitness Level: {state.get('fitness_level', 'Beginner')}
- Training Categories: {categories_str if categories_str else "General fitness"}
- Primary Goals: {targets_str if targets_str else "General fitness"}
- Training Frequency: {state.get('days_per_week', 3)} active days per week out of 7. Label non-training days as 'Rest Day' with an empty exercises list.
- Available Equipment: {equipment_str}. Do NOT suggest exercises requiring equipment not listed.
- Max Session Duration: 45-60 minutes.
- Exercise Regularity: Do NOT generate more than 15 unique exercises across the whole plan. Reuse movements for progressive overload."""

    if state.get("exercise_feedback") and state.get("generated_workout_plan"):
        system_prompt += f"""

The user reviewed the previous workout plan and requested the following changes:
"{state['exercise_feedback']}"
Please generate an updated workout plan incorporating these changes."""

    response: WorkoutPlanResponse = structured_model.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"Generate a {duration_days}-day workout plan and equipment list.")
    ])

    return {
        "generated_workout_plan": [day.model_dump() for day in response.plan],
        "equipment_needed": response.equipment_needed,
        "exercise_feedback": None
    }
