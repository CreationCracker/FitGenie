import os
from typing import List
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv
from state import MasterGraphState

load_dotenv()

# --- PYDANTIC SCHEMAS ---
class Meal(BaseModel):
    name: str = Field(description="Name of the meal or recipe")
    ingredients: List[str] = Field(description="List of required ingredients with exact quantities")
    calories: int = Field(description="Estimated calories for this meal")
    protein: int = Field(description="Estimated protein in grams")

class DailyPlan(BaseModel):
    day: int = Field(description="The day number (e.g., 1, 2)")
    meals: List[Meal] = Field(description="Meals for the day (e.g., Breakfast, Lunch, Dinner, Snack)")
    total_daily_calories: int = Field(description="Sum of calories for the day")
    total_daily_protein: int = Field(description="Sum of protein for the day")

class MealPlanResponse(BaseModel):
    plan: List[DailyPlan] = Field(description="The complete meal plan for the requested number of days")
    grocery_list: List[str] = Field(description="A consolidated master grocery list of all ingredients needed.")

# --- AGENT LOGIC ---
def meal_planning_agent(state: MasterGraphState) -> dict:
    print("   [Meal Agent] Generating diet plan...")

    # FIX: Corrected model name (gemini-3-flash-preview does not exist)
    model = ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite-preview", temperature=0.2)
    structured_model = model.with_structured_output(MealPlanResponse)

    dietary_prefs_str = ", ".join(state.get("dietary_preferences", []))
    targets_str = ", ".join(state.get("primary_targets", []))
    days = state.get("plan_duration_days", 3)

    user_context_str = state.get("meal_user_context", "")

    # FIX: Removed emoji-heavy "MASTER DIRECTIVE" block that triggered Gemini safety filters.
    # Injected as clean plain-text instructions instead.
    privileged_instructions = ""
    if user_context_str:
        privileged_instructions = f"""

IMPORTANT DIETARY RESTRICTIONS (follow strictly):
{user_context_str}
"""

    system_prompt = f"""You are an expert sports nutritionist AI.
Your task is to create a highly accurate, day-by-day meal plan.{privileged_instructions}
Constraints:
- Duration: {days} days
- Dietary Preferences: {dietary_prefs_str if dietary_prefs_str else "None"}
- Daily Calorie Target: {state.get('target_calories', 2000)} kcal (+/- 50)
- Daily Protein Target: {state.get('target_protein', 100)}g (+/- 5)
- Overall Fitness Goals: {targets_str if targets_str else "General fitness"}
- Menu Regularity: Do NOT generate more than 12 unique meals/recipes across all days. Reuse meals for simplicity.
- Grocery List: Consolidate all ingredients into a single master list."""

    if state.get("meal_feedback") and state.get("generated_meal_plan"):
        system_prompt += f"""

The user reviewed the previous meal plan and requested the following changes:
"{state['meal_feedback']}"
Please generate an updated meal plan and grocery list incorporating these changes."""

    response: MealPlanResponse = structured_model.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content="Please generate the meal plan and grocery list.")
    ])

    return {
        "generated_meal_plan": [dp.model_dump() for dp in response.plan],
        "grocery_list": response.grocery_list,
        "meal_feedback": None
    }
