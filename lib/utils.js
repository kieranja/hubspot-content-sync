
function filterKeys(obj, allowList) {
    for (let prop in obj) {
        if (allowList.indexOf(prop) < 0) {
            delete obj[prop];
        }
    }
    return obj;
}

function getIdFromPath(strPath) {
    if (!strPath) {
        return false;
    }

    const match = strPath.match(/([0-9]+)/);

    if (typeof match === 'undefined' || !match || !match[1]) {
        return false;
    }
    
    return match[1];
}
function getCwd() {
    if (process.env.INIT_CWD) {
        return process.env.INIT_CWD;
    }
    return process.cwd();
};
module.exports = {
    getIdFromPath: getIdFromPath,
    filterKeys: filterKeys,
    getCwd: getCwd
}