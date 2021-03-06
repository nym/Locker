/*
*
* Copyright (C) 2011, The Locker Project
* All rights reserved.
*
* Please see the LICENSE file for more information.
*
*/

var vows = require("vows");
var assert = require("assert");
require.paths.push(__dirname + "/../Common/node");
var lpquery = require("lpquery");

vows.describe("Query System").addBatch({
    "Parsing a basic query" : {
        topic:lpquery.parse("/getPhotos?terms=[keyword:'test']"),
        "generates a valid parse tree":function(topic) {
            assert.equal(topic[0], "Photos");
            assert.isObject(topic[1]);
            assert.isArray(topic[1]["terms"]);
            assert.isArray(topic[1]["terms"][0]);
            assert.equal(topic[1]["terms"][0][0], "keyValue");
            assert.equal(topic[1]["terms"][0][1], "keyword");
            assert.equal(topic[1]["terms"][0][2], "test");
        },
        "can be turned into a mongoDB query":function(topic) {
            var mongoQuery = lpquery.buildMongoQuery(topic);
            assert.deepEqual(mongoQuery, {collection:"photos", query:{keyword:"test"}});
        }
    },
    "Parsing an invalid query" : {
        "results in a parse error": function() {
            try {
                var res = lpquery.parse("/invalid");
            } catch(E) {
                assert.instanceOf(E, Error);
            }
        }
    },
    "Advanced query operators" : {
        topic:lpquery.parse("/getPhotos?terms=[gt:21+, gte:22+., lt:20-, lte:19-., (key:1 OR key:2)]&limit=10"),
        "generate a valid parse tree":function(topic) {
            assert.deepEqual(topic, [ 'Photos',
              { terms: 
                 [ [ 'keyValue', 'gt', [ '+', 21 ] ],
                   [ 'keyValue', 'gte', [ '+.', 22 ] ],
                   [ 'keyValue', 'lt', [ '-', 20 ] ],
                   [ 'keyValue', 'lte', [ '-.', 19 ] ],
                   [ 'subset',
                     [ [ 'OR',
                         [ [ 'keyValue', 'key', 1 ], [ 'keyValue', 'key', 2 ] ] ] ] ] ],
                limit: 10 } ]);
        },
        "can be turned into a mongo query":function(topic) {
            assert.deepEqual(lpquery.buildMongoQuery(topic), {
                collection: 'photos',
                query: {
                    gt: { $gt: 21 },
                    gte: { $gte: 22 },
                    lt: { $lt: 20 },
                    lte: { $lte: 19 },
                    $or: [
                        { key: 1 },
                        { key: 2 }
                    ]
                },
                limit: 10
            });
        }
    }
}).export(module);
