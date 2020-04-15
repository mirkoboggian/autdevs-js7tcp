const events = require('events');
const { S7Socket } = require("./s7socket");
const S7Tag = require("./s7tag");
const { MAXREADBYTES } = require("./s7comm");

class S7Tcp extends events {

    /**
     * The server that manage read/write request, notify subscriptions on tag changes.
     * @param {S7Socket} socket The S7Tcp socket used to Read/Write data 
     * @param {Array} tags An array of S7Tag
     */
    constructor(socket, tags) {
        // events
        super();
        // local
        this.requestId = 0;
        //socket
        this.socket = socket;
        this.socket.on('connect', this.#onSocketConnect);
        this.socket.on('error', this.#onSocketError);
        this.socket.on('read', (result, seqNumber) => {});
        this.socket.on('write', (result, seqNumber) => {});
        // tags
        this.tags = tags;
        this.tagTasks = this.#generateTagTasks();
    }

     /**
     * Create a S7Tcp instance using a config object
     * @param {object} config JSON like object
     */
    static fromConfig(config) {
        try {
            // socket
            let confSocket = config.socket;
            let socket = S7Socket.fromConfig(confSocket);
            // tags            
            let confTags = config.tags;
            let tags = [];
            confTags.forEach(confTag => {
                tags.push(S7Tag.fromConfig(confTag));
            });
            let s7tcp = new S7Tcp(socket, tags);
            return s7tcp;
        } catch(e) {
            let err = new Error("This config is not a valid config for S7Tcp.", e.message);
            throw err;
        }
    }

    #generateTagTasks = () => {
        // group by area
        let areaTags = S7Tag.groupTagsByArea(this.tags);
        // sort each area tags
        Object.keys(areaTags).forEach(areaTag => {
            areaTags[areaTag] = areaTags[areaTag].sort(S7Tag.sorter);
        });
        // create tagTasks
        let tagTasks = [];
        Object.keys(areaTags).forEach(areaTag => {
            let startOffset = null;
            areaTags[areaTag].forEach(tag => {
                if (currentTagTask!= null && S7Tag.tagIsInTagTask(currentTagTask.task, tag)) {
                    // add tag to tags list
                    currentTagTask.tags.push(tag);
                    // update array size of task (MAXREADBYTES can overflow PLC memory area)
                    currentTagTask.task.array = S7Tag.bytesTotal(tag, currentTagTask.task);
                } else {
                    // create a new tagTask (polling read task)
                    let db = tag.db;
                    let areaCode = tag.areaCode;
                    let typeCode = "B";
                    let offset = tag.offset;
                    let bit = null;
                    let array = tag.bytesSize();
                    let symbol = `TASK_${areaTag}_${offset}`
                    currentTagTask = {
                        task: new S7Tag(symbol, db, areaCode, typeCode, offset, bit, array),
                        tags: [tag] };
                    tagTasks.push(currentTagTask);
                }
            });
        });
        return tagTasks;
    }

    #onSocketConnect = (seqNumber) => {
        console.log(`(${seqNumber}) : SOCKET CONNESSA!`);
        // start polling tasks
    }

    #onSocketError = (error) => {
        console.error(error);
    }

    // End

}

module.exports = S7Tcp;