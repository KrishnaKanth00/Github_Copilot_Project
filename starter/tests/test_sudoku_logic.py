import sudoku_logic


def is_valid_board(board):
    for row in board:
        if sorted(row) != list(range(1, 10)):
            return False

    for col in range(sudoku_logic.SIZE):
        values = [board[row][col] for row in range(sudoku_logic.SIZE)]
        if sorted(values) != list(range(1, 10)):
            return False

    for box_row in range(0, sudoku_logic.SIZE, 3):
        for box_col in range(0, sudoku_logic.SIZE, 3):
            values = []
            for row in range(box_row, box_row + 3):
                for col in range(box_col, box_col + 3):
                    values.append(board[row][col])
            if sorted(values) != list(range(1, 10)):
                return False

    return True


def test_create_empty_board_is_9x9_zero_grid():
    board = sudoku_logic.create_empty_board()

    assert len(board) == 9
    assert all(len(row) == 9 for row in board)
    assert all(cell == 0 for row in board for cell in row)


def test_is_safe_rejects_duplicate_numbers_in_row_col_and_box():
    board = sudoku_logic.create_empty_board()
    board[0][0] = 5
    board[0][1] = 6
    board[0][2] = 7
    board[1][0] = 8
    board[1][1] = 9

    assert sudoku_logic.is_safe(board, 0, 1, 5) is False
    assert sudoku_logic.is_safe(board, 1, 1, 5) is False


def test_generate_puzzle_returns_a_complete_valid_solution():
    puzzle, solution = sudoku_logic.generate_puzzle(35)

    assert len(puzzle) == sudoku_logic.SIZE
    assert len(solution) == sudoku_logic.SIZE
    assert all(len(row) == sudoku_logic.SIZE for row in puzzle)
    assert all(len(row) == sudoku_logic.SIZE for row in solution)
    assert is_valid_board(solution)
    assert any(cell == 0 for row in puzzle for cell in row)
