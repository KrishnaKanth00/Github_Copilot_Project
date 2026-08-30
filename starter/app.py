import random
import time

from flask import Flask, render_template, jsonify, request
import sudoku_logic

app = Flask(__name__)

DIFFICULTY_SETTINGS = {
    'easy': 40,
    'medium': 35,
    'hard': 24,
}

# Keep a simple in-memory store for current puzzle and solution
CURRENT = {
    'puzzle': None,
    'solution': None,
    'started_at': None,
    'difficulty': 'medium',
    'clues': DIFFICULTY_SETTINGS['medium'],
    'hints': set()
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/new')
def new_game():
    difficulty = request.args.get('difficulty', 'medium').lower()
    if difficulty not in DIFFICULTY_SETTINGS:
        difficulty = 'medium'

    clues = DIFFICULTY_SETTINGS[difficulty]
    puzzle, solution = sudoku_logic.generate_puzzle(clues)
    CURRENT['puzzle'] = puzzle
    CURRENT['solution'] = solution
    CURRENT['started_at'] = time.time()
    CURRENT['difficulty'] = difficulty
    CURRENT['clues'] = clues
    CURRENT['hints'] = set()
    return jsonify({
        'puzzle': puzzle,
        'started_at': CURRENT['started_at'],
        'difficulty': difficulty,
        'clues': clues,
    })

@app.route('/hint', methods=['POST'])
def get_hint():
    data = request.get_json(silent=True) or {}
    board = CURRENT.get('puzzle')
    solution = CURRENT.get('solution')
    if solution is None or board is None:
        return jsonify({'error': 'No game in progress'}), 400

    row = data.get('row')
    col = data.get('col')

    if row is None or col is None:
        empties = [(r, c) for r in range(sudoku_logic.SIZE) for c in range(sudoku_logic.SIZE) if board[r][c] == 0]
        if not empties:
            return jsonify({'error': 'No empty cells available for a hint'}), 400
        row, col = random.choice(empties)
    else:
        try:
            row = int(row)
            col = int(col)
        except (TypeError, ValueError):
            return jsonify({'error': 'Row and col must be integers'}), 400

        if not (0 <= row < sudoku_logic.SIZE and 0 <= col < sudoku_logic.SIZE):
            return jsonify({'error': 'Cell is out of bounds'}), 400

    value = solution[row][col]
    board[row][col] = value
    CURRENT['hints'].add((row, col))

    return jsonify({
        'row': row,
        'col': col,
        'value': value,
        'is_hint': True,
    })

@app.route('/check', methods=['POST'])
def check_solution():
    data = request.json
    board = data.get('board')
    solution = CURRENT.get('solution')
    if solution is None:
        return jsonify({'error': 'No game in progress'}), 400

    incorrect = []
    for i in range(sudoku_logic.SIZE):
        for j in range(sudoku_logic.SIZE):
            value = board[i][j]
            if value == 0 or value != solution[i][j]:
                incorrect.append([i, j])

    elapsed_seconds = 0.0
    started_at = CURRENT.get('started_at')
    if started_at is not None:
        elapsed_seconds = max(0.0, time.time() - started_at)

    return jsonify({
        'incorrect': incorrect,
        'elapsed_seconds': round(elapsed_seconds, 2)
    })

if __name__ == '__main__':
    app.run(debug=True)