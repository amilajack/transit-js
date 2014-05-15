// Copyright (c) Cognitect, Inc.
// All rights reserved.

"use strict";

var d = require("./delimiters");

var MIN_SIZE_CACHEABLE = 3;
var MAX_CACHE_ENTRIES  = 94;
var BASE_CHAR_IDX      = 33;

function isCacheable(string, asMapKey) {
    if(string.length > MIN_SIZE_CACHEABLE) {
        if(asMapKey) {
            return true;
        } else {
            var c0 = string[0],
                c1 = string[1];
            if(c0 === d.ESC) {
                return c1 === ":" || c1 === "$" || c1 === "#";
            } else {
                return false;
            }
        }
    } else {
        return false;
    }
}

// =============================================================================
// WriteCache

function idxToCode(idx) {
    return d.SUB + String.fromCharCode(idx + BASE_CHAR_IDX);
}

var WriteCache = function() {
    this.idx = 0;
    this.cache = {};
}

WriteCache.prototype = {
    write: function(string, asMapKey) {
        if(string != null && isCacheable(string, asMapKey)) {
            var val = this.cache[string];
            if(val != null) {
                return val;
            } else {
                if(this.idx === MAX_CACHE_ENTRIES) {
                    this.idx = 0;
                    this.cache = {};
                }
                this.cache[string] = idxToCode(this.idx);
                this.idx++;
                return string;
            }
        } else {
            return string;
        }
    },

    clear: function() {
        this.cache = {};
        this.idx = 0;
    }
};

function writeCache() {
    return new WriteCache();
}

// =============================================================================
// ReadCache

function isCacheCode(string) {
    return string[0] === d.SUB;
}

function codeToIdx(code) {
    return code.charCodeAt(1) - BASE_CHAR_IDX;
}

var ReadCache = function() {
    this.idx = 0;
    this.cache = null;
};

ReadCache.prototype = {
    guaranteeCache: function() {
        if(this.cache) return;
        this.cache = [];
        for(var i = 0; i < MAX_CACHE_ENTRIES; i++) {
            this.cache.push(null);
        }
    },
    
    write: function(string, obj, asMapKey) {
        this.guaranteeCache();
        if(this.idx == MAX_CACHE_ENTRIES) {
            this.idx = 0;
        }
        this.cache[this.idx] = [obj, string];
        this.idx++;
        return obj;
    },

    read: function(string, asMapKey) {
        this.guaranteeCache();
        var ret = this.cache[codeToIdx(string)];
        if(asMapKey) {
            if(ret[0] === ret[1]) {
                return ret[1];
            } else {
                return d.RES+ret[1];
            }
        } else {
            return ret[0];
        }
    },

    clear: function() {
        this.idx = 0;
    }
};

function readCache() {
    return new ReadCache();
}

module.exports = {
    isCacheable: isCacheable,
    isCacheCode: isCacheCode,
    writeCache: writeCache,
    readCache: readCache,
    MAX_CACHE_ENTRIES: MAX_CACHE_ENTRIES
};
