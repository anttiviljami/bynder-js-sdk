'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('isomorphic-form-data');

var _oauth = require('oauth-1.0a');

var _oauth2 = _interopRequireDefault(_oauth);

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _path = require('path');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var defaultAssetsNumberPerPage = 50;

/**
 * Rejects the request.
 * @return {Promise} error - Returns a Promise with the details for wrong base URL.
 */
function rejectURL() {
    return Promise.reject({
        status: 0,
        message: 'The base URL provided is not valid'
    });
}

/**
 * Rejects the request.
 * @return {Promise} error - Returns a Promise with the details for the wrong request.
 */
function rejectValidation(module, param) {
    return Promise.reject({
        status: 0,
        message: 'The ' + module + ' ' + param + ' is not valid or it was not specified properly'
    });
}

/**
 * @classdesc Represents an API call.
 * @class
 * @abstract
 */

var APICall = function () {
    /**
     * Create a APICall.
     * @constructor
     * @param {string} baseURL - A string with the base URL for account.
     * @param {string} url - A string with the name of the API method.
     * @param {string} method - A string with the method of the API call.
     * @param {Object} consumerToken - An object with both the public and secret consumer keys.
     * @param {Object} accessToken - An object with both the public and secret access keys.
     * @param {Object} [data={}] - An object containing the query parameters.
     */
    function APICall(baseURL, url, method, consumerToken, accessToken) {
        var data = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {};

        _classCallCheck(this, APICall);

        this.requestData = {};
        this.callURL = this.requestData.url = baseURL + url;
        this.method = this.requestData.method = method;
        this.consumerToken = consumerToken;
        this.accessToken = accessToken;
        this.data = data;
    }

    /**
     * Creates the Authorization header.
     * @return {Object} header - Returns an object with the Authorization header and its signed content.
     */


    _createClass(APICall, [{
        key: 'createAuthHeader',
        value: function createAuthHeader() {
            var oauth = new _oauth2.default({
                consumer: {
                    public: this.consumerToken.public,
                    secret: this.consumerToken.secret
                }
            });
            return oauth.toHeader(oauth.authorize(this.requestData, this.accessToken));
        }

        /**
         * Encode the data object to URI.
         * @return {string} - Returns the URI string equivalent to the data object of the request.
         */

    }, {
        key: 'urlEncodeData',
        value: function urlEncodeData() {
            var requestBody = '';
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = Object.keys(this.data)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var key = _step.value;

                    var value = this.data[key];
                    if (value === undefined) {
                        delete this.data[key];
                    } else {
                        requestBody += encodeURIComponent(key) + '=' + encodeURIComponent(value) + '&';
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            requestBody = requestBody.slice(0, -1);
            return requestBody;
        }

        /**
         * Fetch the information from the API.
         * @return {Promise} - Returns a Promise that, when fulfilled, will either return an JSON Object with the requested
         * data or an Error with the problem.
         */

    }, {
        key: 'send',
        value: function send() {
            var paramEncoded = this.urlEncodeData();
            this.requestData.data = this.data;
            var headers = this.createAuthHeader();
            var body = '';
            if (this.method === 'POST') {
                headers['Content-Type'] = 'application/x-www-form-urlencoded';
                body = paramEncoded;
            } else if (Object.keys(this.data).length && this.data.constructor === Object) {
                this.callURL += '?';
                this.callURL += paramEncoded;
            }

            return (0, _axios2.default)(this.callURL, {
                method: this.method,
                data: body,
                headers: headers
            }).then(function (response) {
                if (response.status >= 400) {
                    // check for 4XX, 5XX, wtv
                    return Promise.reject({
                        status: response.status,
                        message: response.statusText
                    });
                }
                if (response.status >= 200 && response.status <= 202) {
                    return response.data;
                }
                return {};
            });
        }
    }]);

    return APICall;
}();

var bodyTypes = {
    BUFFER: 'BUFFER',
    BLOB: 'BLOB',
    STREAM: 'STREAM',
    /**
     * @param {Object} body - The file body whose type we need to determine
     * @return {string} One of bodyTypes.BUFFER, bodyTypes.BLOB, bodyTypes.STREAM
     */
    get: function get(body) {
        if (typeof Buffer !== 'undefined' && Buffer.isBuffer(body)) {
            return bodyTypes.BUFFER;
        }
        if (typeof window !== 'undefined' && window.Blob && body instanceof window.Blob) {
            return bodyTypes.BLOB;
        }
        if (typeof body.read === 'function') {
            return bodyTypes.STREAM;
        }
        return null;
    }
};

/**
 * @return {number} length - The amount of data that can be read from the file
 */

function getLength(file) {
    var body = file.body,
        length = file.length;

    var bodyType = bodyTypes.get(body);
    if (bodyType === bodyTypes.BUFFER) {
        return body.length;
    }
    if (bodyType === bodyTypes.BLOB) {
        return body.size;
    }
    return length;
}

/**
 * @classdesc Represents the Bynder SDK. It allows the user to make every call to the API with a single function.
 * @class
 */

var Bynder = function () {
    /**
     * Create Bynder SDK.
     * @constructor
     * @param {String} options.consumer.public - The public consumer key.
     * @param {String} options.consumer.secret - The consumer secret.
     * @param {String} options.accessToken.public - The access token.
     * @param {String} options.accessToken.secret - The access token secret.
     * @param {String} options.baseURL - The URL with the account domain.
     * @param {Object} options - An object containing the consumer keys, access keys and the base URL.
     */
    function Bynder(options) {
        _classCallCheck(this, Bynder);

        this.consumerToken = options.consumer;
        this.accessToken = options.accessToken;
        this.baseURL = options.baseURL;
    }

    /**
     * Check if the API URL is valid.
     * @return {Boolean} - Returns a boolean corresponding the URL correctness.
     */


    _createClass(Bynder, [{
        key: 'validURL',
        value: function validURL() {
            return this.baseURL;
        }

        /**
         * Get all the categories.
         * @see {@link http://docs.bynder.apiary.io/#reference/categories/retrieve-categories/retrieve-categories|API Call}
         * @return {Promise} Categories - Returns a Promise that, when fulfilled, will either return an Array with the
         * categories or an Error with the problem.
         */

    }, {
        key: 'getCategories',
        value: function getCategories() {
            if (!this.validURL()) {
                return rejectURL();
            }
            var request = new APICall(this.baseURL, 'v4/categories/', 'GET', this.consumerToken, this.accessToken);
            return request.send();
        }

        /**
         * Login to retrieve OAuth credentials.
         * @see {@link http://docs.bynder.apiary.io/#reference/users/-deprecated-login-a-user-retrieve-coupled-oauth-credentials/login-a-user|API Call}
         * @param {Object} queryObject={} - An object containing the credentials with which the user intends to login.
         * @param {String} queryObject.username - The username of the user.
         * @param {String} queryObject.password - The password of the user.
         * @param {String} queryObject.consumerId - The consumerId of the user.
         * @return {Promise} Credentials - Returns a Promise that, when fulfilled, will either return an Object with the
         * OAuth credentials for login or an Error with the problem.
         */

    }, {
        key: 'userLogin',
        value: function userLogin(queryObject) {
            if (!this.validURL()) {
                return rejectURL();
            }
            if (!queryObject.username || !queryObject.password || !queryObject.consumerId) {
                return rejectValidation('authentication', 'username, password or consumerId');
            }
            var request = new APICall(this.baseURL, 'v4/users/login/', 'POST', this.consumerToken, this.accessToken, queryObject);
            return request.send();
        }

        /**
         * Get the request token and secret.
         * @see {@link http://docs.bynder.apiary.io/#reference/consumers-and-access-tokens/1-obtain-a-request-token-pair/obtain-a-request-token-pair|API Call}
         * @return {Promise} Credentials - Returns a Promise that, when fulfilled, will either return an string with the
         * couple of consumer token/secret or an Error with the problem.
         */

    }, {
        key: 'getRequestToken',
        value: function getRequestToken() {
            if (!this.validURL()) {
                return rejectURL();
            }
            var request = new APICall(this.baseURL, 'v4/oauth/request_token/', 'POST', this.consumerToken, {
                public: null,
                secret: null
            });
            return request.send();
        }

        /**
         * Get the URL to authorise the token.
         * @see {@link http://docs.bynder.apiary.io/#reference/consumers-and-access-tokens/2-authorise-authenticate/authorise-&-authenticate|API Call}
         * @param {String} token - The token to be authorised.
         * @param {String} [callback] - The callback to which the page will be redirected after authenticating the token.
         * @return {String} URL - Returns a String with the URL to the token authorisation page.
         */

    }, {
        key: 'getAuthorisedURL',
        value: function getAuthorisedURL(token) {
            var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

            if (!this.validURL()) {
                return this.baseURL;
            }
            var authoriseToken = this.baseURL + 'v4/oauth/authorise/?oauth_token=' + token;
            if (callback) {
                authoriseToken += '&callback=' + callback;
            }
            return authoriseToken;
        }

        /**
         * Get the access token and secret.
         * @see {@link http://docs.bynder.apiary.io/#reference/consumers-and-access-tokens/3-exchange-the-request-token-pair-for-an-access-token-pair/exchange-the-request-token-pair-for-an-access-token-pair|API Call}
         * @param {string} token - A string containing the authorised token provided by the API.
         * @param {string} secret - A string containing the authorised secret provided by the API.
         * @return {Promise} Credentials - Returns a Promise that, when fulfilled, will either return an Object with the
         * OAuth credentials for login or an Error with the problem.
         */

    }, {
        key: 'getAccessToken',
        value: function getAccessToken(token, secret) {
            if (!this.validURL()) {
                return rejectURL();
            }
            var request = new APICall(this.baseURL, 'v4/oauth/access_token/', 'POST', this.consumerToken, {
                public: token,
                secret: secret
            });
            return request.send();
        }

        /**
         * Get the assets according to the parameters provided.
         * @see {@link http://docs.bynder.apiary.io/#reference/assets/asset-operations/retrieve-assets|API Call}
         * @param {Object} [queryObject={}] - An object containing the parameters accepted by the API to narrow the query.
         * @return {Promise} Assets - Returns a Promise that, when fulfilled, will either return an Array with the assets or
         * an Error with the problem.
         */

    }, {
        key: 'getMediaList',
        value: function getMediaList() {
            var queryObject = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

            var parametersObject = queryObject;
            if (!this.validURL()) {
                return rejectURL();
            }
            parametersObject.count = false; // The API will return a different response format in case this is true
            if (Array.isArray(parametersObject.propertyOptionId)) {
                parametersObject.propertyOptionId = parametersObject.propertyOptionId.join();
            }
            var request = new APICall(this.baseURL, 'v4/media/', 'GET', this.consumerToken, this.accessToken, parametersObject);
            return request.send();
        }

        /**
         * Get the assets information according to the id provided.
         * @see {@link http://docs.bynder.apiary.io/#reference/assets/specific-asset-operations/retrieve-specific-asset|API Call}
         * @param {Object} queryObject - An object containing the id and the version of the desired asset.
         * @param {String} queryObject.id - The id of the desired asset.
         * @param {Number} [queryObject.version] - The version of the desired asset.
         * @return {Promise} Asset - Returns a Promise that, when fulfilled, will either return an Object with the asset or
         * an Error with the problem.
         */

    }, {
        key: 'getMediaInfo',
        value: function getMediaInfo(queryObject) {
            if (!this.validURL()) {
                return rejectURL();
            }
            if (!queryObject.id) {
                return rejectValidation('media', 'id');
            }
            var request = new APICall(this.baseURL, 'v4/media/' + queryObject.id + '/', 'GET', this.consumerToken, this.accessToken, { versions: queryObject.versions });
            return request.send();
        }

        /**
         * Get all the assets starting from the page provided (1 by default) and incrementing according to the offset given.
         * @see {@link http://docs.bynder.apiary.io/#reference/assets/asset-operations/retrieve-assets|API Call}
         * @param {Object} [queryObject={}] - An object containing the parameters accepted by the API to narrow the query.
         * @return {Promise} Assets - Returns a Promise that, when fulfilled, will either return an Array with all the
         * assets or an Error with the problem.
         */

    }, {
        key: 'getAllMediaItems',
        value: function getAllMediaItems() {
            var _this = this;

            var queryObject = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

            var recursiveGetAssets = function recursiveGetAssets(queryObject, assets) {
                var queryAssets = assets;
                var passingProperties = queryObject;
                passingProperties.page = !passingProperties.page ? 1 : passingProperties.page;
                passingProperties.limit = !passingProperties.limit ? defaultAssetsNumberPerPage : passingProperties.limit;

                return _this.getMediaList(passingProperties).then(function (data) {
                    queryAssets = assets.concat(data);
                    if (data && data.length === passingProperties.limit) {
                        // If the results page is full it means another one might exist
                        passingProperties.page += 1;
                        return recursiveGetAssets(passingProperties, queryAssets);
                    }
                    return queryAssets;
                }).catch(function (error) {
                    return error;
                });
            };

            return recursiveGetAssets(queryObject, []);
        }

        /**
         * Get the assets total according to the parameters provided.
         * @see {@link http://docs.bynder.apiary.io/#reference/assets/asset-operations/retrieve-assets|API Call}
         * @param {Object} [queryObject={}] - An object containing the parameters accepted by the API to narrow the query.
         * @return {Promise} Number - Returns a Promise that, when fulfilled, will either return the number of assets
         * fitting the query or an Error with the problem.
         */

    }, {
        key: 'getMediaTotal',
        value: function getMediaTotal() {
            var queryObject = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

            var parametersObject = queryObject;
            if (!this.validURL()) {
                return rejectURL();
            }
            parametersObject.count = true;
            if (Array.isArray(parametersObject.propertyOptionId)) {
                parametersObject.propertyOptionId = parametersObject.propertyOptionId.join();
            }
            var request = new APICall(this.baseURL, 'v4/media/', 'GET', this.consumerToken, this.accessToken, parametersObject);
            return request.send().then(function (data) {
                return data.count.total;
            });
        }

        /**
         * Edit an existing asset with the information provided.
         * @see {@link http://docs.bynder.apiary.io/#reference/assets/specific-asset-operations/modify-asset|API Call}
         * @param {Object} object={} - An object containing the parameters accepted by the API to change in the asset.
         * @param {String} object.id - The id of the desired asset.
         * @return {Promise} Object - Returns a Promise that, when fulfilled, will either return an empty Object in
         * case it's successful or an Error with the problem.
         */

    }, {
        key: 'editMedia',
        value: function editMedia(object) {
            if (!this.validURL()) {
                return rejectURL();
            }
            if (!object.id) {
                return rejectValidation('media', 'id');
            }
            var request = new APICall(this.baseURL, 'v4/media/', 'POST', this.consumerToken, this.accessToken, object);
            return request.send();
        }

        /**
         * Get all the metaproperties
         * @see {@link http://docs.bynder.apiary.io/#reference/metaproperties/retrieve-metaproperties|API Call}
         * @param {Object} queryObject={} - An object containing the parameters accepted by the API to narrow the query.
         * @return {Promise} Metaproperties - Returns a Promise that, when fulfilled, will either return an Array with the
         * metaproperties or an Error with the problem.
         */

    }, {
        key: 'getMetaproperties',
        value: function getMetaproperties() {
            var queryObject = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

            if (!this.validURL()) {
                return rejectURL();
            }
            var request = new APICall(this.baseURL, 'v4/metaproperties/', 'GET', this.consumerToken, this.accessToken, queryObject);
            return request.send().then(function (data) {
                return Object.keys(data).map(function (metaproperty) {
                    return data[metaproperty];
                });
            });
        }

        /**
         * Get the metaproperty information according to the id provided.
         * @see {@link http://docs.bynder.apiary.io/#reference/metaproperties/specific-metaproperty-operations/retrieve-specific-metaproperty|API Call}
         * @param {Object} queryObject={} - An object containing the id of the desired metaproperty.
         * @param {String} queryObject.id - The id of the desired metaproperty.
         * @return {Promise} Metaproperty - Returns a Promise that, when fulfilled, will either return an Object with the
         * metaproperty or an Error with the problem.
         */

    }, {
        key: 'getMetaproperty',
        value: function getMetaproperty(queryObject) {
            if (!this.validURL()) {
                return rejectURL();
            }
            if (!queryObject.id) {
                return rejectValidation('metaproperty', 'id');
            }
            var request = new APICall(this.baseURL, 'v4/metaproperties/' + queryObject.id + '/', 'GET', this.consumerToken, this.accessToken);
            return request.send();
        }

        /**
         * Save a new metaproperty in the information provided.
         * @see {@link http://docs.bynder.apiary.io/#reference/metaproperties/metaproperty-operations/create-metaproperty|API Call}
         * @param {Object} object={} - An object containing the data of the new metaproperty.
         * @return {Promise} Object - Returns a Promise that, when fulfilled, will either return an empty Object in
         * case it's successful or an Error with the problem.
         */

    }, {
        key: 'saveNewMetaproperty',
        value: function saveNewMetaproperty(object) {
            if (!this.validURL()) {
                return rejectURL();
            }
            var request = new APICall(this.baseURL, 'v4/metaproperties/', 'POST', this.consumerToken, this.accessToken, { data: JSON.stringify(object) // The API requires an object with the query content stringified inside
            });
            return request.send();
        }

        /**
         * Modify new metaproperty with the information provided.
         * @see {@link https://bynder.docs.apiary.io/#reference/metaproperties/specific-metaproperty-operations/modify-metaproperty|API Call}
         * @param {Object} object={} - An object containing the data of the metaproperty.
         * @param {String} queryObject.id - The id of the desired metaproperty.
         * @return {Promise} Object - Returns a Promise that, when fulfilled, will either return an empty Object in
         * case it's successful or an Error with the problem.
         */

    }, {
        key: 'editMetaproperty',
        value: function editMetaproperty(object) {
            if (!this.validURL()) {
                return rejectURL();
            }
            if (!object.id) {
                return rejectValidation('metaproperty', 'id');
            }
            var request = new APICall(this.baseURL, 'v4/metaproperties/' + object.id + '/', 'POST', this.consumerToken, this.accessToken, { data: JSON.stringify(object) // The API requires an object with the query content stringified inside
            });
            return request.send();
        }

        /**
         * Delete the metaproperty with the provided id.
         * @see {@link http://docs.bynder.apiary.io/#reference/metaproperties/delete-metaproperty|API Call}
         * @param {Object} object={} - An object containing the id of the metaproperty to be deleted.
         * @param {String} object.id - The id of the metaproperty.
         * @return {Promise} Object - Returns a Promise that, when fulfilled, will either return an empty Object in
         * case it's successful or an Error with the problem.
         */

    }, {
        key: 'deleteMetaproperty',
        value: function deleteMetaproperty(object) {
            if (!this.validURL()) {
                return rejectURL();
            }
            if (!object.id) {
                return rejectValidation('metaproperty', 'id');
            }
            var request = new APICall(this.baseURL, 'v4/metaproperties/' + object.id + '/', 'DELETE', this.consumerToken, this.accessToken);
            return request.send();
        }

        /**
         * Add an option of metaproperty
         * @see {@link http://docs.bynder.apiary.io/#reference/metaproperties/specific-metaproperty-operations/create-metaproperty-option|API Call}
         * @param {Object} queryObject={} - An object containing the id of the desired metaproperty.
         * @param {String} queryObject.id - The id of the desired metaproperty.
         * @param {String} queryObject.name - The name of the desired metaproperty.
         * @return {Promise} Response - Returns a Promise that, when fulfilled, will either return an Object with the
         * response or an Error with the problem.
         */

    }, {
        key: 'saveNewMetapropertyOption',
        value: function saveNewMetapropertyOption(queryObject) {
            if (!this.validURL()) {
                return rejectURL();
            }
            if (!queryObject.id || !queryObject.name) {
                return rejectValidation('metaproperty option', 'id or name');
            }
            var queryBody = Object.assign({}, queryObject);
            delete queryBody.id;
            var request = new APICall(this.baseURL, 'v4/metaproperties/' + queryObject.id + '/options/', 'POST', this.consumerToken, this.accessToken, { data: JSON.stringify(queryBody) });
            return request.send();
        }

        /**
         * modify an option of metaproperty
         * @see {@link http://docs.bynder.apiary.io/#reference/metaproperties/specific-metaproperty-operations/modify-metaproperty-option|API Call}
         * @param {Object} queryObject={} - An object containing the id of the desired metaproperty.
         * @param {String} queryObject.id - The id of the desired metaproperty.
         * @param {String} queryObject.optionId - The id of the desired option.
         * @param {String} queryObject.name - The id of the desired metaproperty.
         * @return {Promise} Response - Returns a Promise that, when fulfilled, will either return an Object with the
         * response or an Error with the problem.
         */

    }, {
        key: 'editMetapropertyOption',
        value: function editMetapropertyOption(queryObject) {
            if (!this.validURL()) {
                return rejectURL();
            }
            if (!queryObject.id || !queryObject.optionId) {
                return rejectValidation('metaproperty option', 'id or optionId');
            }
            var queryBody = Object.assign({}, queryObject);
            delete queryBody.id;
            var request = new APICall(this.baseURL, 'v4/metaproperties/' + queryObject.id + '/options/' + queryObject.optionId + '/', 'POST', this.consumerToken, this.accessToken, { data: JSON.stringify(queryBody) });
            return request.send();
        }

        /**
         * delete an option of metaproperty
         * @see {@link http://docs.bynder.apiary.io/#reference/metaproperties/specific-metaproperty-operations/delete-metaproperty-option|API Call}
         * @param {Object} queryObject={} - An object containing the id of the desired metaproperty.
         * @param {String} queryObject.id - The id of the desired metaproperty.
         * @param {String} queryObject.optionId - The id of the desired option.
         * @param {String} queryObject.name - The id of the desired metaproperty.
         * @return {Promise} Response - Returns a Promise that, when fulfilled, will either return an Object with the
         * response or an Error with the problem.
         */

    }, {
        key: 'deleteMetapropertyOption',
        value: function deleteMetapropertyOption(queryObject) {
            if (!this.validURL()) {
                return rejectURL();
            }
            if (!queryObject.id || !queryObject.optionId) {
                return rejectValidation('metaproperty option', 'id or optionId');
            }
            var request = new APICall(this.baseURL, 'v4/metaproperties/' + queryObject.id + '/options/' + queryObject.optionId + '/', 'DELETE', this.consumerToken, this.accessToken);
            return request.send();
        }

        /**
         * Get all the tags
         * @see {@link http://docs.bynder.apiary.io/#reference/tags/tags-access/retrieve-entry-point|API Call}
         * @param {Object} [queryObject={}] - An object containing the parameters accepted by the API to narrow the query.
         * @return {Promise} Tags - Returns a Promise that, when fulfilled, will either return an Array with the
         * tags or an Error with the problem.
         */

    }, {
        key: 'getTags',
        value: function getTags(queryObject) {
            if (!this.validURL()) {
                return rejectURL();
            }
            var request = new APICall(this.baseURL, 'v4/tags/', 'GET', this.consumerToken, this.accessToken, queryObject);
            return request.send();
        }

        /**
         * Get collections according to the parameters provided
         * @see {@link http://docs.bynder.apiary.io/#reference/collections/collection-operations/retrieve-collections|API Call}
         * @param {Object} [queryObject={}] - An object containing the parameters accepted by the API to narrow the query.
         * @return {Promise} Collections - Returns a Promise that, when fulfilled, will either return an Array with the
         * collections or an Error with the problem.
         */

    }, {
        key: 'getCollections',
        value: function getCollections() {
            var queryObject = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

            if (!this.validURL()) {
                return rejectURL();
            }
            var request = new APICall(this.baseURL, 'v4/collections/', 'GET', this.consumerToken, this.accessToken, queryObject);
            return request.send();
        }

        /**
         * Get the collection information according to the id provided.
         * @see {@link http://docs.bynder.apiary.io/#reference/collections/specific-collection-operations/retrieve-specific-collection|API Call}
         * @param {Object} queryObject={} - An object containing the id of the desired collection.
         * @param {String} queryObject.id - The id of the desired collection.
         * @return {Promise} Collection - Returns a Promise that, when fulfilled, will either return an Object with the
         * collection or an Error with the problem.
         */

    }, {
        key: 'getCollection',
        value: function getCollection(queryObject) {
            if (!this.validURL()) {
                return rejectURL();
            }
            if (!queryObject.id) {
                return rejectValidation('collection', 'id');
            }
            var request = new APICall(this.baseURL, 'v4/collections/' + queryObject.id + '/', 'GET', this.consumerToken, this.accessToken);
            return request.send();
        }

        /**
         * Create the collection information according to the name provided.
         * @see {@link http://docs.bynder.apiary.io/#reference/collections/specific-collection-operations/create-collection|API Call}
         * @param {Object} queryObject={} - An object containing the id of the desired collection.
         * @param {String} queryObject.name - The name of the desired collection.
         * @param {String} queryObject.description - The description of the desired collection.
         * @return {Promise} Response - Returns a Promise that, when fulfilled, will either return an Object with the
         * response or an Error with the problem.
         */

    }, {
        key: 'saveNewCollection',
        value: function saveNewCollection(queryObject) {
            if (!this.validURL()) {
                return rejectURL();
            }
            if (!queryObject.name) {
                return rejectValidation('collection', 'name');
            }
            var request = new APICall(this.baseURL, 'v4/collections/', 'POST', this.consumerToken, this.accessToken, queryObject);
            return request.send();
        }

        /**
         * Add assets to the desired collection.
         * @see {@link http://docs.bynder.apiary.io/#reference/collections/specific-collection-operations/add-asset-to-a-collection|API Call}
         * @param {Object} queryObject={} - An object containing the id of the desired collection.
         * @param {String} queryObject.id - The id of the shared collection.
         * @param {String} queryObject.data - JSON-serialised list of asset ids to add.
         * @return {Promise} Response - Returns a Promise that, when fulfilled, will either return an Object with the
         * response or an Error with the problem.
         */

    }, {
        key: 'addMediaToCollection',
        value: function addMediaToCollection(queryObject) {
            if (!this.validURL()) {
                return rejectURL();
            }
            if (!queryObject.id) {
                return rejectValidation('collection', 'id');
            }
            if (!queryObject.data) {
                return rejectValidation('collection', 'data');
            }
            var request = new APICall(this.baseURL, 'v4/collections/' + queryObject.id + '/media/', 'POST', this.consumerToken, this.accessToken, { data: JSON.stringify(queryObject.data) });
            return request.send();
        }

        /**
         * Remove assets from desired collection.
         * @see {@link http://docs.bynder.apiary.io/#reference/collections/specific-collection-operations/remove-asset-from-a-collection|API Call}
         * @param {Object} queryObject={} - An object containing the id of the desired collection and deleteIds of assets.
         * @param {String} queryObject.id - The id of the shared collection.
         * @param {String} queryObject.deleteIds - Asset ids to remove from the collection
         * @return {Promise} Response - Returns a Promise that, when fulfilled, will either return an Object with the
         * response or an Error with the problem.
         */

    }, {
        key: 'deleteMediaFromCollection',
        value: function deleteMediaFromCollection(queryObject) {
            var parametersObject = queryObject;
            if (!this.validURL()) {
                return rejectURL();
            }
            if (!queryObject.id) {
                return rejectValidation('collection', 'id');
            }
            if (!queryObject.deleteIds) {
                return rejectValidation('collection', 'deleteIds');
            }
            if (Array.isArray(parametersObject.deleteIds)) {
                parametersObject.deleteIds = parametersObject.deleteIds.join();
            }
            var request = new APICall(this.baseURL, 'v4/collections/' + queryObject.id + '/media/', 'DELETE', this.consumerToken, this.accessToken, parametersObject);
            return request.send();
        }

        /**
         * Share the collection to the recipients provided.
         * @see {@link http://docs.bynder.apiary.io/#reference/collections/specific-collection-operations/share-collection|API Call}
         * @param {Object} queryObject={} - An object containing the id of the desired collection.
         * @param {String} queryObject.id - The id of the shared collection.
         * @param {String} queryObject.recipients - The email addressed of the recipients.
         * @param {String} queryObject.collectionOptions - The recipent right of the shared collection: view, edit
         * @return {Promise} Collection - Returns a Promise that, when fulfilled, will either return an Object with the
         * collection or an Error with the problem.
         */

    }, {
        key: 'shareCollection',
        value: function shareCollection(queryObject) {
            if (!this.validURL()) {
                return rejectURL();
            }
            if (!queryObject.id) {
                return rejectValidation('collection', 'id');
            }
            if (!queryObject.recipients) {
                return rejectValidation('collection', 'recipients');
            }
            if (!queryObject.collectionOptions) {
                return rejectValidation('collection', 'collectionOptions');
            }
            var request = new APICall(this.baseURL, 'v4/collections/' + queryObject.id + '/share/', 'POST', this.consumerToken, this.accessToken, queryObject);
            return request.send();
        }

        /**
         * Get a list of brands and subbrands
         * @see {@link https://bynder.docs.apiary.io/#reference/security-roles/specific-security-profile/retrieve-brands-and-subbrands}
         * @return {Promise}
         */

    }, {
        key: 'getBrands',
        value: function getBrands() {
            if (!this.validURL()) {
                return rejectURL();
            }
            var request = new APICall(this.baseURL, 'v4/brands/', 'GET', this.consumerToken, this.accessToken);
            return request.send();
        }

        /**
         * Gets the closest Amazon S3 bucket location to upload to.
         * @see {@link https://bynder.docs.apiary.io/#reference/upload-assets/1-get-closest-amazons3-upload-endpoint/get-closest-amazons3-upload-endpoint}
         * @return {Promise} Amazon S3 location url string.
         */

    }, {
        key: 'getClosestUploadEndpoint',
        value: function getClosestUploadEndpoint() {
            if (!this.validURL()) {
                return rejectURL();
            }
            var request = new APICall(this.baseURL, 'upload/endpoint', 'GET', this.consumerToken, this.accessToken);
            return request.send();
        }

        /**
         * Starts the upload process. Registers a file upload with Bynder and returns authorisation information to allow
         * uploading to the Amazon S3 bucket-endpoint.
         * @see {@link https://bynder.docs.apiary.io/#reference/upload-assets/2-initialise-upload/initialise-upload}
         * @param {String} filename - filename
         * @return {Promise} Relevant S3 file information, necessary for the file upload.
         */

    }, {
        key: 'initUpload',
        value: function initUpload(filename) {
            if (!this.validURL()) {
                return rejectURL();
            }
            if (!filename) {
                return rejectValidation('upload', 'filename');
            }
            var request = new APICall(this.baseURL, 'upload/init', 'POST', this.consumerToken, this.accessToken, { filename: filename });
            return request.send();
        }

        /**
         * Registers a temporary chunk in Bynder.
         * @see {@link https://bynder.docs.apiary.io/#reference/upload-assets/3-upload-file-in-chunks-and-register-every-uploaded-chunk/register-uploaded-chunk}
         * @param {Object} init - result from init upload
         * @param {Number} chunkNumber - chunk number
         * @return {Promise}
         */

    }, {
        key: 'registerChunk',
        value: function registerChunk(init, chunkNumber) {
            if (!this.validURL()) {
                return rejectURL();
            }
            var s3file = init.s3file,
                filename = init.s3_filename;
            var uploadid = s3file.uploadid,
                targetid = s3file.targetid;

            var request = new APICall(this.baseURL, 'v4/upload/', 'POST', this.consumerToken, this.accessToken, {
                id: uploadid,
                targetid: targetid,
                filename: filename + '/p' + chunkNumber,
                chunkNumber: chunkNumber
            });
            return request.send();
        }

        /**
         * Finalises the file upload when all chunks finished uploading and registers it in Bynder.
         * @see {@link https://bynder.docs.apiary.io/#reference/upload-assets/4-finalise-a-completely-uploaded-file/finalise-a-completely-uploaded-file}
         * @param {Object} init - Result from init upload
         * @param {String} fileName - Original file name
         * @param {Number} chunks - Number of chunks
         * @return {Promise}
         */

    }, {
        key: 'finaliseUpload',
        value: function finaliseUpload(init, filename, chunks) {
            if (!this.validURL()) {
                return rejectURL();
            }
            var s3file = init.s3file,
                s3filename = init.s3_filename;
            var uploadid = s3file.uploadid,
                targetid = s3file.targetid;

            var request = new APICall(this.baseURL, 'v4/upload/' + uploadid + '/', 'POST', this.consumerToken, this.accessToken, {
                targetid: targetid,
                s3_filename: s3filename + '/p' + chunks,
                original_filename: filename,
                chunks: chunks
            });
            return request.send();
        }

        /**
         * Checks if the files have finished uploading.
         * @see {@link https://bynder.docs.apiary.io/#reference/upload-assets/5-poll-processing-state-of-finalised-files/retrieve-entry-point}
         * @param {String[]} importIds - The import IDs of the files to be checked.
         * @return {Promise}
         */

    }, {
        key: 'pollUploadStatus',
        value: function pollUploadStatus(importIds) {
            if (!this.validURL()) {
                return rejectURL();
            }
            var request = new APICall(this.baseURL, 'v4/upload/poll/', 'GET', this.consumerToken, this.accessToken, { items: importIds.join(',') });
            return request.send();
        }

        /**
         * Resolves once assets are uploaded, or rejects after 60 attempts with 2000ms between them
         * @param {String[]} importIds - The import IDs of the files to be checked.
         * @return {Promise}
         */

    }, {
        key: 'waitForUploadDone',
        value: function waitForUploadDone(importIds) {
            var POLLING_INTERVAL = 2000;
            var MAX_POLLING_ATTEMPTS = 60;
            var pollUploadStatus = this.pollUploadStatus.bind(this);
            return new Promise(function (resolve, reject) {
                var attempt = 0;
                (function checkStatus() {
                    pollUploadStatus(importIds).then(function (pollStatus) {
                        if (pollStatus !== null) {
                            var itemsDone = pollStatus.itemsDone,
                                itemsFailed = pollStatus.itemsFailed;

                            if (itemsDone.length === importIds.length) {
                                // done !
                                return resolve({ itemsDone: itemsDone });
                            }
                            if (itemsFailed.length > 0) {
                                // failed
                                return reject({ itemsFailed: itemsFailed });
                            }
                        }
                        if (++attempt > MAX_POLLING_ATTEMPTS) {
                            // timed out
                            return reject(new Error('Stopped polling after ' + attempt + ' attempts'));
                        }
                        return setTimeout(checkStatus, POLLING_INTERVAL);
                    }).catch(reject);
                })();
            });
        }

        /**
         * Saves a media asset in Bynder. If media id is specified in the data a new version of the asset will be saved.
         * Otherwise a new asset will be saved.
         * @see {@link https://bynder.docs.apiary.io/#reference/upload-assets/4-finalise-a-completely-uploaded-file/save-as-a-new-asset}
         * @param {Object} data - Asset data
         * @return {Promise}
         */

    }, {
        key: 'saveAsset',
        value: function saveAsset(data) {
            if (!this.validURL()) {
                return rejectURL();
            }
            var brandId = data.brandId,
                mediaId = data.mediaId;

            if (!brandId) {
                return rejectValidation('upload', 'brandId');
            }
            var saveURL = mediaId ? 'v4/media/' + mediaId + '/save/' : 'v4/media/save/';
            var request = new APICall(this.baseURL, saveURL, 'POST', this.consumerToken, this.accessToken, data);
            return request.send();
        }

        /**
         * Uploads arbirtrarily sized buffer or stream file to provided S3 endpoint in chunks and registers each chunk to Bynder.
         * Resolves the passed init result and final chunk number.
         * @param {Object} file ={} - An object containing the id of the desired collection.
         * @param {String} file.filename - The file name of the file to be saved
         * @param {Buffer|Readable} file.body - The file to be uploaded. Can be either buffer or a read stream.
         * @param {Number} file.length - The length of the file to be uploaded
         * @param {string} endpoint - S3 endpoint url
         * @param {Object} init - Result from init upload
         * @return {Promise}
         */

    }, {
        key: 'uploadFileInChunks',
        value: function uploadFileInChunks(file, endpoint, init) {
            var body = file.body;

            var bodyType = bodyTypes.get(body);
            var length = getLength(file);
            var CHUNK_SIZE = 1024 * 1024 * 5;
            var chunks = Math.ceil(length / CHUNK_SIZE);

            var registerChunk = this.registerChunk.bind(this);
            var uploadPath = init.multipart_params.key;

            var uploadChunkToS3 = function uploadChunkToS3(chunkData, chunkNumber) {
                var form = new FormData();
                var params = Object.assign(init.multipart_params, {
                    name: (0, _path.basename)(uploadPath) + '/p' + chunkNumber,
                    chunk: chunkNumber,
                    chunks: chunks,
                    Filename: uploadPath + '/p' + chunkNumber,
                    key: uploadPath + '/p' + chunkNumber
                });
                Object.keys(params).forEach(function (key) {
                    form.append(key, params[key]);
                });
                form.append('file', chunkData);
                var opts = void 0;
                if (typeof window !== 'undefined') {
                    opts = {}; // With browser based FormData headers are taken care of automatically
                } else {
                    opts = {
                        headers: Object.assign(form.getHeaders(), {
                            'content-length': form.getLengthSync()
                        })
                    };
                }
                return _axios2.default.post(endpoint, form, opts);
            };

            // sequentially upload chunks to AWS, then register them
            return new Promise(function (resolve, reject) {
                var chunkNumber = 0;
                (function nextChunk() {
                    if (chunkNumber >= chunks) {
                        // we are finished, pass init and chunk number to be finalised
                        return resolve({ init: init, chunkNumber: chunkNumber });
                    }
                    // upload next chunk
                    var chunkData = void 0;
                    if (bodyType === bodyTypes.STREAM) {
                        // handle stream data
                        chunkData = body.read(CHUNK_SIZE);
                        if (chunkData === null) {
                            // our read stream is not done yet reading
                            // let's wait for a while...
                            return setTimeout(nextChunk, 50);
                        }
                    } else {
                        // handle buffer/blob data
                        var start = chunkNumber * CHUNK_SIZE;
                        var end = Math.min(start + CHUNK_SIZE, length);
                        chunkData = body.slice(start, end);
                    }
                    return uploadChunkToS3(chunkData, ++chunkNumber).then(function () {
                        // register uploaded chunk to Bynder
                        return registerChunk(init, chunkNumber);
                    }).then(nextChunk).catch(reject);
                })();
            });
        }

        /**
         * Uploads an arbitrarily sized buffer or stream file and returns the uploaded asset information
         * @see {@link https://bynder.docs.apiary.io/#reference/upload-assets}
         * @param {Object} file={} - An object containing the id of the desired collection.
         * @param {String} file.filename - The file name of the file to be saved
         * @param {Buffer|Readable} file.body - The file to be uploaded. Can be either buffer or a read stream.
         * @param {Number} file.length - The length of the file to be uploaded
         * @param {Object} file.data={} - An object containing the assets' attributes
         * @return {Promise} The information of the uploaded file, including IDs and all final file urls.
         */

    }, {
        key: 'uploadFile',
        value: function uploadFile(file) {
            var body = file.body,
                filename = file.filename,
                data = file.data;
            var brandId = data.brandId;

            var bodyType = bodyTypes.get(body);
            var length = getLength(file);

            if (!this.validURL()) {
                return rejectURL();
            }
            if (!brandId) {
                return rejectValidation('upload', 'brandId');
            }
            if (!filename) {
                return rejectValidation('upload', 'filename');
            }
            if (!body || !bodyType) {
                return rejectValidation('upload', 'body');
            }
            if (!length || typeof length !== 'number') {
                return rejectValidation('upload', 'length');
            }

            var getClosestUploadEndpoint = this.getClosestUploadEndpoint.bind(this);
            var initUpload = this.initUpload.bind(this);
            var uploadFileInChunks = this.uploadFileInChunks.bind(this);
            var finaliseUpload = this.finaliseUpload.bind(this);
            var saveAsset = this.saveAsset.bind(this);
            var waitForUploadDone = this.waitForUploadDone.bind(this);

            return Promise.all([getClosestUploadEndpoint(), initUpload(filename)]).then(function (res) {
                var _res = _slicedToArray(res, 2),
                    endpoint = _res[0],
                    init = _res[1];

                return uploadFileInChunks(file, endpoint, init);
            }).then(function (uploadResponse) {
                var init = uploadResponse.init,
                    chunkNumber = uploadResponse.chunkNumber;

                return finaliseUpload(init, filename, chunkNumber);
            }).then(function (finalizeResponse) {
                var importId = finalizeResponse.importId;

                return waitForUploadDone([importId]);
            }).then(function (doneResponse) {
                var itemsDone = doneResponse.itemsDone;

                var importId = itemsDone[0];
                return saveAsset(Object.assign(data, { importId: importId }));
            });
        }
    }]);

    return Bynder;
}();

exports.default = Bynder;