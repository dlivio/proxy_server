const express = require('express');
const morgan = require("morgan");
const urllib = require('urllib');

// Create Express Server
const app = express();

/* Configuration */
const PORT = 3000;
const HOST = '0.0.0.0';
const API_SERVICE_URL = "https://jsonplaceholder.typicode.com";

// Camera ip and port
const BASE_URL = "http://5.249.35.182:3333";
// Camera authentication
const DIGEST_AUTH = "user:user1234";
// Stream uri
const STREAM_URL = "/cgi-bin/mjpg/video.cgi?channel=1&subtype=1";
// Camera control uri
const CAMERA_CONTROL_URL_PRE_PART_1 = "/cgi-bin/ptz.cgi?action=";
const CAMERA_CONTROL_URL_PRE_PART_2 = "&channel=1&code=";
// Movement uri's
const CODE_UP = "Up";
const CODE_DOWN = "Down";
const CODE_LEFT = "Left";
const CODE_RIGHT = "Right";
const CODE_LEFT_UP = "LeftUp";
const CODE_RIGHT_UP = "RightUp";
const CODE_LEFT_DOWN = "LeftDown";
const CODE_RIGHT_DOWN = "RightDown";

const MOVEMENT_BASIC_URL_POST = "&arg1=0&arg2=1&arg3=0";
const MOVEMENT_COMPLEX_URL_POST = "&arg1=1&arg2=1&arg3=0";
// Zoom uri's
const CODE_ZOOM_IN = "ZoomTele";
const CODE_ZOOM_OUT = "ZoomWide";
const ZOOM_URL_POST = "&arg1=0&arg2=0&arg3=0";
// Other
const BASE_URL2 = 'http://5.249.35.182:3333/cgi-bin/mjpg/video.cgi?channel=1&subtype=1';
const BASE_URL3 = 'http://admin:admin1234@5.249.35.182:3333/cgi-bin/mjpg/video.cgi?channel=1&subtype=1';

/* Logging */
app.use(morgan('dev'));

/**
 * TODO:
 * - Add method to move camera that receives target IP
 * - Change IPCameras table in User Doctype to choose predefined IPCameras
 * - Make Desk app to see all IPCameras
 * - Improve performance with expressjs guidelines
 *
 */

/* Info GET endpoint */
app.get('/info', (req, res, next) => {
    res.send('This is a proxy service which proxies to Dahua IP Camera APIs.');
});

/* Authorization */
/*
app.use('', (req, res, next) => {
   if (req.headers.authorization) {
       next();
   } else {
       res.sendStatus(403);
   }
});
*/

/* Proxy endpoints */
app.use('/camera/1', (req, res, next) => {

    urllib.request(BASE_URL + STREAM_URL, {
        digestAuth: DIGEST_AUTH,
        streaming: true,
    }, function (err, _, res2) {
        // Catch connection errors (connection timeouts due to the camera being offline)
        if (err) {
            console.log(err.stack);
            res.writeHead(504); // Gateway Timeout
            res.end();
            return;
        }

        // Initialize the headers needed for the MJPG stream
        res.setHeader('Content-Type', 'multipart/x-mixed-replace;boundary=myboundary');
        res.setHeader('Connection', 'close');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Cache-Control', 'no-cache, private');
        res.setHeader('Expires', 0);
        res.setHeader('Max-Age', 0);

        // Write the chunks of data that arrive to the response
        res2.on('data', function (chunk) {
            res.write(chunk);
        });
        // Close the response when the stream finishes or the client closes it
        res2.on('end', function () {
            res.writeHead(res2.statusCode);
            res.end();
            next();
        });
        res2.on('close', function () {
            res.end();
            next();
        })
    });

});

app.use('/camera/:ip', (req, res, next) => {

    urllib.request("http://" + req.params.ip + STREAM_URL, {
        digestAuth: DIGEST_AUTH,
        streaming: true,
    }, function (err, _, res2) {
        // Catch connection errors (connection timeouts due to the camera being offline)
        if (err) {
            console.log(err.stack);
            res.writeHead(504); // Gateway Timeout
            res.end();
            return;
        }

        // Initialize the headers needed for the MJPG stream
        res.setHeader('Content-Type', 'multipart/x-mixed-replace;boundary=myboundary');
        res.setHeader('Connection', 'close');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Cache-Control', 'no-cache, private');
        res.setHeader('Expires', 0);
        res.setHeader('Max-Age', 0);

        // Write the chunks of data that arrive to the response
        res2.on('data', function (chunk) {
            res.write(chunk);
        });
        // Close the response when the stream finishes or the client closes it
        res2.on('end', function () {
            res.writeHead(res2.statusCode);
            res.end();
            next();
        });
        res2.on('close', function () {
            res.end();
            next();
        })
    });

});

app.use('/move/:command/:direction', (req, res, next) => {

    // Interpret the command (start/stop)
    var commandCode;

    switch(req.params.command) {
        case "start":
            commandCode = "start";
            break;
        case "stop":
            commandCode = "stop";
            break;
        default:
            console.log("Unrecognized command.");
            res.writeHead(404); // Not Found
            res.end();
            return;
    }

    console.log("Command chosen: " + commandCode);

    // Interpret direction requested
    var directionCode;
    var movement_url_post = MOVEMENT_BASIC_URL_POST;

    switch(req.params.direction) {
        case "up":
            directionCode = CODE_UP;
            break;
        case "down":
            directionCode = CODE_DOWN;
            break;
        case "left":
            directionCode = CODE_LEFT;
            break;
        case "right":
            directionCode = CODE_RIGHT;
            break;
        case "leftUp":
            directionCode = CODE_LEFT_UP;
            movement_url_post = MOVEMENT_COMPLEX_URL_POST;
            break;
        case "rightUp":
            directionCode = CODE_RIGHT_UP;
            movement_url_post = MOVEMENT_COMPLEX_URL_POST;
            break;
        case "leftDown":
            directionCode = CODE_LEFT_DOWN;
            movement_url_post = MOVEMENT_COMPLEX_URL_POST;
            break;
        case "rightDown":
            directionCode = CODE_RIGHT_DOWN;
            movement_url_post = MOVEMENT_COMPLEX_URL_POST;
            break;
        default:// direction error response
            console.log("Unrecognized direction.");
            res.writeHead(404); // Not Found
            res.end();
            return;
    }

    console.log("Code chosen: " + directionCode);

    urllib.request(BASE_URL + CAMERA_CONTROL_URL_PRE_PART_1 + commandCode + CAMERA_CONTROL_URL_PRE_PART_2 + directionCode + movement_url_post, {
        digestAuth: DIGEST_AUTH
    }, function (err, _, res2) {
        // Catch connection errors (connection timeouts due to the camera being offline)
        if (err) {
            console.log(err.stack);
            res.writeHead(504); // Gateway Timeout
            res.end();
            return;
        }

        // Write server response
        res.writeHead(res2.statusCode);
        res.end();
        next();
    });

});

app.use('/zoom/:command/:direction', (req, res, next) => {

    // Interpret the command (start/stop)
    var commandCode;

    switch(req.params.command) {
        case "start":
            commandCode = "start";
            break;
        case "stop":
            commandCode = "stop";
            break;
        default:
            console.log("Unrecognized command.");
            res.writeHead(404); // Not Found
            res.end();
            return;
    }

    console.log("Command chosen: " + commandCode);

    // Interpret direction requested
    var directionCode;

    switch(req.params.direction) {
        case "in":
            directionCode = CODE_ZOOM_IN;
            break;
        case "out":
            directionCode = CODE_ZOOM_OUT;
            break;
        default:
            console.log("Unrecognized direction.");
            res.writeHead(404); // Not Found
            res.end();
            return;
    }

    console.log("Code chosen: " + directionCode);

    urllib.request(BASE_URL + CAMERA_CONTROL_URL_PRE_PART_1 + commandCode + CAMERA_CONTROL_URL_PRE_PART_2 + directionCode + ZOOM_URL_POST, {
        digestAuth: DIGEST_AUTH
    }, function (err, _, res2) {
         // Catch connection errors (connection timeouts due to the camera being offline)
         if (err) {
            console.log(err.stack);
            res.writeHead(504); // Gateway Timeout
            res.end();
            return;
        }

        // Write server response
        res.writeHead(res2.statusCode);
        res.end();
        next();
    });

});

/* Start the Proxy */
app.listen(PORT, HOST, () => {
    console.log(`Starting Proxy at ${HOST}:${PORT}`);
});
