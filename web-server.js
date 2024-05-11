#!/usr/bin/env node
import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
import webhandleInit from "webhandle/app.js";
import startHttpServer from "webhandle/server-start.js";
import addRoutes from "./server-js/add-routes.js";

let app = webhandleInit(__dirname, (err, webhandle) => {
	addRoutes(webhandle.router)
})
startHttpServer(app)
