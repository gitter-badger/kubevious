const _ = require('the-lodash');
const Promise = require('the-promise');
const Path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

class K8sMockLoader 
{
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger("K8sMockLoader");
        this.logger.info("Constructed");
    }

    get logger() {
        return this._logger;
    }

    run()
    {
        var dirName = Path.resolve(__dirname, '..', '..', 'mock', 'data');
        for(var name of fs.readdirSync(dirName))
        {
            var fname = Path.join(dirName, name);
            var contents = fs.readFileSync(fname);
            var obj = null;
            if (fname.endsWith('.json')) {
                obj = JSON.parse(contents);
            } else if (fname.endsWith('.yaml')) {
                obj = yaml.safeLoad(contents);
            }
            if (obj) {
                this._handle(true, obj);
            }
        }
    }

    _handle(isPresent, obj)
    {
        this._logger.info("Handle: %s, present: %s", obj.kind, isPresent);

        this._context.k8sParser.parse(isPresent, obj);
    }

}

module.exports = K8sMockLoader;