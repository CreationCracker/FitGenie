import os
from typing import List
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv

from state import MasterGraphState
import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from tools.youtube_tutorial_tool import YoutubeTutorialTool

load_dotenv()

# ─── PYDANTIC SCHEMAS ─────────────────────────────────────────────────────────

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

# ─── TOOL SETUP ───────────────────────────────────────────────────────────────

# Instantiate once — reused for every exercise lookup in the agent
youtube_tool = YoutubeTutorialTool()

TOOLS = [youtube_tool]
TOOLS_BY_NAME = {t.name: t for t in TOOLS}

# ─── HELPERS ──────────────────────────────────────────────────────────────────

def _collect_unique_exercise_names(plan: List[dict]) -> List[str]:
    """Returns a deduped list of exercise names across the whole plan."""
    seen: set[str] = set()
    unique: list[str] = []
    for day in plan:
        for ex in day.get("exercises", []):
            key = ex["name"].strip().lower()
            if key not in seen:
                seen.add(key)
                unique.append(ex["name"].strip())
    return unique


def _fetch_tutorials_via_tool_calls(exercise_names: List[str]) -> dict[str, dict]:
    """
    Dispatches youtube_tutorial_search tool calls for each unique exercise
    name and returns a lowercase-name → tutorial dict.
    """
    tutorials: dict[str, dict] = {}

    for name in exercise_names:
        print(f"   [Exercise Agent] Tool call → youtube_tutorial_search('{name}')")

        # Dispatch through TOOLS_BY_NAME — standard LangChain tool-call pattern
        result: dict = TOOLS_BY_NAME["youtube_tutorial_search"]._run(name)

        if "error" in result:
            print(f"   [Exercise Agent] ⚠ Tutorial not found for '{name}': {result['error']}")
            tutorials[name.lower()] = {
                "videoId": "", "url": "", "thumbnail": "", "title": "", "channel": ""
            }
        else:
            tutorials[name.lower()] = result

    return tutorials


def _merge_tutorials_into_plan(plan: List[dict], tutorials: dict[str, dict]) -> List[dict]:
    """
    Injects the 5 tutorial fields into every exercise dict so they map
    directly onto the Mongoose ExerciseTaskSchema fields.
    """
    for day in plan:
        enriched: list[dict] = []
        for ex in day.get("exercises", []):
            tut = tutorials.get(ex["name"].strip().lower(), {})
            enriched.append({
                **ex,
                "tutorialVideoId":     tut.get("videoId",   ""),
                "tutorialUrl":         tut.get("url",        ""),
                "tutorialThumbnail":   tut.get("thumbnail",  ""),
                "tutorialTitle":       tut.get("title",      ""),
                "tutorialChannelName": tut.get("channel",    ""),
            })
        day["exercises"] = enriched

    return plan


# ─── AGENT ────────────────────────────────────────────────────────────────────

def exercise_planning_agent(state: MasterGraphState) -> dict:
    print("   [Exercise Agent] Generating workout plan...")

    model = ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite-preview", temperature=0.2)
    structured_model = model.with_structured_output(WorkoutPlanResponse)

    categories_str = ", ".join(state.get("selected_categories", []))
    targets_str    = ", ".join(state.get("primary_targets", []))
    equipment_list = state.get("available_equipment", [])
    equipment_str  = ", ".join(equipment_list) if equipment_list else "Bodyweight only"

    # ── Date logic ────────────────────────────────────────────────────────────
    duration_days = 7
    raw_start  = state.get("start_date")
    base_date  = datetime.strptime(raw_start, "%Y-%m-%d") if raw_start else datetime.today()

    date_schedule = [
        {
            "date":       (base_date + timedelta(days=i + 1)).strftime("%Y-%m-%d"),
            "day_label":  (base_date + timedelta(days=i + 1)).strftime("%A"),
            "day_number": i + 1,
        }
        for i in range(duration_days)
    ]

    schedule_str = "\n".join(
        [f"  Day {s['day_number']}: {s['date']} ({s['day_label']})" for s in date_schedule]
    )

    # ── Privileged instructions ───────────────────────────────────────────────
    user_context_str = state.get("exercise_user_context", "")
    privileged_instructions = (
        f"\n\nIMPORTANT EXERCISE RESTRICTIONS (follow strictly):\n{user_context_str}"
        if user_context_str else ""
    )

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

    # ── Step 1: LLM generates the raw plan ───────────────────────────────────
    response: WorkoutPlanResponse = structured_model.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"Generate a {duration_days}-day workout plan and equipment list.")
    ])

    raw_plan: List[dict] = [day.model_dump() for day in response.plan]

    # ── Step 2: Tool calls — fetch a YouTube tutorial per unique exercise ─────
    print("   [Exercise Agent] Dispatching tool calls for YouTube tutorials...")
    unique_names = _collect_unique_exercise_names(raw_plan)
    tutorials    = _fetch_tutorials_via_tool_calls(unique_names)

    # ── Step 3: Merge tutorial fields into every exercise in the plan ─────────
    enriched_plan = _merge_tutorials_into_plan(raw_plan, tutorials)
    print(enriched_plan)
    return {
        "generated_workout_plan": enriched_plan,
        "equipment_needed":       response.equipment_needed,
        "exercise_feedback":      None,
    }
