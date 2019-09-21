module.exports = {
    getAllRooms: function() {
        return Object.keys(sails.io.of('/').adapter.rooms);
    },

    /**
     * Returns the room names that a socket is connected to.
     *
     * @param {string} socketIdOrReq - a request `this.req` or a socket id - `sails.sockets.getId(this.req)`
     *
     * @returns {string[]} rooms
     */
    getRoomsOfSocket: function(socketIdOrReq) {
        const socketId = typeof socketIdOrReq === 'string' ? socketIdOrReq : sails.sockets.getId(socketIdOrReq);
        return new Promise((resolve, reject) => {
            sails.io.of('/').adapter.clientRooms(socketId, (err, rooms) => {
                console.log('got rooms of socket:', rooms);
                if (err) {
                    reject(err);
                } else {
                // the "||" because if socket is not connected to any rooms, ids is null
                    resolve(rooms || []);
                }
            });
        });
    }
}