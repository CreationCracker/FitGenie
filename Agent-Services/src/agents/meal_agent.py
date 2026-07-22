import os
import sys
from typing import List
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv
from state import MasterGraphState

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from tools.youtube_recipe_tool import YoutubeRecipeTool

load_dotenv()

# ─── TOOL SETUP ───────────────────────────────────────────────────────────────
youtube_recipe_tool = YoutubeRecipeTool()

# --- PYDANTIC SCHEMAS ---
class Meal(BaseModel):
    name: str = Field(description="Name of the meal or recipe")
    scheduled_time: str = Field(description="Scheduled time for this meal in HH:MM format, e.g. '08:00'")
    ingredients: List[str] = Field(description="List of required ingredients with exact quantities")
    calories: int = Field(description="Estimated calories for this meal")
    protein: int = Field(description="Estimated protein in grams")

class DailyPlan(BaseModel):
    date: str = Field(description="The actual calendar date for this day, e.g. '2025-07-11'")
    day_label: str = Field(description="The weekday name, e.g. 'Monday'")
    meals: List[Meal] = Field(description="Meals for the day (Breakfast, Lunch, Dinner, Snack)")
    total_daily_calories: int = Field(description="Sum of calories for the day")
    total_daily_protein: int = Field(description="Sum of protein for the day")

class MealPlanResponse(BaseModel):
    plan: List[DailyPlan] = Field(description="The complete meal plan for the requested number of days")
    grocery_list: List[str] = Field(description="A consolidated master grocery list of all ingredients needed.")

# --- AGENT LOGIC ---
def meal_planning_agent(state: MasterGraphState) -> dict:
    print("   [Meal Agent] Generating diet plan...")

    model = ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite-preview", temperature=0.2)

    structured_model = model.with_structured_output(MealPlanResponse)

    dietary_prefs_str = ", ".join(state.get("dietary_preferences", []))
    targets_str = ", ".join(state.get("primary_targets", []))
    days = state.get("plan_duration_days", 3)

    # --- DATE LOGIC ---
    # Compute the actual calendar dates starting from start_date + 1
    raw_start = state.get("start_date")
    if raw_start:
        base_date = datetime.strptime(raw_start, "%Y-%m-%d")
    else:
        base_date = datetime.today()

    # Build a list of (date_str, weekday_name) for each plan day
    date_schedule = []
    for i in range(days):
        d = base_date + timedelta(days=i + 1)
        date_schedule.append({
            "date": d.strftime("%Y-%m-%d"),
            "day_label": d.strftime("%A"),   # e.g. "Monday"
            "day_number": i + 1
        })

    schedule_str = "\n".join(
        [f"  Day {s['day_number']}: {s['date']} ({s['day_label']})" for s in date_schedule]
    )

    user_context_str = state.get("meal_user_context", "")
    privileged_instructions = ""
    if user_context_str:
        privileged_instructions = f"""

IMPORTANT DIETARY RESTRICTIONS (follow strictly):
{user_context_str}
"""

    # ── Preferred meal times ──────────────────────────────────────────────────
    preferred_times = state.get("preferred_times") or {}
    breakfast_time = preferred_times.get("breakfast", "08:00")
    lunch_time = preferred_times.get("lunch", "13:00")
    dinner_time = preferred_times.get("dinner", "20:00")
    snack_time = preferred_times.get("snack", "16:00")

    time_instructions = f"""
- Meal Schedule (assign these as the scheduled_time for each meal):
  * Breakfast: {breakfast_time}
  * Lunch: {lunch_time}
  * Snack: {snack_time}
  * Dinner: {dinner_time}
  Each meal MUST include a "scheduled_time" field with the appropriate time from above in HH:MM format."""

    system_prompt = f"""You are an expert sports nutritionist AI.
Your task is to create a highly accurate, day-by-day meal plan.{privileged_instructions}
Constraints:
- Dietary Preferences: {dietary_prefs_str if dietary_prefs_str else "None"}
- Daily Calorie Target: {state.get('target_calories', 2000)} kcal (+/- 50)
- Daily Protein Target: {state.get('target_protein', 100)}g (+/- 5)
- Overall Fitness Goals: {targets_str if targets_str else "General fitness"}
- Menu Regularity: Do NOT generate more than 12 unique meals/recipes across all days.
- Grocery List: Consolidate all ingredients into a single master list.
{time_instructions}

IMPORTANT — use these exact dates and weekday labels in the plan (one entry per day):
{schedule_str}

Each day in your response must have:
  - "date": the exact date string shown above (e.g. "{date_schedule[0]['date']}")
  - "day_label": the weekday name shown above (e.g. "{date_schedule[0]['day_label']}")"""

    if state.get("meal_feedback") and state.get("generated_meal_plan"):
        system_prompt += f"""

The user reviewed the previous meal plan and requested the following changes:
"{state['meal_feedback']}"
Please generate an updated meal plan incorporating these changes."""

    response: MealPlanResponse = structured_model.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content="Please generate the meal plan and grocery list.")
    ])

    raw_plan: List[dict] = [dp.model_dump() for dp in response.plan]

    # ── Step 2: Tool calls — fetch a YouTube recipe per unique meal ───────────
    print("   [Meal Agent] Dispatching tool calls for YouTube recipes...")
    seen: set[str] = set()
    unique_meals: list[str] = []
    for day in raw_plan:
        for meal in day.get("meals", []):
            key = meal["name"].strip().lower()
            if key not in seen:
                seen.add(key)
                unique_meals.append(meal["name"].strip())

    recipes: dict[str, dict] = {}
    for name in unique_meals:
        print(f"   [Meal Agent] Tool call → youtube_recipe_search('{name}')")
        result = youtube_recipe_tool._run(name)
        if "error" in result:
            print(f"   [Meal Agent] ⚠ Recipe not found for '{name}': {result['error']}")
            recipes[name.lower()] = {
                "videoId": "", "url": "", "thumbnail": "", "title": "", "channel": ""
            }
        else:
            recipes[name.lower()] = result

    # ── Step 3: Merge recipe fields into every meal ───────────────────────────
    for day in raw_plan:
        enriched: list[dict] = []
        for meal in day.get("meals", []):
            rec = recipes.get(meal["name"].strip().lower(), {})
            enriched.append({
                **meal,
                "recipeVideoId":     rec.get("videoId",   ""),
                "recipeUrl":         rec.get("url",       ""),
                "recipeThumbnail":   rec.get("thumbnail", ""),
                "recipeTitle":       rec.get("title",     ""),
                "recipeChannelName": rec.get("channel",   ""),
            })
        day["meals"] = enriched

    print(f"   [Meal Agent] Enriched {len(unique_meals)} unique meals with recipe videos.")

    return {
        "generated_meal_plan": raw_plan,
        "grocery_list": response.grocery_list,
        "meal_feedback": None
    }