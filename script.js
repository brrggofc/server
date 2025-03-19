let currentQuestionIndex = 0;
let userAnswers = [];
let score = 0;
let questions = [];
let username = '';
let email = '';

// Отримуємо дані з URL
const urlParams = new URLSearchParams(window.location.search);
username = urlParams.get('username');
email = urlParams.get('email');

// Відображаємо дані реєстрації (опціонально)
document.addEventListener("DOMContentLoaded", () => {
    const usernameDisplay = document.getElementById("username-display");
    const emailDisplay = document.getElementById("email-display");
    if (usernameDisplay && emailDisplay) {
        usernameDisplay.textContent = username;
        emailDisplay.textContent = email;
    }

    // Ініціалізація тесту
    document.getElementById("next-button").onclick = () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            loadQuestion(currentQuestionIndex);
        }
    };
    document.getElementById("finish-button").onclick = finishTest;
    document.getElementById("repeat-button").onclick = restartTest;
});

// Завантаження JSON з питаннями
fetch('questions.json')
    .then(response => response.json())
    .then(data => {
        questions = data;

        if (questions && questions.length > 0) {
            loadQuestion(currentQuestionIndex);
        } else {
            console.error("Error: Questions data is empty or undefined.");
        }
    })
    .catch(error => {
        console.error('Error fetching questions:', error);
    });

function loadQuestion(index) {
    if (questions && questions[index]) {
        const question = questions[index];
        document.getElementById("question").textContent = question.question;

        const optionsContainer = document.getElementById("options");
        optionsContainer.innerHTML = ""; // Очищення попередніх відповідей

        question.options.forEach((option, i) => {
            const optionButton = document.createElement("button");
            optionButton.textContent = option;
            optionButton.classList.add("button");
            optionButton.onclick = () => selectAnswer(i, optionButton);
            optionsContainer.appendChild(optionButton);
        });

        // Завантаження SVG
        const svgContainer = document.getElementById("svg-container");
        svgContainer.innerHTML = `<img src="images/${question.svg}" alt="SVG">`;

        updateQuestionSelector();
        highlightCurrentQuestion();
    } else {
        console.error("Error: Invalid question data at index:", index);
    }
}

// Оновлення селектора питань
function updateQuestionSelector() {
    const selector = document.getElementById("question-selector");
    selector.innerHTML = "";

    questions.forEach((_, i) => {
        const questionButton = document.createElement("button");
        questionButton.textContent = i + 1;
        questionButton.classList.add("button");
        questionButton.onclick = () => {
            currentQuestionIndex = i;
            loadQuestion(i);
        };
        selector.appendChild(questionButton);
    });
}

// Підсвічування активного питання
function highlightCurrentQuestion() {
    const questionButtons = document.querySelectorAll("#question-selector button");
    questionButtons.forEach(button => button.classList.remove("selected"));
    questionButtons[currentQuestionIndex].classList.add("selected");
}

// Вибір відповіді
function selectAnswer(answerIndex, optionButton) {
    const correctAnswer = questions[currentQuestionIndex].correct;
    userAnswers[currentQuestionIndex] = answerIndex;

    const optionButtons = document.querySelectorAll("#options button");
    optionButtons.forEach(button => {
        button.classList.remove("selected-answer");
    });

    optionButton.classList.add("selected-answer");

    // Підрахунок правильних відповідей
    if (answerIndex === correctAnswer) {
        score++;
    }
}

// Завершення тесту
function finishTest() {
    const resultContainer = document.getElementById("result");
    if (!resultContainer) {
        console.error("Error: #result element not found!");
        return;
    }

    let correctAnswers = 0;
    userAnswers.forEach((answer, index) => {
        if (answer === questions[index].correct) {
            correctAnswers++;
        }
    });

    resultContainer.innerHTML = `Your result: ${correctAnswers} out of ${questions.length} correct answers.`;

    // Формуємо об'єкт для збереження
    const resultData = {
        username: username,
        email: email,
        date: new Date().toLocaleString(),
        score: correctAnswers,
        total: questions.length
    };

    // Відправляємо дані на сервер
    fetch('http://localhost:3000/save-results', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(resultData),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Results saved:', data);
    })
    .catch(error => {
        console.error('Error saving results:', error);
    });

    document.getElementById("next-button").style.display = "none";
    document.getElementById("finish-button").style.display = "none";
    document.getElementById("repeat-button").style.display = "inline-block";

    showResultsHistory();
}

// Показ історії результатів
function showResultsHistory() {
    const historyContainer = document.getElementById("history");
    if (!historyContainer) {
        console.error("Error: #history element not found!");
        return;
    }

    fetch('http://localhost:3000/get-prev-result')
        .then(response => response.json())
        .then(data => {
            historyContainer.innerHTML = "<h3>Previous Results:</h3>";
            data.forEach((res, index) => {
                historyContainer.innerHTML += `<p>${index + 1}. ${res.username} - ${res.score}/${res.total} (${res.date})</p>`;
            });
        })
        .catch(error => {
            console.error('Error fetching previous results:', error);
        });
}

// Повторне проходження тесту
function restartTest() {
    currentQuestionIndex = 0;
    score = 0;
    userAnswers = [];

    const resultContainer = document.getElementById("result");
    resultContainer.innerHTML = '';

    loadQuestion(currentQuestionIndex);

    document.getElementById("repeat-button").style.display = "none";
    document.getElementById("next-button").style.display = "inline-block";
    document.getElementById("finish-button").style.display = "none";

    showResultsHistory();
}