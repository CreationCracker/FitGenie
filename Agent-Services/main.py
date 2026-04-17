import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv
from datetime import date, timedelta

load_dotenv()

app = FastAPI(title="FitAI Schedule Generator", version="1.0.0")


# ==========================================
# 1. REQUEST / RESPONSE SCHEMAS
# ==========================================

class UserContext(BaseModel):
    age: Optional[int] = None
    weightKg: Optional[float] = None
    level: Optional[str] = "beginner"
    medicalIssues: Optional[List[str]] = []

class GoalContext(BaseModel):
    title: str
    type: str                   # "gym" | "yoga" | "diet" | "cardio"
    physiqueTarget: str
    durationDays: int
    startDate: str              # "YYYY-MM-DD"
    dietPreference: Optional[str] = None
    notes: Optional[str] = None

class ScheduleRequest(BaseModel):
    user_context: UserContext
    goal_context: GoalContext

# Matches ITask in your GoalSchema.ts exactly
class Task(BaseModel):
    date: str                   # "YYYY-MM-DD"
    title: str
    scheduledTime: str          # e.g. "07:00 AM"
    done: bool = False
    missed: bool = False
    order: int

class ScheduleResponse(BaseModel):
    tasks: List[Task]


# ==========================================
# 2. STRUCTURED OUTPUT SCHEMA FOR GEMINI
# ==========================================

class RawTask(BaseModel):
    day_number: int = Field(description="Which day of the plan this task belongs to (1-indexed)")
    title: str = Field(description="Short, actionable task title e.g. 'Morning Run – 30 mins' or 'Breakfast: Oats + eggs'")
    scheduled_time: str = Field(description="Suggested time in 12-hour format e.g. '07:00 AM'")
    order: int = Field(description="Order of this task within the day, starting from 1")

class RawSchedule(BaseModel):
    tasks: List[RawTask] = Field(description="All tasks across all days of the plan")


# ==========================================
# 3. ORCHESTRATOR: maps goal type → agent context
# ==========================================

def build_system_prompt(req: ScheduleRequest) -> str:
    uc = req.user_context
    gc = req.goal_context

    # Medical safety rules
    medical_rules = ""
    if uc.medicalIssues:
        rules = []
        for condition in uc.medicalIssues:
            c = condition.lower()
            if "diabetes" in c:
                rules.append("Avoid high-sugar meals; prefer low-GI foods.")
            if "hypertension" in c or "blood pressure" in c:
                rules.append("Avoid high-sodium foods; no intense HIIT without rest.")
            if "knee" in c:
                rules.append("No high-impact jumping exercises; prefer low-impact alternatives like cycling or swimming.")
            if "back" in c:
                rules.append("Avoid heavy deadlifts and spine-compressive movements; include core stabilisation work.")
            if "asthma" in c:
                rules.append("Keep cardio sessions moderate-intensity; avoid outdoor exercise in cold/dry air.")
            if "heart" in c:
                rules.append("Keep heart rate in Zone 2 only; no max-effort sprints.")
        if rules:
            medical_rules = "\n".join(f"  ⚠️  {r}" for r in rules)

    # Goal-type specific instructions
    type_instructions = {
        "gym": "Include strength training sessions (push/pull/legs split), warm-up, cooldown, and rest days. Add protein-rich meal tasks if diet is relevant.",
        "yoga": "Include morning yoga flows, breathing exercises, and evening stretches. Tasks should be calming and flexibility-focused.",
        "diet": "Focus entirely on meal tasks: breakfast, lunch, dinner, snacks. Include meal prep reminders and hydration tasks.",
        "cardio": "Include running, cycling, or HIIT sessions with warm-up and cooldown tasks. Add recovery tasks on rest days.",
    }
    type_hint = type_instructions.get(gc.type, "Create a balanced mix of workout and nutrition tasks.")

    prompt = f"""You are an elite personal trainer and nutritionist AI.

Your job is to generate a complete day-by-day schedule of ACTIONABLE DAILY TASKS for a fitness goal.

USER PROFILE:
- Age: {uc.age or 'Unknown'}
- Weight: {uc.weightKg or 'Unknown'} kg
- Fitness Level: {uc.level or 'beginner'}

GOAL DETAILS:
- Title: "{gc.title}"
- Type: {gc.type}
- Target: {gc.physiqueTarget}
- Duration: {gc.durationDays} days
- Diet Preference: {gc.dietPreference or 'None specified'}
- Extra Notes: {gc.notes or 'None'}

GOAL-TYPE GUIDANCE:
{type_hint}
"""

    if medical_rules:
        prompt += f"""
MEDICAL SAFETY DIRECTIVES (MANDATORY — DO NOT VIOLATE):
{medical_rules}
"""

    prompt += f"""
TASK GENERATION RULES:
1. Generate tasks for ALL {gc.durationDays} days. No day should be skipped.
2. Each day should have 3-5 tasks (workout + meals + recovery as appropriate).
3. Tasks must be SHORT and ACTIONABLE (max 8 words in the title).
4. scheduled_time must be realistic (e.g. workouts at 6-8 AM, meals spread across the day).
5. On rest days, still include light tasks: stretching, hydration, meal prep.
6. order starts at 1 for each day and increments per task within that day.
7. Repeat effective task patterns — don't invent more than 15 unique task types total.
"""
    return prompt


# ==========================================
# 4. MAIN ENDPOINT
# ==========================================

@app.post("/generate-schedule", response_model=ScheduleResponse)
async def generate_schedule(req: ScheduleRequest):
    try:
        model = ChatGoogleGenerativeAI(model="gemini-3-flash-preview", temperature=0.2)
        structured_model = model.with_structured_output(RawSchedule)

        system_prompt = build_system_prompt(req)

        print(f"[API] Generating schedule for goal: '{req.goal_context.title}' ({req.goal_context.durationDays} days)")

        raw: RawSchedule = structured_model.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Generate all {req.goal_context.durationDays} days of tasks now.")
        ])

        # Convert day_number → actual calendar date
        start = date.fromisoformat(req.goal_context.startDate)
        tasks: List[Task] = []

        for raw_task in raw.tasks:
            task_date = start + timedelta(days=raw_task.day_number - 1)
            tasks.append(Task(
                date=task_date.isoformat(),
                title=raw_task.title,
                scheduledTime=raw_task.scheduled_time,
                done=False,
                missed=False,
                order=raw_task.order,
            ))

        print(f"[API] ✅ Generated {len(tasks)} tasks across {req.goal_context.durationDays} days.")
        return ScheduleResponse(tasks=tasks)

    except Exception as e:
        print(f"[API] ❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# 5. HEALTH CHECK
# ==========================================

@app.get("/health")
def health():
    return {"status": "ok", "service": "FitAI Schedule Generator"}