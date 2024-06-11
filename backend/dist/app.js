"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cors_1 = __importDefault(require("cors"));
if (typeof (__dirname) === 'undefined') {
    __dirname = path_1.default.resolve(path_1.default.dirname(''));
}
const run = () => {
    let app = (0, express_1.default)();
    app.use((0, cors_1.default)({
        credentials: true,
        origin: true
    }));
    app.get('/', (request, response) => {
        response.send('HELLO WORLD');
    });
    app.get('/getAppleMusicDevToken', (req, res) => {
        // sign dev token
        const privateKey = fs_1.default.readFileSync(path_1.default.join(__dirname + '/config/apple_private_key.p8')).toString();
        // TODO: Remove secret
        const config = JSON.parse('' + fs_1.default.readFileSync(path_1.default.join(__dirname + '/config/apple-music-api.config.json')));
        const jwtToken = jsonwebtoken_1.default.sign({}, privateKey, {
            algorithm: "ES256",
            expiresIn: "180d",
            issuer: config.teamID,
            header: {
                alg: "ES256",
                kid: config.keyID
            }
        });
        res.send(jwtToken);
    });
    app.use((request, response, next) => {
        response.status(404).send('ERR_NOT_FOUND');
        // response.sendFile( path.join( __dirname + '' ) ) 
    });
    const PORT = process.env.PORT || 8081;
    app.listen(PORT);
};
exports.default = {
    run
};
