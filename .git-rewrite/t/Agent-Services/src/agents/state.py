from typing import List, TypedDict, Optional

class MasterGraphState(TypedDict):
    # ==========================================
    # 1. RAW UI INPUTS (From your Frontend Onboarding)
    # ==========================================
    user_prompt: Optional[str]            # Free-text chat input (if they type a custom message)
    selected_categories: List[str]        # e.g., ["Gym / Strength", "Diet Only"]
    primary_targets: List[str]            # e.g., ["Lose Weight", "Build Muscle"]
    plan_duration_days: int               # e.g., 30
    medical_conditions: List[str]         # e.g., ["Diabetes", "Back Pain"]
    
    # ==========================================
    # 2. TIMING & TRACKING STATE
    # ==========================================
    # date: Optional[str]                   # e.g., "2023-11-01" or "Monday" (Useful for starting dates)
    # day: Optional[int]                    # e.g., 1 (Useful for tracking which day is currently being processed)

    # ==========================================
    # 3. MEAL PLANNER STATE
    # ==========================================
    dietary_preferences: List[str]
    target_calories: int
    target_protein: int
    meal_user_context: Optional[str]      # Where the Orchestrator puts "Diabetes" rules
    generated_meal_plan: Optional[list]
    grocery_list: Optional[list]
    
    # ==========================================
    # 4. EXERCISE PLANNER STATE
    # ==========================================
    days_per_week: int
    fitness_level: str
    available_equipment: List[str]
    exercise_user_context: Optional[str]  # Where the Orchestrator puts "Back Pain" rules
    generated_workout_plan: Optional[list]
    equipment_needed: Optional[list]
    
    # ==========================================
    # 5. ROUTING & HUMAN-IN-THE-LOOP FLAGS
    # ==========================================
    route_to_meal: Optional[bool]
    route_to_exercise: Optional[bool]
    is_satisfied: Optional[bool]
    meal_feedback: Optional[str]          # Renamed from user_description for clarity
    exercise_feedback: Optional[str]      # Renamed from user_description for clarity