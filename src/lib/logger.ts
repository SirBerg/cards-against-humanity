import chalk from "chalk";

//const dotenv = require("dotenv");
type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";
type JSONLog = {
    level: LogLevel;
    message: string;
    timestamp: string;
}
export class Logger{
    private static logLevel: number = 1;
    private static jsonLogging: boolean = true;
    private static processIsBrowser: boolean = false;
    private static logLevelMap: any = {
        "DEBUG": 1,
        "INFO": 2,
        "WARN": 3,
        "ERROR": 4
    };

    private static logLevelColorMap: any = {
        "DEBUG": chalk.bgGray,
        "INFO": chalk.bgGreen,
        "WARN": chalk.bgYellow,
        "ERROR": chalk.bgRed
    };

    private static browserLogLevelColorMap: any = {
        "DEBUG": "b2a09c",
        "INFO": "3da11d",
        "WARN": "ffff00",
        "ERROR": "ff0000"
    }
    private static verbColorMap: any = {
        "GET": chalk.bgGreenBright,
        "POST": chalk.bgYellowBright,
        "PUT": chalk.bgCyanBright,
        "PATCH": chalk.bgMagentaBright,
        "DELETE": chalk.bgRedBright,
        "HEAD": chalk.bgBlackBright,
        "OPTIONS": chalk.bgCyanBright,
        "WS": chalk.bgCyan
    }
    public setLogLevel(level: LogLevel){
        if(!Logger.logLevelMap[level]){
            throw new Error(`${chalk.bgRed("ERROR:")} Invalid log level: ${level}`);
        }
        Logger.logLevel = Logger.logLevelMap[level];
    }
    public setJsonLogging(jsonLogging: boolean){
        Logger.jsonLogging = jsonLogging;
    }
    public setProcessIsBrowser(processIsBrowser: boolean){
        Logger.processIsBrowser = processIsBrowser;
    }
    log(level:LogLevel, message: string){
        if(Logger.logLevelMap[level] < Logger.logLevel){
            return;
        }
        if(Logger.jsonLogging){
            console.log(JSON.stringify({
                level,
                message,
                timestamp: new Date().toISOString()
            } as JSONLog));
            return
        }

        //Handle browser logging
        if(Logger.processIsBrowser){
            console.log(`%c${new Date().toISOString()} %c${level} %c${message}`, `color: grey`, `background-color: #${Logger.browserLogLevelColorMap[level]}`, `color: white`);
        }
        else{
            console.log(chalk.grey(`${new Date().toISOString()}`), Logger.logLevelColorMap[level](`${level}`), message);
        }

    }

    public debug(message: string){
        this.log('DEBUG', message);
    }
    public info(message: string){
        this.log('INFO', message);
    }
    public warn(message: string){
        this.log('WARN', message);
    }
    public error(message: string){
        this.log('ERROR', message);
    }
    logRequest(endpoint:string, method:string){
        if(Logger.jsonLogging){
            this.log('DEBUG', `${method} ${endpoint}`);
        }
        else{
            console.log(chalk.grey(`${new Date().toISOString()}`), `${Logger.verbColorMap[method](method)} `, endpoint);
        }
    }
    constructor() {
        //dotenv.config()
    }
}
