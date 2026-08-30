from copy import deepcopy

from app import CURRENT


def test_index_route_returns_html(client):
    response = client.get("/")

    assert response.status_code == 200
    assert response.mimetype == "text/html"
    assert b'Check' in response.data
    assert b'theme-toggle' in response.data
    assert b'Top 10' in response.data


def test_new_game_generates_a_board(client):
    response = client.get("/new?clues=35")

    assert response.status_code == 200
    payload = response.get_json()
    assert isinstance(payload, dict)
    assert "puzzle" in payload

    puzzle = payload["puzzle"]
    assert len(puzzle) == 9
    assert all(len(row) == 9 for row in puzzle)
    assert all(cell in range(0, 10) for row in puzzle for cell in row)
    assert CURRENT["solution"] is not None


def test_check_solution_requires_active_game(client):
    payload = {"board": [[0 for _ in range(9)] for _ in range(9)]}

    response = client.post("/check", json=payload)

    assert response.status_code == 400
    assert response.get_json()["error"] == "No game in progress"


def test_check_solution_reports_incorrect_cells(client):
    client.get("/new?clues=35")
    solution = deepcopy(CURRENT["solution"])
    solution[0][0] = (solution[0][0] % 9) + 1

    response = client.post("/check", json={"board": solution})

    assert response.status_code == 200
    payload = response.get_json()
    assert [0, 0] in payload["incorrect"]


def test_check_solution_flags_empty_cells_as_incorrect(client):
    client.get("/new?clues=35")
    board = deepcopy(CURRENT["solution"])
    board[0][0] = 0

    response = client.post("/check", json={"board": board})

    assert response.status_code == 200
    payload = response.get_json()
    assert [0, 0] in payload["incorrect"]


def test_new_game_returns_started_time_and_check_reports_elapsed_time(client):
    response = client.get("/new?clues=35")

    assert response.status_code == 200
    payload = response.get_json()
    assert "started_at" in payload
    assert isinstance(payload["started_at"], float)

    completed_board = deepcopy(CURRENT["solution"])
    check_response = client.post("/check", json={"board": completed_board})

    assert check_response.status_code == 200
    check_payload = check_response.get_json()
    assert "elapsed_seconds" in check_payload
    assert check_payload["incorrect"] == []
    assert check_payload["elapsed_seconds"] >= 0


def test_new_game_uses_selected_difficulty(client):
    response = client.get("/new?difficulty=hard")

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["difficulty"] == "hard"
    assert payload["clues"] == 24


def test_hint_returns_one_valid_cell_and_marks_it_as_hint(client):
    client.get("/new?difficulty=easy")
    board = CURRENT["puzzle"]

    for row in range(9):
        for col in range(9):
            if board[row][col] == 0:
                response = client.post("/hint", json={"row": row, "col": col})
                assert response.status_code == 200
                payload = response.get_json()
                assert payload["row"] == row
                assert payload["col"] == col
                assert payload["value"] == CURRENT["solution"][row][col]
                assert payload["is_hint"] is True
                return

    assert False, "Expected at least one empty cell for a hint" 
