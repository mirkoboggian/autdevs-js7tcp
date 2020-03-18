config.tags.forEach((tagConf) => {
    let s7tag = S7Tag.fromPath(tagConf.path);
    tags.push({config: tagConf, tag: s7tag });
});

config.tasks.forEach((taskConf) => {
    let intervallTask = setInterval((conf) => {
        if (plc.connected()) {
            console.log("TASK: " + conf.msCycle);
        }                    
    }, taskConf.msCycle, taskConf);
    tasks.push(intervallTask);
});