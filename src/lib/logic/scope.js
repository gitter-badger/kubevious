const _ = require("the-lodash");
const LogicItem = require("./item");

class LogicScope
{
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger("LogicScope");

        this._itemMap = {}
        this._root = LogicItem.constructTop(this);
        this._acceptItem(this._root);

        this._configMap = {};
        this._namespaceScopes = {};
    }

    get logger() {
        return this._logger;
    }

    get concreteRegistry() {
        return this._context.concreteRegistry;
    }

    get root() {
        return this._root;
    }

    get configMap() {
        return this._configMap;
    }

    _acceptItem(item) 
    {
        this._itemMap[item.dn] = item;
    }

    _dropItem(item) 
    {
        delete this._itemMap[item.dn];
    }

    extractItems() {
        return this._itemMap;
    }

    findItem(dn)
    {
        var item = this._itemMap[dn];
        if (!item) {
            item = null;
        }
        return item;
    }
    
    getNamespaceScope(name) {
        if (!this._namespaceScopes[name]) {
            this._namespaceScopes[name] = new NamespaceScope(this, name);
        }
        return this._namespaceScopes[name];
    }

    setK8sConfig(logicItem, config)
    {
        logicItem.setConfig(config);
        this.configMap[logicItem.dn] = config;

        logicItem.addProperties({
            kind: "yaml",
            id: "config",
            title: "Config",
            config: config
        });
    }

    fetchRawContainer(item, name)
    {
        var namespace = this.root.fetchByNaming("ns", item.config.metadata.namespace);
        var rawContainer = namespace.fetchByNaming("raw", "Raw Configs");
        rawContainer.order = 1000;
        var container = rawContainer.fetchByNaming("raw", name);
        return container;
    }

    findAppsByLabels(namespace, selector)
    {
        var result = [];
        var namespaceScope = this.getNamespaceScope(namespace);
        for(var appLabelInfo of namespaceScope.appLabels)
        {
            if (this._labelsMatch(appLabelInfo.labels, selector))
            {
                result.push(appLabelInfo.appItem);
            }
        }
        return result;
    }

    _labelsMatch(labels, selector)
    {
        for(var key of _.keys(selector)) {
            if (selector[key] != labels[key]) {
                return false;
            }
        }
        return true;
    }
    
    findAppItem(namespace, name)
    {
        return this._findItem([
            {
                kind: "ns",
                name: namespace
            },
            {
                kind: "app",
                name: name
            }
        ]);
    }

    _findItem(itemPath)
    {
        var item = this.root;
        for(var x of itemPath) {
            item = item.findByNaming(x.kind, x.name);
            if (!item) {
                return null;
            }
        }
        return item;
    }
}

class NamespaceScope
{
    constructor(parent, name)
    {
        this._parent = parent;
        this._logger = parent.logger;
        this._name = name;

        this.appLabels = [];
        this.apps = {};
        this.services = {};
        this.appControllers = {};
        this.appOwners = {};
        this.configMaps = {};
        this.ingresses = {};
        this.secrets = {};
    }

    get logger() {
        return this._logger;
    }

    get name() {
        return this._name;
    }

    registerAppOwner(owner)
    {
        if (!this.appOwners[owner.config.kind]) {
            this.appOwners[owner.config.kind] = {};
        }
        if (!this.appOwners[owner.config.kind][owner.config.metadata.name]) {
            this.appOwners[owner.config.kind][owner.config.metadata.name] = [];
        }
        this.appOwners[owner.config.kind][owner.config.metadata.name].push(owner);
    }

    getAppOwners(kind, name)
    {
        if (!this.appOwners[kind]) {
            return []
        }
        if (!this.appOwners[kind][name]) {
            return []
        }
        return this.appOwners[kind][name];
    }

    getSecret(name)
    {
        if (!this.secrets[name]) {
            this.secrets[name] = {
                usedBy: {}
            }
        }
        return this.secrets[name];
    }
}

module.exports = LogicScope;