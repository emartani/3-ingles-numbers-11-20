// === Quebra-Cabeça dos Numerais (11–20, inglês) ===

// Mantém sua lógica de imagens para o quebra-cabeça
const images = Array.from({ length: 10 }, (_, i) => `images/${i+1}.jpg`);
let imgURL = "";
let score = 0;
let correctCount = 0;

const board = document.getElementById("board");
const piecesDiv = document.getElementById("pieces");
const scoreDiv = document.getElementById("score");
const restartBtn = document.getElementById("restart");
const startBtn = document.getElementById("start");

// Sons de feedback
const soundAcerto = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");
const soundErro   = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");

// ---------- Utilitários ----------
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function numberToEnglish(num) {
  const map = {
    10: "ten",
    11: "eleven",
    12: "twelve",
    13: "thirteen",
    14: "fourteen",
    15: "fifteen",
    16: "sixteen",
    17: "seventeen",
    18: "eighteen",
    19: "nineteen",
    20: "twenty"
  };
  return map[num] ?? String(num);
}

// Fala em inglês (en-US)
function speakEnglish(text) {
  try {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 0.95;
    utter.pitch = 1.0;
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
  } catch (e) {
    console.warn("Speech synthesis not supported or blocked.", e);
  }
}

// Gera 9 números únicos entre 11 e 20
function generateNumbers11to20() {
  const pool = Array.from({ length: 10 }, (_, i) => i + 11); // [11..20]
  const selected = shuffle(pool).slice(0, 9);
  // id: identificador interno; q: palavra (inglês); a: número (algarismo)
  return selected.map((n, idx) => ({ id: `item_${n}`, q: numberToEnglish(n), a: n, idx }));
}

// --- Efeito de vitória (mantido) ---
function triggerVictoryEffect() {
  board.classList.add('victory');
  createConfetti(20);
  setTimeout(() => {
    board.classList.remove('victory');
    document.querySelectorAll('.confetti').forEach(c => c.remove());
  }, 2500);
}

function createConfetti(count = 20) {
  const colors = ['#ff6f61','#ffd54f','#81c784','#4fc3f7','#b39ddb'];
  const rect = board.getBoundingClientRect();
  for (let i = 0; i < count; i++) {
    const conf = document.createElement('div');
    conf.className = 'confetti';
    const size = Math.floor(Math.random() * 10) + 6;
    conf.style.width = size + 'px';
    conf.style.height = size + 'px';
    conf.style.background = colors[Math.floor(Math.random() * colors.length)];
    conf.style.left = (rect.left + Math.random() * rect.width) + 'px';
    conf.style.top = (rect.top + 10) + 'px';
    conf.style.transform = `rotate(${Math.random()*360}deg)`;
    document.body.appendChild(conf);
  }
}

// ------------- Inicia partida (corrigido) -------------
function startGame() {
  board.innerHTML = "";
  piecesDiv.innerHTML = "";
  score = 0;
  correctCount = 0;
  scoreDiv.textContent = "Pontuação: " + score;

  imgURL = images[Math.floor(Math.random() * images.length)];

  // 1) Gera os 9 pares (q/a)
  const base = generateNumbers11to20();

  // 2) Embaralha a POSIÇÃO DOS ALVOS no tabuleiro (ordem independente)
  const boardOrder = shuffle([...Array(9).keys()]); // [0..8] embaralhado
  const boardSlots = boardOrder.map((slotIndex, gridIndex) => {
    // cada célula do grid recebe um item (mas a posição é aleatória)
    const item = base[slotIndex];
    return { gridIndex, slotIndex, item };
  });

  // 3) Embaralha a ORDEM VISUAL DAS PEÇAS (independente do tabuleiro)
  const pieceOrder = shuffle([...Array(9).keys()]);
  // Também criamos um embaralhamento dos recortes visuais para as miniaturas
  // para não "entregar" a posição do quebra-cabeça.
  const thumbSlices = shuffle([...Array(9).keys()]); // 0..8 para recortes aleatórios

  // --- Monta TABULEIRO (células) ---
  boardSlots.forEach(({ gridIndex, slotIndex, item }) => {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.textContent = item.q.toUpperCase();        // nome por extenso (inglês)
    cell.dataset.answer = String(item.a);           // validação por número
    cell.dataset.index = String(gridIndex);         // posição visual do grid

    cell.addEventListener("dragover", e => e.preventDefault());
    cell.addEventListener("drop", e => {
      const draggedAnswer = e.dataTransfer.getData("text/plain");

      if (draggedAnswer === cell.dataset.answer && !cell.classList.contains("correct")) {
        // Acertou
        cell.classList.add("correct");
        cell.textContent = "";

        // Revela a parte correta da imagem de ACORDO COM A POSIÇÃO REAL DO GRID
        const row = Math.floor(gridIndex / 3);
        const col = gridIndex % 3;
        cell.style.backgroundImage = `url(${imgURL})`;
        cell.style.backgroundSize = '300% 300%';
        cell.style.backgroundPosition = `${col * 50}% ${row * 50}%`;

        correctCount++;
        score += 10;
        soundAcerto.play();
        scoreDiv.textContent = "Pontuação: " + score;

        // Fala o número em inglês e remove a peça após ~1,2s
        speakEnglish(numberToEnglish(Number(draggedAnswer)));
        const pieceEl = window.draggedPiece;
        setTimeout(() => {
          if (pieceEl && pieceEl.parentElement) pieceEl.parentElement.removeChild(pieceEl);
        }, 1200);
        window.draggedPiece = null;

        if (correctCount === 9) triggerVictoryEffect();
      } else {
        // Errou
        score -= 5;
        soundErro.play();
        scoreDiv.textContent = "Pontuação: " + score;
      }
    });

    board.appendChild(cell);
  });

  // --- Monta PEÇAS (ordem visual realmente embaralhada + miniatura enganosa) ---
  pieceOrder.forEach((idxOnPiecesRow, i) => {
    const item = base[idxOnPiecesRow];

    const piece = document.createElement("div");
    piece.className = "piece";
    piece.draggable = true;
    piece.dataset.answer = String(item.a);

    // Miniatura: recorte aleatório, NÃO relacionado ao slot correto
    const slice = thumbSlices[i];
    const thumbRow = Math.floor(slice / 3);
    const thumbCol = slice % 3;
    piece.style.backgroundImage = `url(${imgURL})`;
    piece.style.backgroundSize = '300% 300%';
    piece.style.backgroundPosition = `${thumbCol * 50}% ${thumbRow * 50}%`;

    // Label com o número (algarismo)
    const label = document.createElement("div");
    label.className = "label";
    label.textContent = String(item.a);
    piece.appendChild(label);

    piece.addEventListener("dragstart", e => {
      window.draggedPiece = piece;
      e.dataTransfer.setData("text/plain", String(item.a));
    });

    piece.addEventListener("dragend", () => {
      window.draggedPiece = null;
    });

    piecesDiv.appendChild(piece);
  });
}

// Botões
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);