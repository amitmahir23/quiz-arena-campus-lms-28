from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import google.generativeai as genai
from config import SUPABASE_URL, SUPABASE_HEADERS, GEMINI_API_KEY
import time

# Configure Gemini with error handling
try:
    genai.configure(api_key=GEMINI_API_KEY)
    # Use gemini-1.5-flash instead of pro for better rate limits
    model = genai.GenerativeModel("gemini-1.5-flash")
except Exception as e:
    print(f"Error configuring Gemini: {e}")
    model = None

app = Flask(__name__)
CORS(app)


# Add home route to fix 404 error
@app.route("/")
def home():
    return """
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
        <h1>🎓 Student LMS API</h1>
        <p>Your Flask API is running successfully!</p>
        <h3>Available Endpoints:</h3>
        <ul>
            <li><strong>POST /fetch</strong> - Get student progress, deadlines, quizzes, goals, and streaks</li>
            <li><strong>POST /chat_with_data</strong> - Chat with AI assistant about your academic data</li>
            <li><strong>POST /leaderboard</strong> - Get course leaderboard</li>
        </ul>
        <p><em>Use these endpoints from your frontend application or API testing tool.</em></p>
    </div>
    """


def get_progress(student_id):
    try:
        url = f"{SUPABASE_URL}/progress?student_id=eq.{student_id}"
        res = requests.get(url, headers=SUPABASE_HEADERS, timeout=10)
        res.raise_for_status()
        data = res.json()
        if not data:
            return "📊 No progress data found."

        result = "📊 Progress Report:\n"
        for item in data:
            percent = round((item["completed_modules"] / item["total_modules"]) * 100)
            result += f"- {item['course_name']}: {percent}% complete\n"
        return result
    except requests.exceptions.RequestException as e:
        return f"⚠️ Database connection error: {str(e)}"
    except Exception as e:
        return f"❌ Error fetching progress: {str(e)}"


def get_deadlines(student_id):
    try:
        url = f"{SUPABASE_URL}/deadlines?student_id=eq.{student_id}"
        res = requests.get(url, headers=SUPABASE_HEADERS, timeout=10)
        res.raise_for_status()
        data = res.json()
        if not data:
            return "📅 No upcoming deadlines."

        result = "📅 Upcoming Deadlines:\n"
        for item in data:
            result += f"- {item['course_name']}: {item['task']} due on {item['due_date']}\n"
        return result
    except requests.exceptions.RequestException as e:
        return f"⚠️ Database connection error: {str(e)}"
    except Exception as e:
        return f"❌ Error fetching deadlines: {str(e)}"


def get_quiz_feedback(student_id):
    try:
        url = f"{SUPABASE_URL}/quizzes?student_id=eq.{student_id}"
        res = requests.get(url, headers=SUPABASE_HEADERS, timeout=10)
        res.raise_for_status()
        data = res.json()
        if not data:
            return "🧪 No quiz data found."

        result = "🧪 Quiz Performance:\n"
        course_scores = {}
        for item in data:
            course = item["course_name"]
            score = item["score"]
            course_scores.setdefault(course, []).append(score)

        for course, scores in course_scores.items():
            avg = round(sum(scores) / len(scores))
            result += f"- {course}: Avg {avg}% from {len(scores)} quizzes\n"
            if avg < 70:
                result += "⚠️ Consider reviewing concepts.\n"
        return result
    except requests.exceptions.RequestException as e:
        return f"⚠️ Database connection error: {str(e)}"
    except Exception as e:
        return f"❌ Error fetching quizzes: {str(e)}"


def get_goal(student_id):
    try:
        url = f"{SUPABASE_URL}/goals?student_id=eq.{student_id}"
        res = requests.get(url, headers=SUPABASE_HEADERS, timeout=10)
        res.raise_for_status()
        data = res.json()
        if not data:
            return "🎯 No goal set for today."
        return f"🎯 Today's Goal: {data[0]['goal']}"
    except requests.exceptions.RequestException as e:
        return f"⚠️ Database connection error: {str(e)}"
    except Exception as e:
        return f"❌ Error fetching goal: {str(e)}"


def get_streak(student_id):
    try:
        url = f"{SUPABASE_URL}/streaks?student_id=eq.{student_id}"
        res = requests.get(url, headers=SUPABASE_HEADERS, timeout=10)
        res.raise_for_status()
        data = res.json()
        if not data:
            return "Let's start a study streak today 💪"

        streak = data[0]["streak"]
        if streak >= 3:
            return f"🔥 You're on a {streak}-day study streak! Keep it going!"
        elif streak > 0:
            return f"✅ {streak}-day streak started. Stay consistent!"
        else:
            return "Let's start a study streak today 💪"
    except requests.exceptions.RequestException as e:
        return f"⚠️ Database connection error: {str(e)}"
    except Exception as e:
        return f"❌ Error fetching streak: {str(e)}"


def get_leaderboard(course_name):
    try:
        url = f"{SUPABASE_URL}/leaderboard?course_name=eq.{course_name}&order=score.desc"
        res = requests.get(url, headers=SUPABASE_HEADERS, timeout=10)
        res.raise_for_status()
        data = res.json()
        if not data:
            return f"🏆 No leaderboard data for {course_name}."
        result = f"🏆 {course_name} Leaderboard:\n"
        for i, entry in enumerate(data, start=1):
            result += f"{i}. {entry['name']} - {entry['score']}%\n"
        return result
    except requests.exceptions.RequestException as e:
        return f"⚠️ Database connection error: {str(e)}"
    except Exception as e:
        return f"❌ Error fetching leaderboard: {str(e)}"


def chatbot_with_data(user_input, student_id, data_blocks):
    # If Gemini is not available, return a simple response
    if model is None:
        return f"🤖 AI assistant is temporarily unavailable. Here's your current data:\n\n" + "\n\n".join(data_blocks)
    
    info = "\n\n".join(data_blocks)

    prompt = f"""
    You are a helpful academic assistant. A student has asked you a question. 
    Use the info below to respond accurately and kindly. Keep responses concise.

    Student ID: {student_id}
    Question: "{user_input}"

    Info:
    {info}
    """

    try:
        # Add delay to avoid rate limiting
        time.sleep(1)
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        error_str = str(e).lower()
        if "resourceexhausted" in error_str or "429" in error_str or "quota" in error_str:
            return f"🤖 AI assistant is temporarily busy due to high usage. Here's your data summary instead:\n\n{info}"
        elif "authentication" in error_str or "401" in error_str:
            return "🤖 AI service authentication issue. Please check API configuration."
        else:
            return f"🤖 AI assistant error. Here's your data summary:\n\n{info}"


@app.route("/fetch", methods=["POST"])
def fetch_data():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
            
        student_id = data.get("student_id")
        if not student_id:
            return jsonify({"error": "Missing student_id"}), 400

        progress = get_progress(student_id)
        deadlines = get_deadlines(student_id)
        quizzes = get_quiz_feedback(student_id)
        goal = get_goal(student_id)
        streak = get_streak(student_id)

        return jsonify({
            "progress": progress,
            "deadlines": deadlines,
            "quizzes": quizzes,
            "goal": goal,
            "streak": streak
        })
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500


@app.route("/chat_with_data", methods=["POST"])
def chat_with_data():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
            
        student_id = data.get("student_id")
        user_input = data.get("message")

        if not student_id or not user_input:
            return jsonify({"error": "Missing student_id or message"}), 400

        # Auto-gather all data for richer response
        progress = get_progress(student_id)
        deadlines = get_deadlines(student_id)
        quizzes = get_quiz_feedback(student_id)
        goal = get_goal(student_id)
        streak = get_streak(student_id)

        blocks = [progress, deadlines, quizzes, goal, streak]
        response = chatbot_with_data(user_input, student_id, blocks)

        return jsonify({"response": response})
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500


@app.route("/leaderboard", methods=["POST"])
def leaderboard():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
            
        course_name = data.get("course_name")
        if not course_name:
            return jsonify({"error": "Missing course_name"}), 400
            
        leaderboard_data = get_leaderboard(course_name)
        return jsonify({"leaderboard": leaderboard_data})
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500


# Health check endpoint
@app.route("/health")
def health():
    return jsonify({
        "status": "healthy",
        "gemini_available": model is not None,
        "timestamp": time.time()
    })


if __name__ == "__main__":
    print("🚀 Starting Student LMS API...")
    print("🌐 Visit http://127.0.0.1:5000 to see available endpoints")
    print("🔧 Use POST requests to interact with the API")
    app.run(debug=True)