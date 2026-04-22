from typing import List, TypedDict, Optional

class MasterGraphState(TypedDict):
    # ==========================================
    # 1. RAW UI INPUTS (From your Frontend Onboarding)
    # ==========================================
    user_prompt: Optional[str]            # Free-text chat input
    selected_categories: List[str]        # e.g., ["Gym / Strength", "Diet Only"]
    primary_targets: List[str]            # e.g., ["Lose Weight", "Build Muscle"]
    plan_duration_days: int               # e.g., 30
    medical_conditions: List[str]         # e.g., ["Diabetes", "Back Pain"]

    # ==========================================
    # 2. TIMING & TRACKING STATE
    # ==========================================
    start_date: Optional[str]             # e.g., "2025-07-10" — plans begin from start_date + 1 day

    # ==========================================
    # 3. MEAL PLANNER STATE
    # ==========================================
    dietary_preferences: List[str]
    target_calories: int
    target_protein: int
    meal_user_context: Optional[str]
    generated_meal_plan: Optional[list]
    grocery_list: Optional[list]

    # ==========================================
    # 4. EXERCISE PLANNER STATE
    # ==========================================
    days_per_week: int
    fitness_level: str
    available_equipment: List[str]
    exercise_user_context: Optional[str]
    generated_workout_plan: Optional[list]
    equipment_needed: Optional[list]

    # ==========================================
    # 5. ROUTING & HUMAN-IN-THE-LOOP FLAGS
    # ==========================================
    route_to_meal: Optional[bool]
    route_to_exercise: Optional[bool]
    is_satisfied: Optional[bool]
    meal_feedback: Optional[str]
    exercise_feedback: Optional[str]
