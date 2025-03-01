# Win10Diagnose

## Prerequisites
Before starting, make sure you have:
  - Node.js and npm installed
```
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y curl
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
```
  - An OpenAI API key (you can sign up on OpenAI’s website to obtain one)
  - Basic familiarity with JavaScript, HTML, and Node.js

## Initialize a Node.js Project
  - Initialize your project with npm:
```
     npm init -y
```
## Install Dependencies
  - Install Express (to set up a simple server), dotenv (for environment variables), and axios (for HTTP requests, although you could also use node-fetch):
```
     npm install openai
     npm install express dotenv axios
```
Note: You can also use the official OpenAI SDK if preferred.

### Add `.env`
```
DB_HOST=localhost
DB_USER=Win10Diag
DB_PASS=apasssword
DB_NAME=diagnostics
PORT=3000
OPENAI_API_KEY=akey...
```

## Set up Database
### Install:
```
npm install mysql2
sudo apt update && sudo apt install mariadb-server
```

### Add User:
```
CREATE USER 'newuser'@'localhost' IDENTIFIED BY 'newpassword';
```
### Add Database:
```
create database diagnostics;
USE diagnostics;

CREATE TABLE IF NOT EXISTS solution_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_description TEXT NOT NULL,
    solution_id INT NOT NULL,
    success_count INT DEFAULT 1,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    solution_text TEXT,
    UNIQUE (problem_description, solution_id)
);

CREATE TABLE solutions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_description TEXT NOT NULL,
    solution_text TEXT NOT NULL,
    success_count INT DEFAULT 0
);

GRANT ALL PRIVILEGES ON diagnostics.* TO 'newuser'@'%' IDENTIFIED BY 'newpassword';
```
