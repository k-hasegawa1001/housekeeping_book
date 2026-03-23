from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "FastAPI is running behind Nginx!"}

@app.get("/test")
def test_endpoint():
    return {"message": "This is a test endpoint."}