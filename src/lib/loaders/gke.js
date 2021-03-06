const K8sClient = require('k8s-super-client');
const K8sLoader = require('./k8s');

class GKELoader 
{
    constructor(context, credentials, name, region)
    {
        this._context = context;
        this._logger = context.logger.sublogger("GKELoader");
        this._credentials = credentials;
        this._name = name;
        this._region = region;

        this.logger.info("Constructed");
    }

    get logger() {
        return this._logger;
    }
    
    run()
    {
        return K8sClient.connectToGKE(this._logger, this._credentials, this._name, this._region)
            .then(client => {
                var info = {
                    infra: "gke",
                    project: this._credentials.project_id,
                    cluster: this.name,
                    region: this._region
                }
        
                var loader = new K8sLoader(this._context, client, info);
                return loader.run();
            })
    }
}

module.exports = GKELoader;