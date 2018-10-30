''' portfolio site app '''
from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def mainpage():
    ''' render the home page '''
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=4444)
