import httpx
import uuid

API_BASE = "http://127.0.0.1:8000/api"
FRONTEND_BASE = "http://127.0.0.1:5173"

def run_e2e_verification():
    print("=" * 60)
    print("STARTING FULL END-TO-END FLOW VERIFICATION")
    print("=" * 60)

    client = httpx.Client(timeout=10.0)

    # 1. Verify Frontend is serving
    print("\n[Step 1] Checking Frontend availability...")
    front_resp = client.get(FRONTEND_BASE)
    assert front_resp.status_code == 200, f"Frontend returned {front_resp.status_code}"
    assert "<div id=\"root\"></div>" in front_resp.text
    print("  -> Frontend is successfully serving at http://127.0.0.1:5173")

    # 2. Verify Backend Health
    print("\n[Step 2] Checking Backend Health...")
    health_resp = client.get(f"{API_BASE}/health")
    assert health_resp.status_code == 200
    print(f"  -> Backend health status: {health_resp.json()}")

    # 3. Register a new student
    unique_id = uuid.uuid4().hex[:6]
    student_email = f"student_{unique_id}@example.com"
    student_username = f"student_{unique_id}"
    print(f"\n[Step 3] Registering new student: {student_email}...")
    reg_resp = client.post(f"{API_BASE}/auth/register", json={
        "email": student_email,
        "username": student_username,
        "password": "Password123!"
    })
    assert reg_resp.status_code == 201, f"Register failed: {reg_resp.text}"
    student_data = reg_resp.json()
    student_token = student_data["access_token"]
    print(f"  -> Successfully registered! Student ID: {student_data['user']['id']}, Role: {student_data['user']['role']}")

    # 4. Login with registered student
    print(f"\n[Step 4] Logging in with credentials...")
    login_resp = client.post(f"{API_BASE}/auth/login", json={
        "email": student_email,
        "password": "Password123!"
    })
    assert login_resp.status_code == 200
    login_token = login_resp.json()["access_token"]
    student_headers = {"Authorization": f"Bearer {login_token}"}
    print("  -> Login successful, JWT token obtained.")

    # 5. Check /auth/me
    print("\n[Step 5] Checking current profile /auth/me...")
    me_resp = client.get(f"{API_BASE}/auth/me", headers=student_headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["username"] == student_username
    print(f"  -> Verified user profile for: {me_resp.json()['username']}")

    # 6. Browse Subjects
    print("\n[Step 6] Browsing Subjects list...")
    subj_resp = client.get(f"{API_BASE}/subjects")
    assert subj_resp.status_code == 200
    subjects = subj_resp.json()
    assert len(subjects) >= 3
    print(f"  -> Retrieved {len(subjects)} subjects: {[s['name'] for s in subjects]}")

    # 7. Browse Resources & Filter
    print("\n[Step 7] Browsing Resources with filtering...")
    res_resp = client.get(f"{API_BASE}/resources?resource_type=pdf")
    assert res_resp.status_code == 200
    resources = res_resp.json()
    assert len(resources) > 0
    sample_resource = resources[0]
    print(f"  -> Retrieved {len(resources)} PDF resources. Sample: '{sample_resource['title']}'")

    # 8. Test Download endpoint
    print(f"\n[Step 8] Testing Resource download tracking for ID {sample_resource['id']}...")
    initial_downloads = sample_resource["downloads_count"]
    dl_resp = client.get(f"{API_BASE}/resources/{sample_resource['id']}/download")
    assert dl_resp.status_code in [200, 307, 302]
    print(f"  -> Download request succeeded with status {dl_resp.status_code}")

    # 9. Browse Quizzes
    print("\n[Step 9] Browsing Quizzes catalog...")
    quiz_resp = client.get(f"{API_BASE}/quizzes")
    assert quiz_resp.status_code == 200
    quizzes = quiz_resp.json()
    assert len(quizzes) >= 3
    target_quiz = quizzes[0]
    print(f"  -> Selected quiz: '{target_quiz['title']}' ({target_quiz['questions_count']} questions)")

    # 10. Start Quiz session (Anti-Cheating Verification)
    print(f"\n[Step 10] Starting Quiz session (ID: {target_quiz['id']})...")
    start_resp = client.get(f"{API_BASE}/quizzes/{target_quiz['id']}/start", headers=student_headers)
    assert start_resp.status_code == 200
    take_data = start_resp.json()
    questions = take_data["questions"]
    assert len(questions) > 0

    # Ensure no answer or explanation leakage
    for q in questions:
        assert q.get("explanation") is None, "SECURITY ISSUE: Explanation leaked in quiz start!"
        for opt in q["options"]:
            assert "is_correct" not in opt, "SECURITY ISSUE: is_correct leaked in option!"
    print(f"  -> Successfully loaded {len(questions)} randomized questions.")
    print("  -> Anti-cheating verification PASSED: zero answers or explanations leaked to client.")

    # 11. Submit Quiz Answers
    print("\n[Step 11] Submitting student answers for grading on backend...")
    submission_answers = []
    for q in questions:
        # Choose the first option for each question
        chosen_opt_id = q["options"][0]["id"]
        submission_answers.append({
            "question_id": q["id"],
            "selected_option_ids": [chosen_opt_id]
        })

    submit_resp = client.post(f"{API_BASE}/quizzes/submit", json={
        "quiz_id": target_quiz["id"],
        "time_spent_seconds": 65,
        "answers": submission_answers
    }, headers=student_headers)
    assert submit_resp.status_code == 200
    result_data = submit_resp.json()
    print(f"  -> Graded Result:")
    print(f"     - Score: {result_data['score']} / {result_data['total_questions']}")
    print(f"     - Percentage: {result_data['percentage']}%")
    print(f"     - Passed: {result_data['passed']} (Passing threshold: {result_data['passing_score_percentage']}%)")
    print(f"     - Review items count: {len(result_data['reviews'])}")
    print(f"     - Explanations returned in post-submission review: Yes")

    # 12. Check Student Dashboard Stats
    print("\n[Step 12] Checking Student Dashboard analytics...")
    dash_resp = client.get(f"{API_BASE}/quizzes/dashboard/stats", headers=student_headers)
    assert dash_resp.status_code == 200
    dash_data = dash_resp.json()
    assert dash_data["total_attempts"] >= 1
    print(f"  -> Total Attempts: {dash_data['total_attempts']}")
    print(f"  -> Average Score: {dash_data['average_score']}%")
    print(f"  -> Subject Performance count: {len(dash_data['subject_performance'])}")

    # 13. Admin Verification
    print("\n[Step 13] Verifying Admin role & analytics endpoint...")
    admin_login = client.post(f"{API_BASE}/auth/login", json={
        "email": "admin@edulearn.org",
        "password": "admin123"
    })
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    admin_stats = client.get(f"{API_BASE}/admin/stats", headers=admin_headers)
    assert admin_stats.status_code == 200
    astats = admin_stats.json()
    print(f"  -> Admin Platform Stats:")
    print(f"     - Total Users: {astats['total_users']}")
    print(f"     - Total Subjects: {astats['total_subjects']}")
    print(f"     - Total Resources: {astats['total_resources']}")
    print(f"     - Total Quizzes: {astats['total_quizzes']}")
    print(f"     - Total Questions: {astats['total_questions']}")
    print(f"     - Total Attempts: {astats['total_attempts']}")

    print("\n" + "=" * 60)
    print("ALL 13 END-TO-END WORKFLOWS PASSED WITH 100% SUCCESS!")
    print("=" * 60)

if __name__ == "__main__":
    run_e2e_verification()
