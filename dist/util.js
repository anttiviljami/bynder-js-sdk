'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
function basename(path) {
    return path.substr(path.lastIndexOf('/') + 1);
}

exports.default = {
    basename: basename
};