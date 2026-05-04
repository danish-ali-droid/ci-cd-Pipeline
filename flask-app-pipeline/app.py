from flask import Flask
import os
import socket

app = Flask(__name__)

@app.get("/")
def hello():
  
    node_name = socket.gethostname()
    return f"<h1> Flask App is Runnig...</h1>"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
