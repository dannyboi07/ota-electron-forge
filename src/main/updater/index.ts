import { updateElectronApp, UpdateSourceType } from "update-electron-app";
import logger from "electron-log";

class Updater {
    private logger: logger.LogFunctions;

    constructor() {
        this.logger = logger.scope("updater");
    }

    startChecker() {
        updateElectronApp({
            logger: this.logger,
            notifyUser: true,
            updateSource: {
                type: UpdateSourceType.StaticStorage,
                baseUrl: `http://localhost:9000/releases/${process.platform}/${process.arch}`,
            },
        });
    }
}

export default Updater;
