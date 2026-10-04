import io
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_admin_token():
    login_resp = client.post("/api/auth/login", json={
        "email": "admin@edulearn.org",
        "password": "admin123"
    })
    return login_resp.json()["access_token"]

def test_admin_create_quiz_and_question():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Get subjects
    subj_resp = client.get("/api/subjects")
    subject_id = subj_resp.json()[0]["id"]

    # 2. Create quiz
    create_quiz_resp = client.post("/api/admin/quizzes", json={
        "title": "Quantum Physics Intro",
        "description": "Fundamental quantum mechanics principles",
        "subject_id": subject_id,
        "duration_minutes": 10,
        "passing_score_percentage": 50,
        "is_published": True,
        "questions": [
            {
                "text": "What is Planck's constant approximately?",
                "explanation": "Planck constant h is approximately 6.626 x 10^-34 J*s.",
                "question_type": "single",
                "options": [
                    {"text": "6.626 x 10^-34 J*s", "is_correct": True},
                    {"text": "3.00 x 10^8 m/s", "is_correct": False},
                    {"text": "1.602 x 10^-19 C", "is_correct": False}
                ]
            }
        ]
    }, headers=headers)
    assert create_quiz_resp.status_code == 201
    quiz_data = create_quiz_resp.json()
    quiz_id = quiz_data["id"]
    assert quiz_data["title"] == "Quantum Physics Intro"
    assert len(quiz_data["questions"]) == 1

    # 3. Add question to quiz
    add_q_resp = client.post(f"/api/admin/quizzes/{quiz_id}/questions", json={
        "text": "Which phenomena illustrate wave-particle duality?",
        "explanation": "Both the photoelectric effect and electron diffraction demonstrate duality.",
        "question_type": "multiple",
        "options": [
            {"text": "Photoelectric effect", "is_correct": True},
            {"text": "Electron diffraction", "is_correct": True},
            {"text": "Classical planetary motion", "is_correct": False}
        ]
    }, headers=headers)
    assert add_q_resp.status_code == 201

    # 4. Test Bulk Import JSON
    bulk_json_resp = client.post(f"/api/admin/quizzes/{quiz_id}/bulk-import-json", json=[
        {
            "text": "What is the Schrodinger equation?",
            "explanation": "A linear partial differential equation governing the wave function of a quantum-mechanical system.",
            "question_type": "single",
            "options": [
                {"text": "Wave equation of quantum mechanics", "is_correct": True},
                {"text": "Gravitational law", "is_correct": False}
            ]
        }
    ], headers=headers)
    assert bulk_json_resp.status_code == 200
    assert bulk_json_resp.json()["imported_count"] == 1

    # 5. Test Bulk Import CSV
    csv_content = (
        "question,type,explanation,opt1,c1,opt2,c2\n"
        "What is spin?,single,Intrinsic angular momentum,Intrinsic angular momentum,true,Orbital velocity,false\n"
    )
    files = {"file": ("test.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    bulk_csv_resp = client.post(f"/api/admin/quizzes/{quiz_id}/bulk-import-csv", files=files, headers=headers)
    assert bulk_csv_resp.status_code == 200
    assert bulk_csv_resp.json()["imported_count"] == 1

    # 6. Verify quiz now has 4 questions
    quiz_check = client.get(f"/api/admin/quizzes/{quiz_id}", headers=headers)
    assert quiz_check.status_code == 200
    assert len(quiz_check.json()["questions"]) == 4

    # 7. Clean up: Delete the test quiz
    del_resp = client.delete(f"/api/admin/quizzes/{quiz_id}", headers=headers)
    assert del_resp.status_code == 204
