"""
Flask API Server for FitGenie Agent Services
=============================================

Updated flow:
  1. POST /api/plans/generate        — Generate plan (no DB save), return to frontend for review
  2. POST /api/plans/feedback/<uid>  — Approve (is_satisfied=true) or give feedback & regenerate
  3. GET  /api/plans/status/<uid>    — Poll current plan state
  4. GET  /health
"""

import os
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from orchestrator import graph_app

load_dotenv()

app = Flask(__name__)
CORS(app)


# ==========================================
# HELPER: Map frontend payload -> MasterGraphState
# ==========================================
def build_graph_state(body: dict) -> dict:
    """
    Maps incoming frontend fields to the internal MasterGraphState schema.
    """
    def to_list(value):
        if value is None:
            return []
        if isinstance(value, list):
            return [str(v).strip() for v in value if v]
        return [v.strip() for v in str(value).split(",") if v.strip()]

    title       = body.get("title", "")
    notes       = body.get("notes", "")
    user_prompt = f"{title}. Additional notes: {notes}" if (title and notes) else (title or notes)

    return {
        "user_prompt":            user_prompt,
        "selected_categories":    to_list(body.get("type")),
        "primary_targets":        to_list(body.get("physiqueTarget")),
        "plan_duration_days":     int(body.get("durationDays", 7)),
        "medical_conditions":     to_list(body.get("medicalConditions")),
        "dietary_preferences":    to_list(body.get("dietPreference")),
        "start_date":             body.get("start_date", datetime.today().strftime("%Y-%m-%d")),
        "target_calories":        int(body.get("target_calories", 2000)),
        "target_protein":         int(body.get("target_protein", 100)),
        "days_per_week":          int(body.get("days_per_week", 3)),
        "fitness_level":          body.get("fitness_level", "Beginner"),
        "available_equipment":    to_list(body.get("available_equipment")),
        "preferred_times":        body.get("preferredTimes"),
        "meal_user_context":      None,
        "exercise_user_context":  None,
        "generated_meal_plan":    None,
        "generated_workout_plan": None,
        "grocery_list":           None,
        "equipment_needed":       None,
        "route_to_meal":          None,
        "route_to_exercise":      None,
        "is_satisfied":           None,
        "meal_feedback":          None,
        "exercise_feedback":      None,
    }


def extract_plan_from_state(state: dict) -> dict:
    """
    Pull the plan fields out of the LangGraph state snapshot and return
    them in the shape the frontend / Node backend expects.
    """
    return {
        "meal_plan":        state.get("generated_meal_plan") or [],
        "workout_plan":     state.get("generated_workout_plan") or [],
        "grocery_list":     state.get("grocery_list") or [],
        "equipment_needed": state.get("equipment_needed") or [],
    }


# ==========================================
# ROUTE 1: Generate a New Plan (no DB save)
# POST /api/plans/generate
# ==========================================
@app.route("/api/plans/generate", methods=["POST"])
def generate_plans():
    """
    Runs the LangGraph agents and returns the generated plan to the caller
    (Node.js backend). Nothing is saved to MongoDB here — the Node backend
    forwards the plan to the frontend, the user reviews it, and only upon
    approval does the Node backend write to MongoDB via POST /goals/confirm.

    Expected body:
    {
        "userId":            "abc123",
        "title":             "Wedding prep plan",
        "type":              "gym",
        "physiqueTarget":    "Lose Weight",
        "durationDays":      7,
        "medicalConditions": ["Knee Injury"],
        "dietPreference":    ["vegetarian"],
        "notes":             "Prefer morning workouts",
        "start_date":        "2026-04-25",
        "target_calories":   2000,
        "target_protein":    150,
        "days_per_week":     4,
        "fitness_level":     "Beginner",
        "available_equipment": []
    }

    Returns:
    {
        "status":           "awaiting_feedback",
        "userId":           "abc123",
        "threadId":         "abc123",
        "meal_plan":        [...],
        "workout_plan":     [...],
        "grocery_list":     [...],
        "equipment_needed": [...]
    }
    """
    body = request.get_json(force=True)

    thread_id = body.get("threadId")
    if not thread_id:
        return jsonify({"error": "threadId is required"}), 400

    # One thread per user — reused across regenerations for the same session.
    # If you want per-plan isolation, append a counter: f"{user_id}_{counter}"
    # thread_id = str(user_id)
    config    = {"configurable": {"thread_id": thread_id}}

    graph_state = build_graph_state(body)

    try:
        print(f"\n[Server] Generating plan — thread: {thread_id}")
        for event in graph_app.stream(graph_state, config=config):
            print(f"  [event] {list(event.keys())}")

        current_state = graph_app.get_state(config).values
        plan          = extract_plan_from_state(current_state)

        print(f"[Server] Generation complete — meal days: {len(plan['meal_plan'])}, "
              f"workout days: {len(plan['workout_plan'])}")

        return jsonify({
            "status":           "awaiting_feedback",
            # "userId":           user_id,
            "threadId":         thread_id,
            **plan,
        }), 200

    except Exception as e:
        print(f"[Server] ERROR during generation: {e}")
        return jsonify({"error": str(e)}), 500


# ==========================================
# ROUTE 2: Submit Feedback or Approve
# POST /api/plans/feedback/<thread_id>
# ==========================================
@app.route("/api/plans/feedback/<thread_id>", methods=["POST"])
def submit_feedback(thread_id):
    """
    Two sub-cases:

    A) User is satisfied — frontend (PlanFeedback.tsx) calls this before
       also calling the Node backend's POST /goals/confirm to save to MongoDB.
       Body: { "is_satisfied": true }

    B) User wants changes — agents regenerate the plan and return the
       updated version. Frontend shows it again for another review round.
       Body: {
           "is_satisfied":     false,
           "meal_feedback":    "Less chicken, more vegetarian",   // optional
           "exercise_feedback": "No jumping, add core work"        // optional
       }

    Returns (case A — approved):
    { "status": "approved", "message": "...", "userId": "..." }

    Returns (case B — regenerated):
    {
        "status":           "awaiting_feedback",
        "message":          "Plans regenerated with your feedback.",
        "userId":           "...",
        "meal_plan":        [...],
        "workout_plan":     [...],
        "grocery_list":     [...],
        "equipment_needed": [...]
    }
    """
    body      = request.get_json(force=True)
    thread_id = str(thread_id)
    config    = {"configurable": {"thread_id": thread_id}}

    try:
        # ── Case A: User approved the plan ──────────────────────────────────
        if body.get("is_satisfied"):
            graph_app.update_state(
                config,
                {"is_satisfied": True},
                as_node="human_review"
            )
            # Resume graph so it can reach END cleanly
            for event in graph_app.stream(None, config=config):
                pass

            print(f"[Server] Plan approved — thread: {thread_id}")
            return jsonify({
                "status":  "approved",
                "message": "Plan approved. Saving to database.",
                # "userId":  user_id,
            }), 200

        # ── Case B: User wants changes ───────────────────────────────────────
        meal_feedback     = body.get("meal_feedback") or None
        exercise_feedback = body.get("exercise_feedback") or None

        if not meal_feedback and not exercise_feedback:
            return jsonify({
                "error": "Provide at least one of meal_feedback or exercise_feedback, "
                         "or set is_satisfied to true."
            }), 400

        graph_app.update_state(
            config,
            {
                "is_satisfied":     False,
                "meal_feedback":     meal_feedback,
                "exercise_feedback": exercise_feedback,
            },
            as_node="human_review"
        )

        print(f"[Server] Regenerating plan with feedback — thread: {thread_id}")
        print(f"  meal_feedback:     {meal_feedback}")
        print(f"  exercise_feedback: {exercise_feedback}")

        for event in graph_app.stream(None, config=config):
            print(f"  [event] {list(event.keys())}")

        updated_state = graph_app.get_state(config).values
        plan          = extract_plan_from_state(updated_state)

        print(f"[Server] Regeneration complete — meal days: {len(plan['meal_plan'])}, "
              f"workout days: {len(plan['workout_plan'])}")

        return jsonify({
            "status":           "awaiting_feedback",
            "message":          "Plans regenerated with your feedback.",
            # "userId":           user_id,
            **plan,
        }), 200

    except Exception as e:
        print(f"[Server] ERROR during feedback/regeneration: {e}")
        return jsonify({"error": str(e)}), 500


# ==========================================
# ROUTE 3: Poll Current Plan State
# GET /api/plans/status/<user_id>
# ==========================================


@app.route("/api/plans/status/<user_id>", methods=["GET"])
def get_plan_status(user_id):
    """
    Returns the current state of the plan for a user's active thread.
    Useful for polling or debugging.

    Returns:
    {
        "status":           "awaiting_feedback" | "in_progress" | "approved",
        "userId":           "...",
        "meal_plan":        [...],
        "workout_plan":     [...],
        "grocery_list":     [...],
        "equipment_needed": [...]
    }
    """
    thread_id = str(user_id)
    config    = {"configurable": {"thread_id": thread_id}}

    try:
        snapshot = graph_app.get_state(config)
        if not snapshot or not snapshot.values:
            return jsonify({
                "error": f"No active plan found for user {user_id}. "
                         "Generate one first via POST /api/plans/generate."
            }), 404

        s = snapshot.values

        if s.get("is_satisfied"):
            status = "approved"
        elif snapshot.next and "human_review" in snapshot.next:
            status = "awaiting_feedback"
        else:
            status = "in_progress"

        return jsonify({
            "status": status,
            "userId": user_id,
            **extract_plan_from_state(s),
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================================
# HEALTH CHECK
# GET /health
# ==========================================
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "FitGenie Agent API"}), 200


# ==========================================
# ENTRY POINT
# ==========================================
@app.route("/chat-reply", methods=["POST"])
def chat_reply():
    """
    Chat endpoint - receives a message and returns a dummy response.
    Will be replaced with a dedicated chat service later.
    """
    body = request.get_json(force=True)
    user_message = body.get("message", "")

    if not user_message:
        return jsonify({"error": "message field is required"}), 400

    print(f"\n[Chat] Received message: {user_message}")
    
    # For now, just return a dummy response
    ai_response = f"Thanks for your message: {user_message}. Chat service coming soon!"

    return jsonify({"message": ai_response}), 200
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8003))
    print(f"\n[Server] FitGenie Agent API running on http://localhost:{port}")
    print("[Server] Endpoints:")
    print("  POST /api/plans/generate           — Generate plan (no DB save)")
    print("  POST /api/plans/feedback/<user_id> — Approve or give feedback & regenerate")
    print("  GET  /api/plans/status/<user_id>   — Poll current plan state")
    print("  GET  /health\n")
    app.run(host="0.0.0.0", port=port, debug=False)