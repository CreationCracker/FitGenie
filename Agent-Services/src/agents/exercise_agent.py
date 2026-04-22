
import os
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv

from state import MasterGraphState

load_dotenv()

# --- PYDANTIC SCHEMAS ---
class Exercise(BaseModel):
    name: str = Field(description="Name of the exercise")
    sets: int = Field(description="Number of sets (use 1 for cardio or continuous flows)")
    reps_or_duration: str = Field(description="Target reps (e.g., '8-12') or duration (e.g., '30 mins')")
    rest_seconds: int = Field(description="Rest time between sets in seconds")
    notes: str = Field(description="Brief form cue or intensity note")

class WorkoutDay(BaseModel):
    date: str = Field(description="The actual calendar date for this day, e.g. '2025-07-11'")
    day_label: str = Field(description="The weekday name, e.g. 'Monday'")
    focus: str = Field(description="Focus of the session (e.g., 'Upper Body', 'Yoga Flow', 'Rest Day')")
    exercises: List[Exercise] = Field(default_factory=list, description="List of exercises. Leave empty for Rest Days.")

class WorkoutPlanResponse(BaseModel):
    plan: List[WorkoutDay] = Field(description="The complete workout plan for the requested duration")
    equipment_needed: List[str] = Field(description="Consolidated master list of all equipment needed.")

# --- AGENT LOGIC ---
def exercise_planning_agent(state: MasterGraphState) -> dict:
    print("   [Exercise Agent] Generating workout plan...")

    model = ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite-preview", temperature=0.2)
    
    structured_model = model.with_structured_output(WorkoutPlanResponse)

    categories_str = ", ".join(state.get("selected_categories", []))
    targets_str = ", ".join(state.get("primary_targets", []))
    equipment_list = state.get("available_equipment", [])
    equipment_str = ", ".join(equipment_list) if equipment_list else "Bodyweight only"

    # --- DATE LOGIC ---
    # Always generate a 7-day week cycle, starting from start_date + 1
    duration_days = 7
    raw_start = state.get("start_date")
    if raw_start:
        base_date = datetime.strptime(raw_start, "%Y-%m-%d")
    else:
        base_date = datetime.today()

    date_schedule = []
    for i in range(duration_days):
        d = base_date + timedelta(days=i + 1)
        date_schedule.append({
            "date": d.strftime("%Y-%m-%d"),
            "day_label": d.strftime("%A"),
            "day_number": i + 1
        })

    schedule_str = "\n".join(
        [f"  Day {s['day_number']}: {s['date']} ({s['day_label']})" for s in date_schedule]
    )

    user_context_str = state.get("exercise_user_context", "")
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
- Training Frequency: {state.get('days_per_week', 3)} active training days out of 7. Remaining days must be labeled 'Rest Day' with an empty exercises list.
- Available Equipment: {equipment_str}. Do NOT suggest exercises requiring unlisted equipment.
- Max Session Duration: 45-60 minutes.
- Exercise Regularity: Do NOT generate more than 15 unique exercises across the whole plan.

IMPORTANT — use these exact dates and weekday labels in the plan (one entry per day):
{schedule_str}

Each day in your response must have:
  - "date": the exact date string shown above (e.g. "{date_schedule[0]['date']}")
  - "day_label": the weekday name shown above (e.g. "{date_schedule[0]['day_label']}")"""

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

