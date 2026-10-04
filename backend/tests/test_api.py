import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_auth_login_admin():
    response = client.post("/api/auth/login", json={
        "email": "admin@edulearn.org",
        "password": "admin123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "admin"

def test_auth_login_student():
    response = client.post("/api/auth/login", json={
        "email": "student@edulearn.org",
        "password": "student123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "student"

def test_auth_register_and_login():
    unique_id = uuid.uuid4().hex[:8]
    email = f"user_{unique_id}@example.com"
    username = f"user_{unique_id}"

    reg_response = client.post("/api/auth/register", json={
        "email": email,
        "username": username,
        "password": "secretpassword123"
    })
    assert reg_response.status_code == 201
    data = reg_response.json()
    assert data["user"]["email"] == email
    token = data["access_token"]

    me_response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 200
    assert me_response.json()["username"] == username

def test_get_subjects():
    response = client.get("/api/subjects")
    assert response.status_code == 200
    subjects = response.json()
    assert len(subjects) >= 3
    codes = [s["code"] for s in subjects]
    assert "MATH" in codes
    assert "PHYS" in codes
    assert "CS" in codes

def test_get_resources():
    response = client.get("/api/resources")
    assert response.status_code == 200
    resources = response.json()
    assert len(resources) >= 10

    # Test filtering by resource type
    pdf_response = client.get("/api/resources?resource_type=pdf")
    assert pdf_response.status_code == 200
    pdfs = pdf_response.json()
    assert len(pdfs) > 0
    assert all(r["resource_type"] == "pdf" for r in pdfs)

def test_quiz_flow_and_anti_cheating():
    # 1. Login student
    login_resp = client.post("/api/auth/login", json={
        "email": "student@edulearn.org",
        "password": "student123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get quizzes list
    q_list_resp = client.get("/api/quizzes")
    assert q_list_resp.status_code == 200
    quizzes = q_list_resp.json()
    assert len(quizzes) >= 3
    quiz_id = quizzes[0]["id"]

    # 3. Start quiz
    start_resp = client.get(f"/api/quizzes/{quiz_id}/start", headers=headers)
    assert start_resp.status_code == 200
    take_data = start_resp.json()
    assert "questions" in take_data
    assert len(take_data["questions"]) > 0

    # CRITICAL SECURITY CHECK:
    # Ensure is_correct and explanation are NOT returned in start_quiz response!
    for q in take_data["questions"]:
        assert "explanation" not in q or q.get("explanation") is None
        for opt in q["options"]:
            assert "is_correct" not in opt

    # 4. Submit answers
    answers = []
    for q in take_data["questions"]:
        first_opt_id = q["options"][0]["id"]
        answers.append({
            "question_id": q["id"],
            "selected_option_ids": [first_opt_id]
        })

    submit_resp = client.post("/api/quizzes/submit", json={
        "quiz_id": quiz_id,
        "time_spent_seconds": 45,
        "answers": answers
    }, headers=headers)

    assert submit_resp.status_code == 200
    result = submit_resp.json()
    assert "score" in result
    assert "percentage" in result
    assert "passed" in result
    assert "reviews" in result
    assert len(result["reviews"]) == len(answers)

    # 5. Check student dashboard stats
    dash_resp = client.get("/api/quizzes/dashboard/stats", headers=headers)
    assert dash_resp.status_code == 200
    stats = dash_resp.json()
    assert stats["total_attempts"] >= 1

def test_admin_stats():
    login_resp = client.post("/api/auth/login", json={
        "email": "admin@edulearn.org",
        "password": "admin123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    stats_resp = client.get("/api/admin/stats", headers=headers)
    assert stats_resp.status_code == 200
    data = stats_resp.json()
    assert data["total_users"] >= 2
    assert data["total_subjects"] >= 3
    assert data["total_resources"] >= 10
    assert data["total_quizzes"] >= 3
