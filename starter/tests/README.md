# Test framework

This project uses pytest for automated tests.

## How to run

From the starter folder:

```bash
pytest -q
```

## How to add a new feature test

1. Create a new file in the tests directory named `test_<feature>.py`.
2. Use the `client` fixture from `conftest.py` to call routes.
3. Keep each test focused on one behavior.
4. Run the specific test before and after the feature change.

Example:

```python

def test_new_feature(client):
    response = client.get("/new")
    assert response.status_code == 200
```

## Recommended workflow

- Write a failing test for the new feature.
- Implement the smallest fix.
- Re-run only the relevant test file.
- Run the full suite before merging.
