const _ = require("the-lodash");
const FlexSearch = require("flexsearch");

class SearchEngine
{
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger("SearchEngine");
        this.reset();
    }

    get logger() {
        return this._logger;
    }

    reset()
    {
        this._index = new FlexSearch({
            encode: "icase",
            tokenize: "full",
            threshold: 1,
            resolution: 3,
            depth: 2
        });
    }

    addToIndex(item)
    {
        var doc = _.clone(item.namingArray);
        doc.push(item.prettyKind);
        doc = doc.join(' ');
        this._index.add(item.dn, doc);
    }

    search(criteria)
    {
        if ((!criteria) || criteria.length < 2) {
            return [];
        }  
        var results = this._index.search(criteria);
        this.logger.silly("SEARCH: %s, result: ", criteria, results);
        if (_.isArray(results)) {
            results = results.map(x => ({ dn: x }))
        } else {
            results = [];
        }
        return results;
    }

}


module.exports = SearchEngine;