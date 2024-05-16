const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const app = express();
const port = 3030;
const cors = require('cors');

app.use(cors({
    origin: '*',
    credentials: true,
    optionsSuccessStatus: 200,
  }));

app.use(express.json()); // JSONのリクエストボディを受け取るために必要

const paramOfUrl = process.env.paramOfUrl;
// ユーザーからのコード実行リクエストを受け取るルート
app.post('/execute', async (req, res) => {
    const { command, DirOfUsersCode } = req.body;
    try {
        const result = await catchObject(command, DirOfUsersCode);
        res.json({ result });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

const catchObject = async function(command, DirOfUsersCode) {
    try {
        const result = await executeCode(DirOfUsersCode, command);
        console.log(result);
        return result;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

async function executeCode(DirOfUsersCode, command) {
    return new Promise((resolve, reject) => {
        process.chdir(DirOfUsersCode);
        exec(command, async (error, stdout, stderr) => {
            const result = [
                stdout ? stdout.trim() : '',
                stderr ? stderr.trim() : ''
            ];
            try {
                const finalResult = await returnUsersAnswer(DirOfUsersCode, result);
                resolve(finalResult);
            } catch (error) {
                reject(error);
            }
        });
    });
}

function returnUsersAnswer(directoryName, result) {
    return new Promise((resolve, reject) => {
        const fileNames = fs.readdirSync(directoryName, { encoding: 'utf-8' });
        let usersAnswer = [];
        for (let i = 0; i < fileNames.length; i++) {
            const contents = fs.readFileSync(path.join(directoryName, fileNames[i]), { encoding: 'utf-8' });
            usersAnswer.push({ files: fileNames[i], contents: contents });
        }
        process.chdir('/app');
        const finalResult = resultOfAPI(result, usersAnswer);
        resolve(finalResult);
    });
}

function resultOfAPI(result, parsedUsersAnswer) {
    const arrayResult = [result, parsedUsersAnswer];
    return JSON.stringify(arrayResult);
}

app.listen(port, '0.0.0.0', () => {
    console.log(`App listening at http://0.0.0.0:${port}/execute/${paramOfUrl}`);
});
