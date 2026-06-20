/**
 * 일본어 단어 암기장 - JavaScript 로직 파일
 * 초보자를 위해 상세한 한국어 주석을 작성했습니다.
 */
// ==========================================================================
// 1. 전역 상태 관리 변수 정의
// ==========================================================================
// 단어 목록을 저장할 배열입니다.
// 로컬 스토리지(localStorage)에 기존 데이터가 있으면 불러오고, 없으면 빈 배열로 시작합니다.
let vocabList = [];
// 현재 필터링 상태를 저장하는 변수입니다. ('all' 또는 'important')
let currentFilter = 'all';
// 현재 진행 중인 퀴즈의 정보를 담는 변수입니다.
let currentQuizWord = null;
// 첫 사용자용 기본 샘플 단어 데이터
const sampleData = [
    {
        id: "sample-1",
        word: "桜 (さくら)",
        meaning: "벚꽃",
        example: "桜の花がとても綺麗ですね。(벚꽃이 정말 예쁘네요.)",
        isImportant: true,
        isCompleted: false,
        hideMeaning: true,
        createdAt: Date.now() - 3000
    },
    {
        id: "sample-2",
        word: "美味しい (おいしい)",
        meaning: "맛있다",
        example: "日本のラーメンは本当に美味しいです。(일본 라멘은 정말 맛있습니다.)",
        isImportant: false,
        isCompleted: false,
        hideMeaning: true,
        createdAt: Date.now() - 2000
    },
    {
        id: "sample-3",
        word: "勉強 (べんきょう)",
        meaning: "공부",
        example: "毎日日本語를 勉強します。(매일 일본어를 공부합니다.)",
        isImportant: false,
        isCompleted: true, // 미리 완료 처리해 둠
        hideMeaning: true,
        createdAt: Date.now() - 1000
    }
];
// ==========================================================================
// 2. 초기화 및 이벤트 리스너 등록
// ==========================================================================
// 브라우저가 HTML 문서를 모두 로드한 후 실행되는 코드입니다.
document.addEventListener("DOMContentLoaded", () => {
    // 1. 로컬 스토리지에서 단어 불러오기
    loadVocabData();
    // 2. 입력 및 클릭 관련 엘리먼트 이벤트 리스너 등록
    
    // [단어 추가] 버튼 클릭 이벤트
    document.getElementById("add-word-btn").addEventListener("click", addNewWord);
    
    // [검색창] 입력 이벤트 (글자를 칠 때마다 실시간 검색 수행)
    document.getElementById("search-input").addEventListener("input", renderApp);
    
    // [중요 단어만 보기] 필터 버튼 클릭
    document.getElementById("filter-star-btn").addEventListener("click", () => {
        setFilter('important');
    });
    
    // [전체 보기] 필터 버튼 클릭
    document.getElementById("filter-all-btn").addEventListener("click", () => {
        setFilter('all');
    });
    // [퀴즈 시작] 버튼 클릭
    document.getElementById("start-quiz-btn").addEventListener("click", openQuizModal);
    
    // 퀴즈 관련 버튼들 (정답 확인, 다음 문제, 종료)
    document.getElementById("quiz-form").addEventListener("submit", handleQuizSubmit);
    document.getElementById("next-quiz-btn").addEventListener("click", nextQuizQuestion);
    document.getElementById("close-quiz-btn").addEventListener("click", closeQuizModal);
    document.getElementById("stop-quiz-btn").addEventListener("click", closeQuizModal);
    // 3. 첫 화면 렌더링
    renderApp();
});
// ==========================================================================
// 3. 로컬 스토리지 (데이터 저장/불러오기) 기능
// ==========================================================================
// 로컬 스토리지에 현재의 vocabList 배열을 저장하는 함수입니다.
function saveVocabData() {
    // 배열을 JSON 문자열로 변환하여 'japanese_vocab' 키에 저장합니다.
    localStorage.setItem("japanese_vocab", JSON.stringify(vocabList));
}
// 로컬 스토리지에서 데이터를 읽어오는 함수입니다.
function loadVocabData() {
    const data = localStorage.getItem("japanese_vocab");
    
    if (data) {
        // 저장된 데이터가 있으면 JSON 문자열을 원래 배열(객체)로 복구합니다.
        vocabList = JSON.parse(data);
    } else {
        // 저장된 데이터가 없는 첫 사용자라면 샘플 데이터를 기본으로 넣어 줍니다.
        vocabList = [...sampleData];
        saveVocabData(); // 로컬 스토리지에도 최초 저장
    }
}
// ==========================================================================
// 4. 단어 추가 및 삭제 기능
// ==========================================================================
// 새 단어를 등록하는 함수입니다.
function addNewWord() {
    // 입력 필드들 가져오기
    const jpWordInput = document.getElementById("jp-word");
    const krMeaningInput = document.getElementById("kr-meaning");
    const exSentenceInput = document.getElementById("ex-sentence");
    // 공백을 제거한 값
    const word = jpWordInput.value.trim();
    const meaning = krMeaningInput.value.trim();
    const example = exSentenceInput.value.trim();
    // 필수 항목(일본어 단어, 한국어 뜻) 유효성 검사
    if (!word || !meaning) {
        alert("일본어 단어와 한국어 뜻을 반드시 입력해 주세요! 🌸");
        return;
    }
    // 새 단어 객체 생성
    const newWord = {
        id: "word-" + Date.now(), // 고유한 ID값 생성 (현재시간 밀리초 활용)
        word: word,
        meaning: meaning,
        example: example, // 예문은 선택사항 (있으면 들어가고 없으면 빈 문자열)
        isImportant: false, // 기본적으로 중요 표시는 꺼져 있음
        isCompleted: false, // 기본적으로 학습 완료는 꺼져 있음
        hideMeaning: true,  // 기본적으로 뜻은 보이지 않게(숨김) 설정
        createdAt: Date.now() // 최신 등록 단어가 위로 오도록 정렬하기 위한 타임스탬프
    };
    // 기존 단어 목록 맨 앞에 새 단어 추가
    vocabList.unshift(newWord);
    // 로컬 스토리지에 즉시 저장
    saveVocabData();
    // 입력 필드 비워주기 (초기화)
    jpWordInput.value = "";
    krMeaningInput.value = "";
    exSentenceInput.value = "";
    // 화면 갱신
    renderApp();
}
// 등록된 단어를 삭제하는 함수입니다. (UX 편의를 위한 보너스 기능)
function deleteWord(id) {
    if (confirm("이 단어를 정말 삭제하시겠습니까? 🗑️")) {
        // filter를 사용하여 해당 id를 가진 단어만 제외하고 새 배열을 만듭니다.
        vocabList = vocabList.filter(item => item.id !== id);
        
        // 로컬 스토리지 저장 및 화면 갱신
        saveVocabData();
        renderApp();
    }
}
// ==========================================================================
// 5. 단어 카드 제어 기능 (상태 토글)
// ==========================================================================
// 뜻 보기/숨기기 상태를 토글하는 함수입니다.
function toggleMeaning(id) {
    // 해당 id를 가진 단어를 찾아 hideMeaning 값을 반대로 바꿉니다.
    const wordObj = vocabList.find(item => item.id === id);
    if (wordObj) {
        wordObj.hideMeaning = !wordObj.hideMeaning;
        saveVocabData();
        renderApp(); // 화면 갱신
    }
}
// 중요 표시(별표) 상태를 토글하는 함수입니다.
function toggleImportant(id) {
    const wordObj = vocabList.find(item => item.id === id);
    if (wordObj) {
        wordObj.isImportant = !wordObj.isImportant;
        saveVocabData();
        renderApp();
    }
}
// 학습 완료 체크박스 상태를 토글하는 함수입니다.
function toggleCompleted(id) {
    const wordObj = vocabList.find(item => item.id === id);
    if (wordObj) {
        wordObj.isCompleted = !wordObj.isCompleted;
        saveVocabData();
        renderApp();
    }
}
// 필터 조건 변경 함수 (전체보기 / 중요 단어만 보기)
function setFilter(filterType) {
    currentFilter = filterType;
    
    // 필터 버튼들의 활성화(Active) CSS 클래스 관리
    const starBtn = document.getElementById("filter-star-btn");
    const allBtn = document.getElementById("filter-all-btn");
    
    if (filterType === 'important') {
        starBtn.classList.add("active");
        allBtn.classList.remove("active");
    } else {
        starBtn.classList.remove("active");
        allBtn.classList.add("active");
    }
    
    renderApp(); // 필터링 조건에 맞춰 다시 그리기
}
// ==========================================================================
// 6. 화면 렌더링 (UI 그리기)
// ==========================================================================
// 전체 앱 화면을 데이터에 맞게 다시 그려주는 함수입니다.
function renderApp() {
    const cardsGrid = document.getElementById("word-cards-grid");
    const emptyState = document.getElementById("empty-state");
    const searchInput = document.getElementById("search-input");
    const totalCountEl = document.getElementById("total-count");
    const completedCountEl = document.getElementById("completed-count");
    // 1. 검색어 가져오기
    const searchTerm = searchInput.value.toLowerCase().trim();
    // 2. 단어 필터링
    let filteredList = vocabList;
    // 중요 필터 적용
    if (currentFilter === 'important') {
        filteredList = filteredList.filter(item => item.isImportant);
    }
    // 검색어 필터 적용 (일본어 단어와 한국어 뜻 검색 가능)
    if (searchTerm) {
        filteredList = filteredList.filter(item => {
            const jpMatch = item.word.toLowerCase().includes(searchTerm);
            const krMatch = item.meaning.toLowerCase().includes(searchTerm);
            return jpMatch || krMatch;
        });
    }
    // 3. 통계 수치 업데이트
    totalCountEl.textContent = vocabList.length;
    completedCountEl.textContent = vocabList.filter(item => item.isCompleted).length;
    // 4. 단어장 카드 영역 그리기
    cardsGrid.innerHTML = "";
    if (filteredList.length === 0) {
        // 단어 리스트가 비어있을 때
        emptyState.classList.remove("hidden");
        // 검색 중이면 안내 문구 살짝 변경
        if (searchTerm || currentFilter === 'important') {
            emptyState.querySelector("p").textContent = "검색 조건에 맞는 단어가 없습니다.";
            emptyState.querySelector("span").textContent = "검색어를 확인하거나 필터를 해제해 보세요.";
        } else {
            emptyState.querySelector("p").textContent = "등록된 단어가 없습니다.";
            emptyState.querySelector("span").textContent = "새로운 단어를 입력하여 추가해 보세요!";
        }
    } else {
        emptyState.classList.add("hidden");
        // 최신 등록 단어가 위로 오도록 생성 시간(createdAt) 기준 정렬(내림차순)
        // 기본적으로 unshift로 배열 앞에 삽입되므로 index 순서도 최신이 앞이지만, 정렬을 명시적으로 처리
        const sortedList = [...filteredList].sort((a, b) => b.createdAt - a.createdAt);
        sortedList.forEach(item => {
            // 개별 단어 카드 요소를 HTML 태그로 생성
            const card = document.createElement("div");
            card.className = `word-card ${item.isCompleted ? 'completed' : ''}`;
            
            card.innerHTML = `
                <!-- 카드 상단 제어 바 -->
                <div class="card-header">
                    <!-- 학습 완료 체크박스 -->
                    <label class="completed-checkbox-wrapper">
                        <input type="checkbox" class="completed-checkbox" 
                               ${item.isCompleted ? 'checked' : ''} 
                               onclick="toggleCompleted('${item.id}')">
                        학습 완료
                    </label>
                    
                    <div class="card-actions-right">
                        <!-- 중요 표시 별표 버튼 -->
                        <button class="btn-star ${item.isImportant ? 'active' : ''}" 
                                onclick="toggleImportant('${item.id}')"
                                title="중요 표시">
                            <i data-lucide="star"></i>
                        </button>
                        <!-- 단어 삭제 버튼 -->
                        <button class="btn-delete" 
                                onclick="deleteWord('${item.id}')"
                                title="단어 삭제">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>
                <!-- 카드 본문 내용 -->
                <div class="card-body">
                    <!-- 일본어 단어 -->
                    <div class="jp-word-display">${item.word}</div>
                    
                    <!-- 예문 (예문이 있을 때만 화면에 렌더링) -->
                    ${item.example ? `<div class="ex-sentence-display">${item.example}</div>` : ''}
                    
                    <!-- 한국어 뜻 영역 -->
                    <div class="meaning-container">
                        <div class="kr-meaning-display ${item.hideMeaning ? 'hidden' : ''}">
                            뜻: ${item.meaning}
                        </div>
                        <button class="btn btn-outline btn-toggle-meaning" onclick="toggleMeaning('${item.id}')">
                            ${item.hideMeaning ? '<i data-lucide="eye"></i> 뜻 보기' : '<i data-lucide="eye-off"></i> 뜻 숨기기'}
                        </button>
                    </div>
                </div>
            `;
            
            cardsGrid.appendChild(card);
        });
    }
    // Lucide 아이콘이 동적으로 생성된 HTML 태그 안에서도 정상 동작하도록 렌더링 수행
    lucide.createIcons();
}
// ==========================================================================
// 7. 퀴즈 기능 로직
// ==========================================================================
// 퀴즈 시작 시 퀴즈 모달을 여는 함수입니다.
function openQuizModal() {
    // 퀴즈를 출제할 수 있는 단어가 최소 1개는 있어야 합니다. (완료된 단어 제외 가능하나, 여기선 전체 대상)
    if (vocabList.length === 0) {
        alert("퀴즈를 시작하려면 먼저 단어를 1개 이상 추가해 주세요! 🌸");
        return;
    }
    const modal = document.getElementById("quiz-modal");
    modal.classList.add("active");
    // 첫 문제 출제
    nextQuizQuestion();
}
// 퀴즈 모달을 닫는 함수입니다.
function closeQuizModal() {
    const modal = document.getElementById("quiz-modal");
    modal.classList.remove("active");
    
    // 퀴즈 상태 및 필드 초기화
    currentQuizWord = null;
    document.getElementById("quiz-answer").value = "";
    document.getElementById("quiz-feedback").classList.add("hidden");
    document.getElementById("next-quiz-btn").classList.add("hidden");
}
// 다음 퀴즈 문제를 준비하는 함수입니다.
function nextQuizQuestion() {
    // 답변 입력 필드 및 결과 뷰 초기화
    const answerInput = document.getElementById("quiz-answer");
    const feedbackBox = document.getElementById("quiz-feedback");
    const nextBtn = document.getElementById("next-quiz-btn");
    
    answerInput.value = "";
    answerInput.disabled = false;
    feedbackBox.className = "quiz-feedback-box hidden";
    nextBtn.classList.add("hidden");
    // 단어 목록 중 무작위(랜덤)로 1개 선택하기
    const randomIndex = Math.floor(Math.random() * vocabList.length);
    currentQuizWord = vocabList[randomIndex];
    // 문제 표시 엘리먼트에 채워 넣기
    document.getElementById("quiz-question-word").textContent = currentQuizWord.word;
    // 진행 상태 안내 갱신
    document.getElementById("quiz-progress").style.width = "100%";
    
    // 입력창 포커스 맞추기
    answerInput.focus();
    
    lucide.createIcons();
}
// 정답 확인 버튼을 눌렀을 때 실행되는 함수입니다.
function handleQuizSubmit(event) {
    event.preventDefault(); // 폼 전송 이벤트 기본 동작 방지
    if (!currentQuizWord) return;
    const answerInput = document.getElementById("quiz-answer");
    const feedbackBox = document.getElementById("quiz-feedback");
    const feedbackText = document.getElementById("quiz-feedback-text");
    const correctAnswerBox = document.getElementById("quiz-correct-answer");
    const correctAnswerText = document.getElementById("correct-answer-text");
    const nextBtn = document.getElementById("next-quiz-btn");
    // 입력창 비활성화
    answerInput.disabled = true;
    // 사용자가 입력한 답과 원래 한국어 뜻을 공백 및 대소문자 제거 후 비교
    const userAnswer = answerInput.value.trim().toLowerCase();
    const correctAnswer = currentQuizWord.meaning.trim().toLowerCase();
    feedbackBox.classList.remove("hidden");
    if (userAnswer === correctAnswer) {
        // 정답인 경우
        feedbackBox.className = "quiz-feedback-box correct";
        feedbackText.innerHTML = "🎉 정답입니다!";
        correctAnswerBox.classList.add("hidden");
    } else {
        // 오답인 경우
        feedbackBox.className = "quiz-feedback-box incorrect";
        feedbackText.innerHTML = "❌ 다시 확인해보세요.";
        
        // 정답 힌트 노출
        correctAnswerText.textContent = currentQuizWord.meaning;
        correctAnswerBox.classList.remove("hidden");
    }
    // 다음 문제 버튼 노출
    nextBtn.classList.remove("hidden");
    nextBtn.focus();
}
