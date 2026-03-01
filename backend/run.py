import uvicorn

if __name__ == "__main__":
    # This entry point makes it easy to run the modular application
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
