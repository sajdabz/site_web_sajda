import os
import sys

# Add parent directory to path so script can be run directly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.core.config import settings
from app.models.user import User
from app.models.subject import Subject
from app.models.resource import Resource
from app.models.quiz import Quiz
from app.models.question import Question
from app.models.option import Option
from app.models.attempt import QuizAttempt

def seed_database():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Create dummy sample PDF file in uploads
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        sample_pdf_filename = "calculus_quick_reference.pdf"
        sample_pdf_path = os.path.join(settings.UPLOAD_DIR, sample_pdf_filename)
        if not os.path.exists(sample_pdf_path):
            # A minimal valid PDF file header/trailer
            pdf_bytes = (
                b"%PDF-1.4\n"
                b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
                b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
                b"3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\n"
                b"xref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000053 00000 n \n0000000102 00000 n \n"
                b"trailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n"
            )
            with open(sample_pdf_path, "wb") as f:
                f.write(pdf_bytes)

        algo_pdf_filename = "data_structures_cheatsheet.pdf"
        algo_pdf_path = os.path.join(settings.UPLOAD_DIR, algo_pdf_filename)
        if not os.path.exists(algo_pdf_path):
            with open(algo_pdf_path, "wb") as f:
                f.write(pdf_bytes)

        # 1. Users (Admin and Student)
        admin_email = "admin@edulearn.org"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin = User(
                email=admin_email,
                username="admin",
                hashed_password=get_password_hash("admin123"),
                role="admin",
                is_active=True
            )
            db.add(admin)
            print(f"Created admin account: {admin_email} / admin123")

        student_email = "student@edulearn.org"
        student = db.query(User).filter(User.email == student_email).first()
        if not student:
            student = User(
                email=student_email,
                username="student",
                hashed_password=get_password_hash("student123"),
                role="student",
                is_active=True
            )
            db.add(student)
            print(f"Created student account: {student_email} / student123")

        db.commit()

        # 2. Subjects (3 subjects: Mathematics, Physics, Computer Science)
        subjects_data = [
            {
                "name": "Mathematics",
                "code": "MATH",
                "description": "Calculus, Linear Algebra, Probability, and Discrete Mathematics for engineers and scientists.",
                "level": "Undergraduate",
                "icon": "calculator",
                "color": "indigo"
            },
            {
                "name": "Physics",
                "code": "PHYS",
                "description": "Classical Mechanics, Electromagnetism, Thermodynamics, Optics and Quantum Fundamentals.",
                "level": "College & Prep",
                "icon": "atom",
                "color": "sky"
            },
            {
                "name": "Computer Science",
                "code": "CS",
                "description": "Data Structures, Algorithms, Software Engineering, Python Programming and System Design.",
                "level": "All Levels",
                "icon": "code",
                "color": "emerald"
            }
        ]

        subject_objs = {}
        for s_data in subjects_data:
            subj = db.query(Subject).filter(Subject.code == s_data["code"]).first()
            if not subj:
                subj = Subject(**s_data)
                db.add(subj)
                db.commit()
                db.refresh(subj)
            subject_objs[s_data["code"]] = subj

        # 3. 10 Resources
        resources_data = [
            {
                "title": "Comprehensive Calculus Cheat Sheet",
                "description": "Complete derivatives, integrals, Taylor series and vector calculus formulas in one single printable sheet.",
                "resource_type": "pdf",
                "subject_id": subject_objs["MATH"].id,
                "file_path": sample_pdf_filename,
                "file_name": "Calculus_Cheat_Sheet.pdf",
                "file_size_bytes": 1024,
                "downloads_count": 42
            },
            {
                "title": "Linear Algebra & Matrix Transformations Explained",
                "description": "Essence of Linear Algebra video lecture series covering eigenvalues, eigenvectors and span visually.",
                "resource_type": "video",
                "subject_id": subject_objs["MATH"].id,
                "external_url": "https://www.youtube.com/watch?v=fNk_zzaMoSs"
            },
            {
                "title": "Introduction to Real Analysis & Proofs",
                "description": "Clear step-by-step article explaining delta-epsilon proofs, sequences, convergence and supremum.",
                "resource_type": "article",
                "subject_id": subject_objs["MATH"].id,
                "external_url": "https://en.wikipedia.org/wiki/Real_analysis"
            },
            {
                "title": "Probability & Statistics for Data Science",
                "description": "Key discrete and continuous distributions: Gaussian, Binomial, Poisson and Central Limit Theorem summary.",
                "resource_type": "article",
                "subject_id": subject_objs["MATH"].id,
                "external_url": "https://towardsdatascience.com"
            },
            {
                "title": "Classical Mechanics: Newton's Laws & Conservation Principles",
                "description": "Foundational course summary covering momentum, kinetic energy, angular momentum and harmonic oscillators.",
                "resource_type": "pdf",
                "subject_id": subject_objs["PHYS"].id,
                "file_path": sample_pdf_filename,
                "file_name": "Classical_Mechanics_Summary.pdf",
                "file_size_bytes": 1024,
                "downloads_count": 28
            },
            {
                "title": "Electromagnetism: Maxwell's Equations Visualized",
                "description": "In-depth interactive video explaining electric flux, Gauss's law, Faraday's law and Ampere's law.",
                "resource_type": "video",
                "subject_id": subject_objs["PHYS"].id,
                "external_url": "https://www.youtube.com/watch?v=rB83DpBJQsE"
            },
            {
                "title": "Thermodynamics & Heat Engines Guide",
                "description": "Understanding the First and Second Laws of Thermodynamics, Carnot efficiency and Entropy.",
                "resource_type": "article",
                "subject_id": subject_objs["PHYS"].id,
                "external_url": "https://openstax.org/books/university-physics-volume-2"
            },
            {
                "title": "Data Structures & Big-O Complexity Quick Guide",
                "description": "Master array, linked list, hash map, binary search tree, heap and graph time & space complexities.",
                "resource_type": "pdf",
                "subject_id": subject_objs["CS"].id,
                "file_path": algo_pdf_filename,
                "file_name": "Big_O_Cheat_Sheet.pdf",
                "file_size_bytes": 1024,
                "downloads_count": 95
            },
            {
                "title": "Modern Python 3 & Design Patterns Crash Course",
                "description": "Video walkthrough of Python best practices, OOP, decorators, generators, and async programming.",
                "resource_type": "video",
                "subject_id": subject_objs["CS"].id,
                "external_url": "https://www.youtube.com/watch?v=eWRfhZUzrAc"
            },
            {
                "title": "System Design & REST API Architecture Patterns",
                "description": "Deep-dive article detailing stateless microservices, caching with Redis, database indexing and load balancing.",
                "resource_type": "article",
                "subject_id": subject_objs["CS"].id,
                "external_url": "https://github.com/donnemartin/system-design-primer"
            }
        ]

        for r_data in resources_data:
            existing = db.query(Resource).filter(
                Resource.title == r_data["title"],
                Resource.subject_id == r_data["subject_id"]
            ).first()
            if not existing:
                db.add(Resource(**r_data))
        db.commit()
        print("Seeded 10 educational resources.")

        # 4. 3 Quizzes with 15 questions each
        # Quiz 1: Mathematics (15 questions)
        math_quiz = db.query(Quiz).filter(Quiz.title == "Calculus & Linear Algebra Foundations").first()
        if not math_quiz:
            math_quiz = Quiz(
                title="Calculus & Linear Algebra Foundations",
                description="Test your understanding of derivatives, integration, limits, matrix operations, and eigenvalues.",
                subject_id=subject_objs["MATH"].id,
                duration_minutes=20,
                passing_score_percentage=60,
                pick_random_count=10,  # Demonstrates randomly picking 10 out of 15 questions per attempt
                is_published=True
            )
            db.add(math_quiz)
            db.commit()
            db.refresh(math_quiz)

            math_questions = [
                {
                    "text": "What is the derivative of f(x) = ln(x) with respect to x for x > 0?",
                    "explanation": "By definition of the natural logarithm derivative, d/dx[ln(x)] = 1/x.",
                    "question_type": "single",
                    "options": [
                        ("1/x", True),
                        ("e^x", False),
                        ("x * ln(x)", False),
                        ("1 / (x^2)", False)
                    ]
                },
                {
                    "text": "Which of the following functions have a derivative equal to cos(x)?",
                    "explanation": "d/dx[sin(x)] = cos(x) and adding any constant C preserves this derivative.",
                    "question_type": "multiple",
                    "options": [
                        ("sin(x)", True),
                        ("sin(x) + 5", True),
                        ("-cos(x)", False),
                        ("cos(x) + 1", False)
                    ]
                },
                {
                    "text": "What is the determinant of a 2x2 matrix [[a, b], [c, d]]?",
                    "explanation": "The determinant of a 2x2 matrix is computed as ad - bc.",
                    "question_type": "single",
                    "options": [
                        ("ad - bc", True),
                        ("ab - cd", False),
                        ("ad + bc", False),
                        ("ac - bd", False)
                    ]
                },
                {
                    "text": "What is the limit of (sin x) / x as x approaches 0?",
                    "explanation": "This fundamental trigonometric limit evaluates to 1 (can also be shown via L'Hopital's rule).",
                    "question_type": "single",
                    "options": [
                        ("1", True),
                        ("0", False),
                        ("Infinity", False),
                        ("Does not exist", False)
                    ]
                },
                {
                    "text": "If matrix A is invertible, which of the following statements must be TRUE?",
                    "explanation": "An invertible matrix has non-zero determinant, trivial null space, and full column/row rank.",
                    "question_type": "multiple",
                    "options": [
                        ("det(A) != 0", True),
                        ("The columns of A are linearly independent", True),
                        ("det(A) = 0", False),
                        ("A must be a 3x3 matrix", False)
                    ]
                },
                {
                    "text": "What is the integral of 2x * e^(x^2) dx?",
                    "explanation": "Using substitution u = x^2, du = 2x dx, the integral becomes int e^u du = e^(x^2) + C.",
                    "question_type": "single",
                    "options": [
                        ("e^(x^2) + C", True),
                        ("2 * e^(x^2) + C", False),
                        ("x^2 * e^x + C", False),
                        ("ln(x^2) + C", False)
                    ]
                },
                {
                    "text": "An eigenvalue lambda of square matrix A satisfies which fundamental equation for non-zero eigenvector v?",
                    "explanation": "The characteristic equation states Av = lambda * v, or (A - lambda * I)v = 0.",
                    "question_type": "single",
                    "options": [
                        ("A * v = lambda * v", True),
                        ("A + v = lambda", False),
                        ("det(A) = lambda", False),
                        ("v * A = lambda", False)
                    ]
                },
                {
                    "text": "What is the Taylor series expansion of e^x centered at x = 0?",
                    "explanation": "The Maclaurin series for e^x is sum_{n=0}^inf (x^n / n!).",
                    "question_type": "single",
                    "options": [
                        ("Sum from n=0 to inf of (x^n / n!)", True),
                        ("Sum from n=1 to inf of (x^n / n)", False),
                        ("1 - x + x^2 - x^3 + ...", False),
                        ("Sum of (-1)^n * x^n", False)
                    ]
                },
                {
                    "text": "Which of the following are vector spaces over the real numbers?",
                    "explanation": "R^n, polynomials of degree <= n, and continuous functions all satisfy the 8 vector space axioms.",
                    "question_type": "multiple",
                    "options": [
                        ("The set of all polynomials of degree <= 2", True),
                        ("R^3 (3D Euclidean space)", True),
                        ("The set of integers Z", False),
                        ("The set of all vectors (x, y) where x + y = 1", False)
                    ]
                },
                {
                    "text": "What is the gradient of f(x, y) = x^2 + 3y^2 at point (1, 2)?",
                    "explanation": "grad(f) = (df/dx, df/dy) = (2x, 6y). At (1, 2), this is (2(1), 6(2)) = (2, 12).",
                    "question_type": "single",
                    "options": [
                        ("(2, 12)", True),
                        ("(1, 6)", False),
                        ("(2, 6)", False),
                        ("(4, 12)", False)
                    ]
                },
                {
                    "text": "What is the value of the definite integral of x dx from 0 to 4?",
                    "explanation": "Integral of x is [x^2 / 2] from 0 to 4 = (16 / 2) - 0 = 8.",
                    "question_type": "single",
                    "options": [
                        ("8", True),
                        ("16", False),
                        ("4", False),
                        ("2", False)
                    ]
                },
                {
                    "text": "Which property defines an orthogonal matrix Q?",
                    "explanation": "An orthogonal matrix satisfies Q^T * Q = I, which implies Q^(-1) = Q^T.",
                    "question_type": "single",
                    "options": [
                        ("Q^T * Q = I", True),
                        ("det(Q) = 0", False),
                        ("Q = Q^T", False),
                        ("Q^2 = Q", False)
                    ]
                },
                {
                    "text": "According to Rolle's Theorem, if f is continuous on [a, b] and differentiable on (a, b) with f(a) = f(b), what must exist in (a, b)?",
                    "explanation": "There exists at least one point c in (a, b) such that f'(c) = 0.",
                    "question_type": "single",
                    "options": [
                        ("At least one point c where f'(c) = 0", True),
                        ("f''(c) > 0 for all c", False),
                        ("A point where f(c) = 0", False),
                        ("A vertical asymptote", False)
                    ]
                },
                {
                    "text": "Which of the following matrices has a trace of 6?",
                    "explanation": "The trace is the sum of main diagonal entries. 4 + 2 = 6, 2 + 2 + 2 = 6.",
                    "question_type": "multiple",
                    "options": [
                        ("A 2x2 matrix with diagonal elements 4 and 2", True),
                        ("A 3x3 diagonal matrix diag(2, 2, 2)", True),
                        ("A 2x2 matrix with diagonal elements 3 and 4", False),
                        ("A matrix with determinant 6", False)
                    ]
                },
                {
                    "text": "What is the dot product of vectors u = [1, 2, 3] and v = [4, -1, 2]?",
                    "explanation": "u . v = 1*4 + 2*(-1) + 3*2 = 4 - 2 + 6 = 8.",
                    "question_type": "single",
                    "options": [
                        ("8", True),
                        ("12", False),
                        ("6", False),
                        ("10", False)
                    ]
                }
            ]

            for idx, q_data in enumerate(math_questions):
                q = Question(
                    quiz_id=math_quiz.id,
                    text=q_data["text"],
                    explanation=q_data["explanation"],
                    question_type=q_data["question_type"],
                    order_idx=idx
                )
                db.add(q)
                db.flush()
                for opt_text, is_corr in q_data["options"]:
                    db.add(Option(question_id=q.id, text=opt_text, is_correct=is_corr))
            db.commit()
            print("Seeded Quiz 1: Mathematics with 15 questions.")

        # Quiz 2: Physics (15 questions)
        phys_quiz = db.query(Quiz).filter(Quiz.title == "Classical Mechanics & Thermodynamics Mastery").first()
        if not phys_quiz:
            phys_quiz = Quiz(
                title="Classical Mechanics & Thermodynamics Mastery",
                description="Explore kinematics, Newton's laws, energy conservation, heat transfer, and entropy.",
                subject_id=subject_objs["PHYS"].id,
                duration_minutes=25,
                passing_score_percentage=50,
                pick_random_count=10,
                is_published=True
            )
            db.add(phys_quiz)
            db.commit()
            db.refresh(phys_quiz)

            phys_questions = [
                {
                    "text": "What is the SI unit of force?",
                    "explanation": "The SI unit of force is the Newton (N), equal to 1 kg*m/s^2.",
                    "question_type": "single",
                    "options": [
                        ("Newton (N)", True),
                        ("Joule (J)", False),
                        ("Pascal (Pa)", False),
                        ("Watt (W)", False)
                    ]
                },
                {
                    "text": "Which of Newton's laws is also known as the Law of Inertia?",
                    "explanation": "Newton's First Law states an object remains at rest or uniform motion unless acted upon by an external net force.",
                    "question_type": "single",
                    "options": [
                        ("First Law", True),
                        ("Second Law", False),
                        ("Third Law", False),
                        ("Universal Gravitation Law", False)
                    ]
                },
                {
                    "text": "Which of the following quantities are vector quantities?",
                    "explanation": "Velocity and acceleration have both magnitude and direction, whereas temperature and mass are scalar.",
                    "question_type": "multiple",
                    "options": [
                        ("Velocity", True),
                        ("Acceleration", True),
                        ("Temperature", False),
                        ("Mass", False)
                    ]
                },
                {
                    "text": "What is the kinetic energy of an object of mass m moving with velocity v?",
                    "explanation": "Kinetic energy is given by E_k = (1/2) * m * v^2.",
                    "question_type": "single",
                    "options": [
                        ("(1/2) * m * v^2", True),
                        ("m * v", False),
                        ("m * g * h", False),
                        ("(1/2) * m^2 * v", False)
                    ]
                },
                {
                    "text": "According to the Second Law of Thermodynamics, in an isolated system, entropy:",
                    "explanation": "The entropy of an isolated system always increases or remains constant in a reversible process.",
                    "question_type": "single",
                    "options": [
                        ("Always increases or remains constant", True),
                        ("Always decreases", False),
                        ("Is always zero", False),
                        ("Oscillates periodically", False)
                    ]
                },
                {
                    "text": "What is the acceleration due to gravity near the surface of Earth approximately?",
                    "explanation": "Standard gravitational acceleration on Earth's surface is approximately 9.81 m/s^2.",
                    "question_type": "single",
                    "options": [
                        ("9.81 m/s^2", True),
                        ("3.14 m/s^2", False),
                        ("1.62 m/s^2", False),
                        ("12.5 m/s^2", False)
                    ]
                },
                {
                    "text": "Which processes represent mechanisms of heat transfer?",
                    "explanation": "The three classical modes of heat transfer are Conduction, Convection, and Radiation.",
                    "question_type": "multiple",
                    "options": [
                        ("Conduction", True),
                        ("Convection", True),
                        ("Radiation", True),
                        ("Sublimation", False)
                    ]
                },
                {
                    "text": "What does a projectile's trajectory resemble in a uniform gravitational field neglecting air resistance?",
                    "explanation": "Under constant downward gravitational acceleration and constant horizontal velocity, the path is a parabola.",
                    "question_type": "single",
                    "options": [
                        ("Parabola", True),
                        ("Hyperbola", False),
                        ("Circle", False),
                        ("Linear straight line", False)
                    ]
                },
                {
                    "text": "What is absolute zero temperature in Celsius?",
                    "explanation": "Absolute zero (0 Kelvin) corresponds to -273.15 degrees Celsius.",
                    "question_type": "single",
                    "options": [
                        ("-273.15 C", True),
                        ("0 C", False),
                        ("-100 C", False),
                        ("-459.67 C", False)
                    ]
                },
                {
                    "text": "What is the relationship between work W, force F, and displacement d for constant force in the direction of motion?",
                    "explanation": "Work is the scalar product of force and displacement: W = F * d.",
                    "question_type": "single",
                    "options": [
                        ("W = F * d", True),
                        ("W = F / d", False),
                        ("W = F * d^2", False),
                        ("W = (1/2) * F * d", False)
                    ]
                },
                {
                    "text": "What is conserved in an isolated system during an elastic collision?",
                    "explanation": "In an elastic collision, both total linear momentum and total kinetic energy are conserved.",
                    "question_type": "multiple",
                    "options": [
                        ("Total linear momentum", True),
                        ("Total kinetic energy", True),
                        ("Total potential energy only", False),
                        ("None of the above", False)
                    ]
                },
                {
                    "text": "What is the period T of a simple pendulum of length L in small-angle approximation?",
                    "explanation": "T = 2 * pi * sqrt(L / g).",
                    "question_type": "single",
                    "options": [
                        ("2 * pi * sqrt(L / g)", True),
                        ("2 * pi * sqrt(g / L)", False),
                        ("pi * (L / g)", False),
                        ("sqrt(L * g)", False)
                    ]
                },
                {
                    "text": "The ideal gas law is expressed as:",
                    "explanation": "The ideal gas equation of state is PV = nRT.",
                    "question_type": "single",
                    "options": [
                        ("PV = nRT", True),
                        ("P / V = nRT", False),
                        ("PT = nRV", False),
                        ("P = VRT", False)
                    ]
                },
                {
                    "text": "What happens to the pressure of a fixed mass of gas at constant volume when temperature increases?",
                    "explanation": "By Gay-Lussac's law (P proportional to T at constant V), pressure increases proportionally.",
                    "question_type": "single",
                    "options": [
                        ("Pressure increases", True),
                        ("Pressure decreases", False),
                        ("Pressure remains strictly constant", False),
                        ("Pressure drops to zero", False)
                    ]
                },
                {
                    "text": "Which engine cycle represents the theoretical maximum thermodynamic efficiency between two thermal reservoirs?",
                    "explanation": "The Carnot cycle achieves the Carnot efficiency, the upper limit for any heat engine operating between two temperatures.",
                    "question_type": "single",
                    "options": [
                        ("Carnot cycle", True),
                        ("Otto cycle", False),
                        ("Rankine cycle", False),
                        ("Diesel cycle", False)
                    ]
                }
            ]

            for idx, q_data in enumerate(phys_questions):
                q = Question(
                    quiz_id=phys_quiz.id,
                    text=q_data["text"],
                    explanation=q_data["explanation"],
                    question_type=q_data["question_type"],
                    order_idx=idx
                )
                db.add(q)
                db.flush()
                for opt_text, is_corr in q_data["options"]:
                    db.add(Option(question_id=q.id, text=opt_text, is_correct=is_corr))
            db.commit()
            print("Seeded Quiz 2: Physics with 15 questions.")

        # Quiz 3: Computer Science (15 questions)
        cs_quiz = db.query(Quiz).filter(Quiz.title == "Data Structures, Algorithms & Python").first()
        if not cs_quiz:
            cs_quiz = Quiz(
                title="Data Structures, Algorithms & Python",
                description="Challenge yourself on asymptotic complexity, trees, graphs, sorting algorithms, and core Python concepts.",
                subject_id=subject_objs["CS"].id,
                duration_minutes=15,
                passing_score_percentage=60,
                pick_random_count=10,
                is_published=True
            )
            db.add(cs_quiz)
            db.commit()
            db.refresh(cs_quiz)

            cs_questions = [
                {
                    "text": "What is the average time complexity for lookup in a Python dictionary (hash map)?",
                    "explanation": "A hash map provides average O(1) constant time lookup given good hash distribution.",
                    "question_type": "single",
                    "options": [
                        ("O(1)", True),
                        ("O(log n)", False),
                        ("O(n)", False),
                        ("O(n log n)", False)
                    ]
                },
                {
                    "text": "Which of the following data structures work on a First-In, First-Out (FIFO) basis?",
                    "explanation": "A Queue operates on FIFO principle, whereas Stacks operate on LIFO.",
                    "question_type": "single",
                    "options": [
                        ("Queue", True),
                        ("Stack", False),
                        ("Binary Heap", False),
                        ("Trie", False)
                    ]
                },
                {
                    "text": "Which of the following sorting algorithms have a worst-case time complexity of O(n log n)?",
                    "explanation": "Merge Sort and Heap Sort are guaranteed O(n log n) even in the worst case, unlike Quick Sort which can degrade to O(n^2).",
                    "question_type": "multiple",
                    "options": [
                        ("Merge Sort", True),
                        ("Heap Sort", True),
                        ("Bubble Sort", False),
                        ("Insertion Sort", False)
                    ]
                },
                {
                    "text": "What is the output of `bool([])` in Python?",
                    "explanation": "In Python, empty collections (empty list, tuple, dict, set, string) evaluate to False in boolean context.",
                    "question_type": "single",
                    "options": [
                        ("False", True),
                        ("True", False),
                        ("None", False),
                        ("Raises ValueError", False)
                    ]
                },
                {
                    "text": "Which of the following are immutable data types in Python?",
                    "explanation": "Tuples and Strings cannot be modified in place in Python, while lists and dicts are mutable.",
                    "question_type": "multiple",
                    "options": [
                        ("tuple", True),
                        ("str (string)", True),
                        ("list", False),
                        ("dict", False)
                    ]
                },
                {
                    "text": "What is the worst-case search time complexity in an unbalanced Binary Search Tree (BST)?",
                    "explanation": "If elements are inserted in sorted order, the BST degenerates into a linked list, yielding O(n) search time.",
                    "question_type": "single",
                    "options": [
                        ("O(n)", True),
                        ("O(log n)", False),
                        ("O(1)", False),
                        ("O(n^2)", False)
                    ]
                },
                {
                    "text": "Which algorithm is commonly used to find the shortest path in a weighted graph with non-negative edge weights?",
                    "explanation": "Dijkstra's algorithm finds single-source shortest paths in graphs with non-negative edge weights.",
                    "question_type": "single",
                    "options": [
                        ("Dijkstra's Algorithm", True),
                        ("Kruskal's Algorithm", False),
                        ("Prim's Algorithm", False),
                        ("Breadth-First Search (unweighted)", False)
                    ]
                },
                {
                    "text": "In Python, what keyword is used to create a generator function?",
                    "explanation": "The `yield` keyword pauses function execution and produces an item to the generator's caller.",
                    "question_type": "single",
                    "options": [
                        ("yield", True),
                        ("generate", False),
                        ("return", False),
                        ("resume", False)
                    ]
                },
                {
                    "text": "Which of the following graph traversal algorithms use a Queue?",
                    "explanation": "Breadth-First Search (BFS) explores neighbor nodes layer by layer using a FIFO queue.",
                    "question_type": "single",
                    "options": [
                        ("Breadth-First Search (BFS)", True),
                        ("Depth-First Search (DFS)", False),
                        ("Topological Sort with DFS", False),
                        ("A* search with priority stack", False)
                    ]
                },
                {
                    "text": "What will `[x * 2 for x in range(3)]` evaluate to?",
                    "explanation": "range(3) produces 0, 1, 2. Multiplying each by 2 yields [0, 2, 4].",
                    "question_type": "single",
                    "options": [
                        ("[0, 2, 4]", True),
                        ("[2, 4, 6]", False),
                        ("[0, 1, 2]", False),
                        ("[2, 2, 2]", False)
                    ]
                },
                {
                    "text": "Which design patterns fall under the 'Creational' category in software engineering?",
                    "explanation": "Singleton and Factory Method deal with object creation mechanisms. Observer is behavioral, Adapter is structural.",
                    "question_type": "multiple",
                    "options": [
                        ("Singleton", True),
                        ("Factory Method", True),
                        ("Observer", False),
                        ("Adapter", False)
                    ]
                },
                {
                    "text": "What HTTP status code is returned for 'Unauthorized' when credentials are missing or invalid?",
                    "explanation": "401 Unauthorized indicates that the request has not been applied because it lacks valid authentication credentials.",
                    "question_type": "single",
                    "options": [
                        ("401", True),
                        ("403", False),
                        ("404", False),
                        ("500", False)
                    ]
                },
                {
                    "text": "What is the time complexity of pushing an element onto an array-based stack with dynamic resizing?",
                    "explanation": "Push has amortized O(1) time complexity.",
                    "question_type": "single",
                    "options": [
                        ("Amortized O(1)", True),
                        ("Strict O(n^2)", False),
                        ("O(log n)", False),
                        ("O(n log n)", False)
                    ]
                },
                {
                    "text": "In relational databases, which SQL statement is used to remove a table structure and its data completely?",
                    "explanation": "DROP TABLE deletes the entire table definition along with all its rows.",
                    "question_type": "single",
                    "options": [
                        ("DROP TABLE", True),
                        ("DELETE FROM", False),
                        ("TRUNCATE", False),
                        ("REMOVE TABLE", False)
                    ]
                },
                {
                    "text": "Which of the following statements about REST APIs are TRUE?",
                    "explanation": "REST is architectural, stateless, and standardly uses HTTP methods GET, POST, PUT, DELETE.",
                    "question_type": "multiple",
                    "options": [
                        ("REST communication is stateless between client and server", True),
                        ("Standard HTTP methods (GET, POST, PUT, DELETE) represent CRUD operations", True),
                        ("REST requires XML and forbids JSON", False),
                        ("A client session must always be stored in server memory in pure REST", False)
                    ]
                }
            ]

            for idx, q_data in enumerate(cs_questions):
                q = Question(
                    quiz_id=cs_quiz.id,
                    text=q_data["text"],
                    explanation=q_data["explanation"],
                    question_type=q_data["question_type"],
                    order_idx=idx
                )
                db.add(q)
                db.flush()
                for opt_text, is_corr in q_data["options"]:
                    db.add(Option(question_id=q.id, text=opt_text, is_correct=is_corr))
            db.commit()
            print("Seeded Quiz 3: Computer Science with 15 questions.")

        print("Database seed completed successfully!")

    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
