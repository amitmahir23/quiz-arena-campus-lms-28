
import google.generativeai as genai
import requests

genai.configure(api_key="AIzaSyA_YKJD1mTup6LcwuT5EHCJW3f-ZT6TBtU")
model = genai.GenerativeModel(model_name="gemini-1.5-pro")

BACKEND_API = "https://quiz-arena-campus-lms-28.onrender.com"

def chatbot_with_data(user_input, student_id, progress_data, deadline_data):
    prompt = f"""
    You are a helpful academic chatbot. Answer this student based on their info.
	Please don't use asterisks. Give clean output.

    ID: {student_id}
    Question: {user_input}
    Info:
    📊 Progress Report:
    {progress_data}

    📅 Upcoming Deadlines:
    {deadline_data}
    """
    response = model.generate_content(prompt)
    return response.text.strip()
